import os
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_env: str = "development"
    secret_key: str = "change-this-in-production"
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    
    # watsonx.ai credentials (for Granite LLM)
    watsonx_api_key: str = ""
    watsonx_project_id: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29"
    granite_model_id: str = "ibm/granite-13b-instruct-v2"
    
    # watsonx Orchestrate credentials (for agent orchestration)
    orchestrate_apikey: str = ""
    orchestrate_iam_apikey: str = ""
    orchestrate_url: str = ""
    orchestrate_auth_type: str = "iam"
    
    # Database
    database_url: str = "postgresql://subleech_user:subleech_pass@localhost:5432/subleech"
    
    # CSV processing limits
    max_csv_size_mb: int = 10
    max_csv_rows: int = 50000
    
    # Agent mode: "mock" or "live"
    agent_mode: str = "mock"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]
    
    @property
    def is_live_mode(self) -> bool:
        """Check if agents should use live watsonx Orchestrate API"""
        return self.agent_mode.lower() == "live" and bool(self.orchestrate_apikey)

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()
