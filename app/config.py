from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "SpeedLead"
    database_url: str = "sqlite:///./speedlead.db"
    textrazor_api_key: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    # Demo business defaults (editable in Settings UI / DB)
    default_business_name: str = "Ozark Comfort Pros"
    default_owner_name: str = "Mike"
    default_phone: str = "+14175550199"
    default_city: str = "Springfield"
    alert_to_number: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
