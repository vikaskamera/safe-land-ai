from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config import settings
from core.security import hash_password

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from models.user import User, UserRole
    from models.flight_record import FlightRecord
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        columns = {row[1] for row in conn.execute(text("PRAGMA table_info(users)"))}
        optional_columns = {
            "full_name": "ALTER TABLE users ADD COLUMN full_name VARCHAR",
            "designation": "ALTER TABLE users ADD COLUMN designation VARCHAR",
            "organization": "ALTER TABLE users ADD COLUMN organization VARCHAR",
            "phone": "ALTER TABLE users ADD COLUMN phone VARCHAR",
            "location": "ALTER TABLE users ADD COLUMN location VARCHAR",
            "bio": "ALTER TABLE users ADD COLUMN bio VARCHAR",
        }
        for name, ddl in optional_columns.items():
            if name not in columns:
                conn.execute(text(ddl))
    db = SessionLocal()
    try:
        demo_admin = db.query(User).filter(User.username == "admin").first()
        if not demo_admin:
            db.add(User(
                username="admin",
                email="admin@safe-land.local",
                password_hash=hash_password("admin123"),
                role=UserRole.admin,
                full_name="System Administrator",
                designation="Chief Safety Analyst",
                organization="SAFE-LAND-AI Operations",
                location="Operations Control Center"
            ))
            db.commit()
    finally:
        db.close()
