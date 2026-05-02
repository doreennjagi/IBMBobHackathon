"""
Prompt Template Loader for watsonx Orchestrate Skill Definitions
Loads and renders skill.yaml files with Handlebars-style templating
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
import re


class PromptTemplateLoader:
    """Loads and renders prompt templates from watsonx Orchestrate skill YAML files"""
    
    def __init__(self, agents_dir: Optional[str] = None):
        """
        Initialize the prompt template loader
        
        Args:
            agents_dir: Path to agents directory. Defaults to project root/agents/
        """
        if agents_dir is None:
            # Navigate from backend/app/agents/ to project root/agents/
            current_file = Path(__file__).resolve()
            project_root = current_file.parent.parent.parent.parent
            agents_dir = project_root / "agents"
        
        self.agents_dir = Path(agents_dir)
        self._skill_cache: Dict[str, Dict[str, Any]] = {}
    
    def load_skill(self, agent_name: str) -> Dict[str, Any]:
        """
        Load a skill definition from YAML
        
        Args:
            agent_name: Name of the agent (e.g., 'cancellation_agent', 'negotiation_agent')
            
        Returns:
            Parsed skill definition dictionary
            
        Raises:
            FileNotFoundError: If skill.yaml not found
            yaml.YAMLError: If YAML parsing fails
        """
        if agent_name in self._skill_cache:
            return self._skill_cache[agent_name]
        
        skill_path = self.agents_dir / agent_name / "skill.yaml"
        
        if not skill_path.exists():
            raise FileNotFoundError(f"Skill definition not found: {skill_path}")
        
        with open(skill_path, 'r', encoding='utf-8') as f:
            skill_def = yaml.safe_load(f)
        
        self._skill_cache[agent_name] = skill_def
        return skill_def
    
    def render_prompt(self, agent_name: str, context: Dict[str, Any]) -> str:
        """
        Render a prompt template with context variables
        
        Args:
            agent_name: Name of the agent
            context: Dictionary of variables to substitute in template
            
        Returns:
            Rendered prompt string
            
        Example:
            >>> loader = PromptTemplateLoader()
            >>> context = {"provider_name": "Netflix", "monthly_cost": 1100.0}
            >>> prompt = loader.render_prompt("cancellation_agent", context)
        """
        skill = self.load_skill(agent_name)
        template = skill.get("prompt_template", "")
        
        # Render Handlebars-style {{variable}} substitutions
        rendered = self._render_handlebars(template, context)
        
        return rendered.strip()
    
    def _render_handlebars(self, template: str, context: Dict[str, Any]) -> str:
        """
        Render Handlebars-style template syntax
        
        Supports:
        - {{variable}} - simple substitution
        - {{#if variable}}...{{/if}} - conditional blocks
        """
        # Handle {{#if variable}}...{{/if}} blocks
        def replace_if_block(match):
            var_name = match.group(1)
            content = match.group(2)
            # Check if variable exists and is truthy
            if context.get(var_name):
                return content
            return ""
        
        # Process conditional blocks first
        template = re.sub(
            r'\{\{#if\s+(\w+)\}\}(.*?)\{\{/if\}\}',
            replace_if_block,
            template,
            flags=re.DOTALL
        )
        
        # Handle simple {{variable}} substitutions
        def replace_variable(match):
            var_name = match.group(1)
            value = context.get(var_name, "")
            return str(value)
        
        template = re.sub(r'\{\{(\w+)\}\}', replace_variable, template)
        
        return template
    
    def get_input_schema(self, agent_name: str) -> Dict[str, Any]:
        """Get the input schema for an agent"""
        skill = self.load_skill(agent_name)
        return skill.get("input_schema", {})
    
    def get_output_schema(self, agent_name: str) -> Dict[str, Any]:
        """Get the output schema for an agent"""
        skill = self.load_skill(agent_name)
        return skill.get("output_schema", {})
    
    def get_model_config(self, agent_name: str) -> Dict[str, Any]:
        """Get the model configuration for an agent"""
        skill = self.load_skill(agent_name)
        return skill.get("model_config", {})
    
    def validate_input(self, agent_name: str, input_data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validate input data against agent's input schema
        
        Returns:
            (is_valid, error_message)
        """
        schema = self.get_input_schema(agent_name)
        required_fields = schema.get("required", [])
        properties = schema.get("properties", {})
        
        # Check required fields
        for field in required_fields:
            if field not in input_data:
                return False, f"Missing required field: {field}"
        
        # Check field types (basic validation) - only for provided fields
        for field, value in input_data.items():
            if field in properties:
                # Skip None values for optional fields
                if value is None:
                    continue
                    
                expected_type = properties[field].get("type")
                if expected_type == "string" and not isinstance(value, str):
                    return False, f"Field '{field}' must be a string"
                elif expected_type == "number" and not isinstance(value, (int, float)):
                    return False, f"Field '{field}' must be a number"
                elif expected_type == "integer" and not isinstance(value, int):
                    return False, f"Field '{field}' must be an integer"
        
        return True, None


# Made with Bob