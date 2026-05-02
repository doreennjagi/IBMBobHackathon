"""
SubLeech Configuration Management

Centralized configuration using Pydantic Settings for environment variable management.
All sensitive credentials should be stored in .env file (never committed to git).
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "SubLeech"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative frontend port
        "https://subleech.apps.cloud.ibm.com",  # Production OpenShift
    ]
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://subleech:password@localhost:5432/subleech"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600  # 1 hour
    
    # JWT Authentication
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # IBM Cloud Configuration
    IBM_CLOUD_API_KEY: str = ""
    IBM_CLOUD_REGION: str = "us-south"
    
    # watsonx Configuration
    WATSONX_API_KEY: str = ""
    WATSONX_PROJECT_ID: str = ""
    WATSONX_URL: str = "https://us-south.ml.cloud.ibm.com"
    WATSONX_MODEL_ID: str = "ibm/granite-13b-chat-v2"
    
    # watsonx Orchestrate
    ORCHESTRATE_API_KEY: str = ""
    ORCHESTRATE_INSTANCE_ID: str = ""
    ORCHESTRATE_URL: str = "https://api.watsonx.orchestrate.ibm.com"
    
    # IBM Cloud Object Storage
    COS_ENDPOINT: str = ""
    COS_API_KEY: str = ""
    COS_INSTANCE_ID: str = ""
    COS_BUCKET_NAME: str = "subleech-reports"
    
    # Subscription Detection Settings
    PRICE_HIKE_THRESHOLD: float = 0.10  # 10% increase threshold
    MIN_TRANSACTION_FREQUENCY: int = 2  # Minimum occurrences to classify as subscription
    ANALYSIS_WINDOW_MONTHS: int = 12  # Rolling window for analysis
    
    # CSV Processing
    MAX_CSV_SIZE_MB: int = 10
    ALLOWED_CSV_ENCODINGS: List[str] = ["utf-8", "utf-8-sig", "latin-1", "iso-8859-1"]
    
    # Celery Configuration (for async tasks)
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create global settings instance
settings = Settings()

# Made with Bob
