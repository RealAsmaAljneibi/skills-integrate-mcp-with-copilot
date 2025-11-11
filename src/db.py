from typing import Generator
from sqlmodel import create_engine, Session, SQLModel

DATABASE_URL = "sqlite:///./dev.db"

# echo=False to quiet SQL logging; set to True for debugging
engine = create_engine(DATABASE_URL, echo=False)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def init_db() -> None:
    """Create database tables."""
    SQLModel.metadata.create_all(engine)
