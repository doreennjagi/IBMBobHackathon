"""
SubLeech AI Agent Orchestration Layer
Built with LangChain for watsonx Orchestrate integration

Supports two modes:
- LIVE MODE: Real watsonx Orchestrate API calls
- MOCK MODE: Local prompt rendering for development
"""

from .orchestrator import SubLeechAgentOrchestrator, AgentResponse
from .prompt_loader import PromptTemplateLoader
from .orchestrate_client import WatsonxOrchestrateClient, get_orchestrate_client, OrchestrateResponse

__all__ = [
    "SubLeechAgentOrchestrator",
    "AgentResponse",
    "PromptTemplateLoader",
    "WatsonxOrchestrateClient",
    "get_orchestrate_client",
    "OrchestrateResponse"
]

# Made with Bob
