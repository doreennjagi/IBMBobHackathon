"""
Test suite for SubLeech AI Agents
Tests LangChain orchestration, prompt loading, and agent generation
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from pathlib import Path

from app.agents.prompt_loader import PromptTemplateLoader
from app.agents.orchestrator import SubLeechAgentOrchestrator, AgentResponse


class TestPromptTemplateLoader:
    """Test prompt template loading and rendering"""
    
    @pytest.fixture
    def loader(self):
        """Create a prompt loader instance"""
        return PromptTemplateLoader()
    
    def test_load_cancellation_skill(self, loader):
        """Test loading cancellation agent skill definition"""
        skill = loader.load_skill("cancellation_agent")
        
        assert skill["name"] == "CancellationLetterAgent"
        assert skill["version"] == "1.0.0"
        assert "prompt_template" in skill
        assert "input_schema" in skill
        assert "output_schema" in skill
    
    def test_load_negotiation_skill(self, loader):
        """Test loading negotiation agent skill definition"""
        skill = loader.load_skill("negotiation_agent")
        
        assert skill["name"] == "NegotiationScriptAgent"
        assert skill["version"] == "1.0.0"
        assert "prompt_template" in skill
    
    def test_render_simple_variables(self, loader):
        """Test rendering simple {{variable}} substitutions"""
        context = {
            "provider_name": "Netflix",
            "monthly_cost": 1100.0,
            "user_name": "John Doe"
        }
        
        rendered = loader.render_prompt("cancellation_agent", context)
        
        assert "Netflix" in rendered
        assert "1100.0" in rendered
        assert "John Doe" in rendered
    
    def test_render_conditional_blocks(self, loader):
        """Test rendering {{#if}}...{{/if}} conditional blocks"""
        # With account_number
        context_with = {
            "provider_name": "Spotify",
            "monthly_cost": 399.0,
            "user_name": "Jane Smith",
            "account_number": "ACC123456"
        }
        
        rendered_with = loader.render_prompt("cancellation_agent", context_with)
        assert "ACC123456" in rendered_with
        
        # Without account_number
        context_without = {
            "provider_name": "Spotify",
            "monthly_cost": 399.0,
            "user_name": "Jane Smith"
        }
        
        rendered_without = loader.render_prompt("cancellation_agent", context_without)
        assert "Account Number:" not in rendered_without
    
    def test_validate_input_success(self, loader):
        """Test input validation with valid data"""
        valid_input = {
            "provider_name": "Netflix",
            "monthly_cost": 1100.0,
            "user_name": "Test User"
        }
        
        is_valid, error = loader.validate_input("cancellation_agent", valid_input)
        
        assert is_valid is True
        assert error is None
    
    def test_validate_input_missing_required(self, loader):
        """Test input validation with missing required field"""
        invalid_input = {
            "provider_name": "Netflix",
            "monthly_cost": 1100.0
            # Missing user_name
        }
        
        is_valid, error = loader.validate_input("cancellation_agent", invalid_input)
        
        assert is_valid is False
        assert "user_name" in error
    
    def test_get_model_config(self, loader):
        """Test retrieving model configuration"""
        config = loader.get_model_config("cancellation_agent")
        
        assert "model_id" in config
        assert "parameters" in config
        assert config["model_id"] == "ibm/granite-13b-chat-v2"
        assert config["parameters"]["temperature"] == 0.3


class TestSubLeechAgentOrchestrator:
    """Test agent orchestration and routing"""
    
    @pytest.fixture
    def orchestrator(self):
        """Create orchestrator instance without API key (mock mode)"""
        return SubLeechAgentOrchestrator(
            watsonx_api_key=None,
            watsonx_project_id="test-project",
            watsonx_url="https://test.example.com"
        )
    
    @pytest.mark.asyncio
    async def test_route_to_cancellation_agent_mock(self, orchestrator):
        """Test routing to cancellation agent in mock mode"""
        response = await orchestrator.route_to_agent(
            action="cancel",
            provider_name="Netflix",
            monthly_cost=1100.0,
            user_name="Test User",
            account_type="personal"
        )
        
        assert isinstance(response, AgentResponse)
        assert response.action == "cancel"
        assert response.provider_name == "Netflix"
        assert response.model_used == "mock"
        assert "Netflix" in response.generated_text
    
    @pytest.mark.asyncio
    async def test_route_to_negotiation_agent_mock(self, orchestrator):
        """Test routing to negotiation agent in mock mode"""
        response = await orchestrator.route_to_agent(
            action="negotiate",
            provider_name="Spotify",
            monthly_cost=399.0,
            user_name="",
            original_cost=299.0
        )
        
        assert isinstance(response, AgentResponse)
        assert response.action == "negotiate"
        assert response.provider_name == "Spotify"
        assert response.model_used == "mock"
    
    @pytest.mark.asyncio
    async def test_invalid_action_raises_error(self, orchestrator):
        """Test that invalid action raises ValueError"""
        with pytest.raises(ValueError, match="Invalid input"):
            await orchestrator.route_to_agent(
                action="invalid_action",
                provider_name="Netflix",
                monthly_cost=1100.0,
                user_name="Test User"
            )
    
    @pytest.mark.asyncio
    async def test_generate_cancellation_letter_convenience(self, orchestrator):
        """Test convenience method for cancellation letter"""
        response = await orchestrator.generate_cancellation_letter(
            provider_name="DStv",
            monthly_cost=3500.0,
            user_name="John Doe",
            account_type="personal",
            cancellation_reason="No longer using service"
        )
        
        assert response.action == "cancel"
        assert response.provider_name == "DStv"
    
    @pytest.mark.asyncio
    async def test_generate_negotiation_script_convenience(self, orchestrator):
        """Test convenience method for negotiation script"""
        response = await orchestrator.generate_negotiation_script(
            provider_name="Canva",
            monthly_cost=650.0,
            original_cost=500.0,
            subscription_duration_months=12,
            hardship_type="price_increase"
        )
        
        assert response.action == "negotiate"
        assert response.provider_name == "Canva"
    
    @pytest.mark.asyncio
    @patch('app.agents.orchestrator.WatsonxLLM')
    async def test_route_with_api_key(self, mock_watsonx):
        """Test routing with actual API key (mocked LLM)"""
        # Create orchestrator with API key
        orchestrator = SubLeechAgentOrchestrator(
            watsonx_api_key="test-api-key",
            watsonx_project_id="test-project"
        )
        
        # Mock the LLM chain execution
        mock_llm_instance = Mock()
        mock_watsonx.return_value = mock_llm_instance
        
        # Mock chain execution
        with patch('app.agents.orchestrator.LLMChain') as mock_chain:
            mock_chain_instance = AsyncMock()
            mock_chain_instance.arun = AsyncMock(return_value="Generated cancellation letter text")
            mock_chain.return_value = mock_chain_instance
            
            response = await orchestrator.route_to_agent(
                action="cancel",
                provider_name="Netflix",
                monthly_cost=1100.0,
                user_name="Test User"
            )
            
            assert response.model_used != "mock"
            assert "Generated cancellation letter text" in response.generated_text


class TestAgentIntegration:
    """Integration tests for full agent workflow"""
    
    @pytest.mark.asyncio
    async def test_full_cancellation_workflow(self):
        """Test complete cancellation workflow from request to response"""
        orchestrator = SubLeechAgentOrchestrator()
        
        # Simulate a price-increased subscription
        response = await orchestrator.generate_cancellation_letter(
            provider_name="Spotify",
            monthly_cost=399.0,
            user_name="Jane Doe",
            account_type="personal",
            cancellation_reason="Price increased without notice"
        )
        
        # Verify response structure
        assert response.action == "cancel"
        assert response.confidence_score >= 0.0
        assert len(response.generated_text) > 0
        assert "metadata" in response.metadata
    
    @pytest.mark.asyncio
    async def test_full_negotiation_workflow(self):
        """Test complete negotiation workflow"""
        orchestrator = SubLeechAgentOrchestrator()
        
        response = await orchestrator.generate_negotiation_script(
            provider_name="Adobe Creative Cloud",
            monthly_cost=2500.0,
            original_cost=2000.0,
            subscription_duration_months=24,
            competitor_pricing=1800.0,
            hardship_type="financial"
        )
        
        # Verify response structure
        assert response.action == "negotiate"
        assert response.confidence_score >= 0.0
        assert len(response.generated_text) > 0


# Made with Bob - Comprehensive agent test suite