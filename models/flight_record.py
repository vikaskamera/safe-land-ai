from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class FlightRecord(Base):
    __tablename__ = "flight_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    altitude = Column(Float, nullable=False)
    velocity = Column(Float, nullable=False)
    vertical_speed = Column(Float, nullable=False)
    horizontal_speed = Column(Float, nullable=False)
    pitch_angle = Column(Float, nullable=False)
    roll_angle = Column(Float, nullable=False)
    yaw_angle = Column(Float, nullable=False)
    g_force = Column(Float, nullable=False)
    fuel_level = Column(Float, nullable=False)
    engine_status = Column(Boolean, nullable=False, default=True)
    wind_speed = Column(Float, nullable=False)
    visibility = Column(Float, nullable=False)
    prediction_probability = Column(Float, nullable=True)
    risk_level = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="flight_records")
