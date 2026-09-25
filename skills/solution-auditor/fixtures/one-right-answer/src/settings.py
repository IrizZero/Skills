from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """All runtime config. Every value is read from env vars with the APP_ prefix."""

    database_url: str
    log_level: str = "INFO"
    max_upload_mb: int = 25

    model_config = {"env_prefix": "APP_"}


settings = Settings()
