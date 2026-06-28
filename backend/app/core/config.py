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
    jwt_secret: str = "shadownet-jwt-secret-change-in-production-2024"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@shadownet.local"
    class Config:
        env_file = ".env"
        env_prefix = "SHADOWNET_"


settings = Settings()
