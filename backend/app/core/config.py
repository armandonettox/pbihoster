from pydantic_settings import BaseSettings

from app.core.bootstrap_secrets import ensure_secrets

ensure_secrets()


class Settings(BaseSettings):
    # Configuracoes gerais da aplicacao, lidas de variaveis de ambiente ou .env
    database_url: str = "sqlite:///./pbihoster.db"
    jwt_secret: str = "change-me-in-env"
    jwt_algorithm: str = "HS256"
    # Usada para cifrar secrets guardados no banco (client_secret do Power BI, do Google OAuth)
    # em repouso -- separada do jwt_secret pra nao acoplar rotacao de uma na outra.
    encryption_key: str = "change-me-in-env"
    access_token_expire_minutes: int = 60
    max_failed_login_attempts: int = 5
    account_lock_minutes: int = 15
    cors_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
