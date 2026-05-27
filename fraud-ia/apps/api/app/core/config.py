from pydantic_settings import BaseSettings
from functools import lru_cache
from urllib.parse import quote_plus


class Settings(BaseSettings):
    # Google Cloud
    google_cloud_project: str = ""
    google_cloud_location: str = "us-central1"

    # Gemini / Vertex AI
    gemini_model: str = "gemini-2.5-flash"
    embedding_model: str = "gemini-embedding-001"
    embedding_dim: int = 768

    # AlloyDB
    alloydb_host: str = "localhost"
    alloydb_port: int = 5432
    alloydb_database: str = "fraudia"
    alloydb_user: str = "app_user"
    alloydb_password: str = "change-me"
    alloydb_admin_database: str = "postgres"
    alloydb_admin_user: str = "postgres"
    alloydb_admin_password: str = "change-me"

    # App
    app_env: str = "local"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000"

    # GCS
    gcs_bucket: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{quote_plus(self.alloydb_user)}:{quote_plus(self.alloydb_password)}"
            f"@{self.alloydb_host}:{self.alloydb_port}/{self.alloydb_database}"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
