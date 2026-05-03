"""
watsonx Orchestrate API Client
Handles live API calls to IBM watsonx Orchestrate for agent skill invocation
"""

import json
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass
import httpx
from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class OrchestrateResponse:
    """Response from watsonx Orchestrate API"""
    success: bool
    generated_text: str
    metadata: Dict[str, Any]
    error: Optional[str] = None


class WatsonxOrchestrateClient:
    """
    Client for interacting with IBM watsonx Orchestrate API
    
    This client handles:
    - Authentication with IBM Cloud IAM
    - Skill invocation via REST API
    - Error handling and retries
    - Response parsing
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.orchestrate_url
        self.api_key = self.settings.orchestrate_apikey
        self.iam_api_key = self.settings.orchestrate_iam_apikey
        self.auth_type = self.settings.orchestrate_auth_type
        self._access_token: Optional[str] = None
        
    async def _get_iam_token(self) -> str:
        """
        Get IBM Cloud IAM access token
        
        Returns:
            Access token string
            
        Raises:
            httpx.HTTPError: If token request fails
        """
        if self._access_token:
            return self._access_token
            
        token_url = "https://iam.cloud.ibm.com/identity/token"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                },
                data={
                    "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                    "apikey": self.iam_api_key
                }
            )
            response.raise_for_status()
            token_data = response.json()
            self._access_token = token_data["access_token"]
            logger.info("Successfully obtained IAM access token")
            return self._access_token
    
    async def invoke_skill(
        self,
        skill_name: str,
        inputs: Dict[str, Any],
        timeout: int = 30
    ) -> OrchestrateResponse:
        """
        Invoke a watsonx Orchestrate skill
        
        Args:
            skill_name: Name of the skill to invoke (e.g., "cancellation_agent")
            inputs: Dictionary of input parameters for the skill
            timeout: Request timeout in seconds
            
        Returns:
            OrchestrateResponse with generated text and metadata
            
        Example:
            >>> client = WatsonxOrchestrateClient()
            >>> response = await client.invoke_skill(
            ...     "cancellation_agent",
            ...     {
            ...         "provider_name": "Netflix",
            ...         "monthly_cost": 1100.0,
            ...         "user_name": "John Doe"
            ...     }
            ... )
            >>> print(response.generated_text)
        """
        try:
            # Get authentication token
            access_token = await self._get_iam_token()
            
            # Construct skill invocation endpoint
            skill_endpoint = f"{self.base_url}/v1/skills/{skill_name}/invoke"
            
            # Prepare request payload
            payload = {
                "inputs": inputs,
                "parameters": {
                    "return_metadata": True
                }
            }
            
            logger.info(f"Invoking skill '{skill_name}' with inputs: {list(inputs.keys())}")
            
            # Make API request
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    skill_endpoint,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    json=payload
                )
                
                response.raise_for_status()
                result = response.json()
                
                # Parse response
                generated_text = result.get("outputs", {}).get("generated_text", "")
                metadata = result.get("metadata", {})
                
                logger.info(f"Successfully invoked skill '{skill_name}'")
                
                return OrchestrateResponse(
                    success=True,
                    generated_text=generated_text,
                    metadata=metadata
                )
                
        except httpx.HTTPStatusError as e:
            error_msg = f"HTTP error invoking skill '{skill_name}': {e.response.status_code}"
            logger.error(f"{error_msg} - {e.response.text}")
            return OrchestrateResponse(
                success=False,
                generated_text="",
                metadata={},
                error=error_msg
            )
            
        except httpx.RequestError as e:
            error_msg = f"Request error invoking skill '{skill_name}': {str(e)}"
            logger.error(error_msg)
            return OrchestrateResponse(
                success=False,
                generated_text="",
                metadata={},
                error=error_msg
            )
            
        except Exception as e:
            error_msg = f"Unexpected error invoking skill '{skill_name}': {str(e)}"
            logger.error(error_msg, exc_info=True)
            return OrchestrateResponse(
                success=False,
                generated_text="",
                metadata={},
                error=error_msg
            )
    
    async def invoke_cancellation_agent(
        self,
        provider_name: str,
        monthly_cost: float,
        user_name: str,
        account_type: str = "personal",
        cancellation_reason: Optional[str] = None
    ) -> OrchestrateResponse:
        """
        Convenience method to invoke the cancellation agent skill
        
        Args:
            provider_name: Name of the subscription provider
            monthly_cost: Monthly subscription cost
            user_name: User's full name
            account_type: Type of account (personal/business)
            cancellation_reason: Optional reason for cancellation
            
        Returns:
            OrchestrateResponse with generated cancellation letter
        """
        inputs = {
            "provider_name": provider_name,
            "monthly_cost": monthly_cost,
            "user_name": user_name,
            "account_type": account_type
        }
        
        if cancellation_reason:
            inputs["cancellation_reason"] = cancellation_reason
            
        return await self.invoke_skill("cancellation_agent", inputs)
    
    async def invoke_negotiation_agent(
        self,
        provider_name: str,
        monthly_cost: float,
        original_cost: float,
        subscription_duration_months: int,
        hardship_type: str = "price_increase"
    ) -> OrchestrateResponse:
        """
        Convenience method to invoke the negotiation agent skill
        
        Args:
            provider_name: Name of the subscription provider
            monthly_cost: Current monthly cost
            original_cost: Original monthly cost
            subscription_duration_months: How long user has been subscribed
            hardship_type: Type of hardship (price_increase/financial/service_quality)
            
        Returns:
            OrchestrateResponse with generated negotiation script
        """
        inputs = {
            "provider_name": provider_name,
            "monthly_cost": monthly_cost,
            "original_cost": original_cost,
            "subscription_duration_months": subscription_duration_months,
            "hardship_type": hardship_type
        }
        
        return await self.invoke_skill("negotiation_agent", inputs)
    
    async def health_check(self) -> bool:
        """
        Check if watsonx Orchestrate API is accessible
        
        Returns:
            True if API is accessible, False otherwise
        """
        try:
            access_token = await self._get_iam_token()
            
            # Try to list skills as a health check
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"{self.base_url}/v1/skills",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/json"
                    }
                )
                response.raise_for_status()
                logger.info("watsonx Orchestrate health check: OK")
                return True
                
        except Exception as e:
            logger.error(f"watsonx Orchestrate health check failed: {str(e)}")
            return False


# Singleton instance
_orchestrate_client: Optional[WatsonxOrchestrateClient] = None


def get_orchestrate_client() -> WatsonxOrchestrateClient:
    """
    Get singleton instance of WatsonxOrchestrateClient
    
    Returns:
        WatsonxOrchestrateClient instance
    """
    global _orchestrate_client
    if _orchestrate_client is None:
        _orchestrate_client = WatsonxOrchestrateClient()
    return _orchestrate_client

# Made with Bob
