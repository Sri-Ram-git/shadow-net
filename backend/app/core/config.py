from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "ShadowNet"
    app_version: str = "2.4.1"
    debug: bool = False
    database_url: str = "sqlite+aiosqlite:///./data/shadownet.db"
    ollama_endpoint: str = "http://ollama:11434"
    ollama_model: str = "phi3:mini"
    upload_dir: str = "data/uploads"
    sync_interval_seconds: int = 60
    max_sync_retries: int = 5
    log_level: str = "INFO"
    cors_origins: str = "*"
    data_dir: str = "data"
    demo_mode: bool = False
    secret_key: str = "shadownet-dev-key-change-in-production"
    railway_volume_path: str = "/data"

    class Config:
        env_file = ".env"
        env_prefix = "SHADOWNET_"


settings = Settings()
