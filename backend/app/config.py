import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(default="sqlite:///./emails.db", validation_alias="DATABASE_URL")
    JWT_SECRET: str = Field(default="super-secret-key-smartmail-ai-change-in-production", validation_alias="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES") # 24 hours
    
    # AI Keys
    GROQ_API_KEY: str = Field(default="", validation_alias="GROQ_API_KEY")
    
    # Models
    GROQ_MODEL: str = Field(default="llama-3.3-70b-versatile", validation_alias="GROQ_MODEL")
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
