from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    pilot = "pilot"
    researcher = "researcher"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.pilot)
    full_name = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    flight_records = relationship("FlightRecord", back_populates="user")

# Ensure SQLAlchemy can resolve the related mapper during auth queries.
from models.flight_record import FlightRecord  # noqa: E402,F401
