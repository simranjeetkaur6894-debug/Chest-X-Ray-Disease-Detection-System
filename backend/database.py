
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Project ke root mein data folder
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# Agar data folder nahi hai, toh create kar do
DATA_DIR.mkdir(parents=True, exist_ok=True)

# SQLite database file ka path
DATABASE_PATH = DATA_DIR / "chest_xray_history.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

# Database connection
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# Database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base class for database tables
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
