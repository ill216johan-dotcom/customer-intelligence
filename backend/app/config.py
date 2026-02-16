"""
Application configuration.
"""

from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "customer_intelligence"
    postgres_user: str = "ci_user"
    postgres_password: str = "change_me"
    
    # Security
    backend_secret_key: str = "dev_secret_key_change_in_production"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    
    # CORS
    cors_origins_str: str = '["http://localhost:3000"]'
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # GLM-4 API
    glm_api_key: str = ""
    glm_api_base: str = "https://open.bigmodel.cn/api/paas/v4"
    
    # Whisper
    whisper_model: str = "large-v3"
    whisper_device: str = "cpu"
    
    # File storage
    audio_dir: str = "/app/audio"
    
    @property
    def database_url(self) -> str:
        """Async database URL."""
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
    
    @property
    def database_url_sync(self) -> str:
        """Sync database URL (for Alembic)."""
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from JSON string."""
        try:
            return json.loads(self.cors_origins_str)
        except json.JSONDecodeError:
            return ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
