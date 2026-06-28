from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "ShadowNet"
    app_version: str = "1.0.0"
    debug: bool = False
    database_url: str = "sqlite+aiosqlite:///./data/shadownet.db"
    ollama_endpoint: str = "http://localhost:11434"
    ollama_model: str = "phi3:mini"
    upload_dir: str = "data/uploads"
    sync_interval_seconds: int = 60
    max_sync_retries: int = 5
    log_level: str = "INFO"
    cors_origins: str = "*"
    data_dir: str = "data"

    class Config:
        env_file = ".env"
        env_prefix = "SHADOWNET_"


settings = Settings()
