import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
# Precisa importar todos os modelos antes do create_all -- mesmo padrao usado em app/main.py --
# senao tabelas referenciadas so por FK (sem import direto aqui) nao sao criadas.
from app.models import audit_log, favorite, invite, password_reset, powerbi_connection, report, user, workspace  # noqa: F401
from app.models import settings as settings_model  # noqa: F401


@pytest.fixture()
def db_session():
    """Sessao de banco isolada por teste -- SQLite em memoria, schema recriado do zero."""
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def make_user(db_session):
    from app.models.user import User

    def _make(email: str, name: str = "Teste") -> User:
        u = User(name=name, email=email, hashed_password="x")
        db_session.add(u)
        db_session.commit()
        db_session.refresh(u)
        return u

    return _make


@pytest.fixture()
def make_workspace(db_session):
    from app.models.workspace import Workspace

    def _make(name: str, slug: str | None = None) -> Workspace:
        w = Workspace(name=name, slug=slug or name.lower().replace(" ", "-"))
        db_session.add(w)
        db_session.commit()
        db_session.refresh(w)
        return w

    return _make
