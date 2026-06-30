import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ShadowNet"
    app_version: str = "2.4.1"
    debug: bool = False
    database_url: str = ""
    ollama_endpoint: str = "http://ollama:11434"
    ollama_model: str = "phi3:mini"
    upload_dir: str = ""
    sync_interval_seconds: int = 60
    max_sync_retries: int = 5
    log_level: str = "INFO"
    cors_origins: str = "*"
    data_dir: str = ""
    railway_volume_path: str = ""
    demo_mode: bool = False
    secret_key: str = "shadownet-dev-key-change-in-production"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="SHADOWNET_")

    def model_post_init(self, __context):
        # Database: check Railway's auto-provided DATABASE_URL first
        if not self.database_url:
            self.database_url = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./data/shadownet.db")
        # Data directories
        if self.railway_volume_path:
            self.data_dir = self.railway_volume_path
        if not self.data_dir:
            self.data_dir = "./data"
        if not self.upload_dir:
            self.upload_dir = os.path.join(self.data_dir, "uploads")


settings = Settings()
