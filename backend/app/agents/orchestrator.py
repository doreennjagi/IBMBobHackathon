"""
SubLeech Agent Orchestrator
LangChain-based orchestration for watsonx Orchestrate agents
Routes subscription actions to specialized cancellation and negotiation agents

Supports two modes:
- MOCK MODE: Uses local prompt rendering (no API calls)
- LIVE MODE: Uses watsonx Orchestrate API for real agent invocation
"""

import os
import logging
from typing import Dict, Any, Literal, Optional, Union
from dataclasses import dataclass

try:
    from langchain_core.prompts import PromptTemplate
    from langchain.chains import LLMChain
    from langchain_ibm import WatsonxLLM
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    PromptTemplate = None
    LLMChain = None
    WatsonxLLM = None

from .prompt_loader import PromptTemplateLoader
from .orchestrate_client import get_orchestrate_client, OrchestrateResponse
from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class AgentResponse:
    """Structured response from an agent"""
    action: Literal["cancel", "negotiate"]
    provider_name: str
    generated_text: str
    model_used: str
    confidence_score: float
    metadata: Dict[str, Any]


class SubLeechAgentOrchestrator:
    """
    Central orchestration layer for SubLeech AI agents
    Routes flagged subscriptions to appropriate specialized agents
    """
    
    def __init__(
        self,
        watsonx_api_key: str | None = None,
        watsonx_project_id: str | None = None,
        watsonx_url: str | None = None,
        use_live_mode: bool | None = None
    ):
        """
        Initialize the agent orchestrator
        
        Args:
            watsonx_api_key: IBM watsonx API key (defaults to env var)
            watsonx_project_id: IBM watsonx project ID (defaults to env var)
            watsonx_url: IBM watsonx API URL (defaults to env var)
            use_live_mode: Force live/mock mode (defaults to config setting)
        """
        self.settings = get_settings()
        self.api_key = watsonx_api_key or os.getenv("WATSONX_API_KEY", "")
        self.project_id = watsonx_project_id or os.getenv("WATSONX_PROJECT_ID", "")
        self.url = watsonx_url or os.getenv(
            "WATSONX_URL",
            "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29"
        )
        
        # Determine mode: live (watsonx Orchestrate API) or mock (local rendering)
        if use_live_mode is not None:
            self.use_live_mode = use_live_mode
        else:
            self.use_live_mode = self.settings.is_live_mode
        
        self.prompt_loader = PromptTemplateLoader()
        self._llm_cache: Dict[str, Any] = {}
        
        # Initialize Orchestrate client for live mode
        if self.use_live_mode:
            self.orchestrate_client = get_orchestrate_client()
            logger.info("SubLeech Orchestrator initialized in LIVE MODE (watsonx Orchestrate API)")
        else:
            self.orchestrate_client = None
            logger.info("SubLeech Orchestrator initialized in MOCK MODE (local rendering)")
    
    def _get_llm(self, agent_name: str) -> Optional[Any]:
        """
        Get or create a LangChain LLM instance for an agent
        
        Args:
            agent_name: Name of the agent (cancellation_agent, negotiation_agent)
            
        Returns:
            WatsonxLLM instance or None if API key not configured
        """
        if not self.api_key:
            return None
        
        if agent_name in self._llm_cache:
            return self._llm_cache[agent_name]
        
        # Load model config from skill definition
        model_config = self.prompt_loader.get_model_config(agent_name)
        model_id = model_config.get("model_id", "ibm/granite-13b-chat-v2")
        parameters = model_config.get("parameters", {})
        
        # Create WatsonxLLM instance
        llm = WatsonxLLM(
            model_id=model_id,
            url=self.url,
            apikey=self.api_key,
            project_id=self.project_id,
            params={
                "decoding_method": "greedy",
                "max_new_tokens": parameters.get("max_tokens", 800),
                "temperature": parameters.get("temperature", 0.3),
                "top_p": parameters.get("top_p", 0.9),
            }
        )
        
        self._llm_cache[agent_name] = llm
        return llm
    
    async def route_to_agent(
        self,
        action: Literal["cancel", "negotiate"],
        provider_name: str,
        monthly_cost: float,
        user_name: str,
        account_type: str = "personal",
        original_cost: float | None = None,
        **kwargs
    ) -> AgentResponse:
        """
        Route a subscription action to the appropriate specialized agent
        
        Supports two execution modes:
        - LIVE MODE: Calls watsonx Orchestrate API with real agent skills
        - MOCK MODE: Uses local LangChain with prompt rendering
        
        Args:
            action: "cancel" or "negotiate"
            provider_name: Name of subscription provider
            monthly_cost: Current monthly cost
            user_name: User's name for personalization
            account_type: "personal" or "business"
            original_cost: Original cost (for negotiation)
            **kwargs: Additional context (account_number, cancellation_reason, etc.)
            
        Returns:
            AgentResponse with generated text and metadata
        """
        # Determine which agent to use
        agent_name = "cancellation_agent" if action == "cancel" else "negotiation_agent"
        
        # Prepare context for prompt rendering
        context = {
            "provider_name": provider_name,
            "monthly_cost": monthly_cost,
            "user_name": user_name,
            "account_type": account_type,
            **kwargs
        }
        
        # Add negotiation-specific context
        if action == "negotiate" and original_cost:
            context["original_cost"] = original_cost
            increase_pct = ((monthly_cost - original_cost) / original_cost * 100) if original_cost else 0
            context["increase_percentage"] = round(increase_pct, 1)
        
        # Validate input against schema
        is_valid, error = self.prompt_loader.validate_input(agent_name, context)
        if not is_valid:
            raise ValueError(f"Invalid input for {agent_name}: {error}")
        
        # LIVE MODE: Use watsonx Orchestrate API
        if self.use_live_mode and self.orchestrate_client:
            logger.info(f"Invoking {agent_name} via watsonx Orchestrate API (LIVE MODE)")
            
            try:
                if action == "cancel":
                    orchestrate_response = await self.orchestrate_client.invoke_cancellation_agent(
                        provider_name=provider_name,
                        monthly_cost=monthly_cost,
                        user_name=user_name,
                        account_type=account_type,
                        cancellation_reason=kwargs.get("cancellation_reason")
                    )
                else:  # negotiate
                    orchestrate_response = await self.orchestrate_client.invoke_negotiation_agent(
                        provider_name=provider_name,
                        monthly_cost=monthly_cost,
                        original_cost=original_cost or monthly_cost,
                        subscription_duration_months=kwargs.get("subscription_duration_months", 12),
                        hardship_type=kwargs.get("hardship_type", "price_increase")
                    )
                
                if not orchestrate_response.success:
                    raise RuntimeError(f"Orchestrate API error: {orchestrate_response.error}")
                
                return AgentResponse(
                    action=action,
                    provider_name=provider_name,
                    generated_text=orchestrate_response.generated_text,
                    model_used="watsonx-orchestrate-live",
                    confidence_score=0.95,
                    metadata={
                        "mode": "live",
                        "agent": agent_name,
                        "context": context,
                        "orchestrate_metadata": orchestrate_response.metadata
                    }
                )
                
            except Exception as e:
                logger.error(f"Live mode failed, falling back to mock: {str(e)}")
                # Fall through to mock mode on error
        
        # MOCK MODE: Use local LangChain or simple prompt rendering
        logger.info(f"Using {agent_name} in MOCK MODE (local rendering)")
        
        # Get LLM instance
        llm = self._get_llm(agent_name)
        
        # If no API key, return simple mock response
        if llm is None:
            prompt = self.prompt_loader.render_prompt(agent_name, context)
            return AgentResponse(
                action=action,
                provider_name=provider_name,
                generated_text=f"[MOCK MODE - Set WATSONX_API_KEY for live generation]\n\n{prompt}",
                model_used="mock",
                confidence_score=0.0,
                metadata={"mode": "mock", "context": context}
            )
        
        # Render prompt template
        rendered_prompt = self.prompt_loader.render_prompt(agent_name, context)
        
        # Create LangChain chain
        prompt_template = PromptTemplate(
            input_variables=[],
            template=rendered_prompt
        )
        
        chain = LLMChain(llm=llm, prompt=prompt_template)
        
        # Execute chain
        try:
            result = await chain.arun({})
            
            return AgentResponse(
                action=action,
                provider_name=provider_name,
                generated_text=result.strip(),
                model_used=self.prompt_loader.get_model_config(agent_name).get("model_id", "unknown"),
                confidence_score=0.85,
                metadata={
                    "mode": "langchain",
                    "agent": agent_name,
                    "context": context,
                    "prompt_length": len(rendered_prompt)
                }
            )
        except Exception as e:
            raise RuntimeError(f"Agent execution failed: {str(e)}")
    
    async def generate_cancellation_letter(
        self,
        provider_name: str,
        monthly_cost: float,
        user_name: str,
        account_type: str = "personal",
        account_number: str | None = None,
        cancellation_reason: str | None = None
    ) -> AgentResponse:
        """
        Generate a formal cancellation letter
        
        Convenience method that routes to cancellation_agent
        """
        return await self.route_to_agent(
            action="cancel",
            provider_name=provider_name,
            monthly_cost=monthly_cost,
            user_name=user_name,
            account_type=account_type,
            account_number=account_number,
            cancellation_reason=cancellation_reason
        )
    
    async def generate_negotiation_script(
        self,
        provider_name: str,
        monthly_cost: float,
        original_cost: float,
        subscription_duration_months: int | None = None,
        competitor_pricing: float | None = None,
        hardship_type: str = "financial"
    ) -> AgentResponse:
        """
        Generate a negotiation script
        
        Convenience method that routes to negotiation_agent
        """
        return await self.route_to_agent(
            action="negotiate",
            provider_name=provider_name,
            monthly_cost=monthly_cost,
            user_name="",  # Not needed for negotiation scripts
            original_cost=original_cost,
            subscription_duration_months=subscription_duration_months,
            competitor_pricing=competitor_pricing,
            hardship_type=hardship_type
        )


# Made with Bob