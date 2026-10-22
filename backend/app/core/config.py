from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    APP_NAME: str = "CONCORD - Institutional Knowledge Management System"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str = "concord-dev-secret-key-32-character-minimum-string-test"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    DEMO_MODE_ENABLED: bool = True

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./concord_dev.db"
    DATABASE_SYNC_URL: str = "sqlite:///./concord_dev.db"

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # Groq Cloud LLM (Milestone 4)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    @field_validator("CORS_ORIGINS", mode="before") 
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator("SECRET_KEY")
    def validate_secret_key(cls, v: str, info) -> str:
        # In production mode, reject weak dev keys
        env = info.data.get("ENVIRONMENT", "development")
        if env == "production" and ("dev" in v.lower() or "insecure" in v.lower() or len(v) < 32):
            raise ValueError("In production mode, a cryptographically secure SECRET_KEY (min 32 chars) must be configured.")
        return v


settings = Settings()
