from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PredictionConfig(BaseModel):
    ensemble_method: Optional[str] = Field(
        default=None,
        description="Inference strategy: rf_only, xgb_only, average, weighted, stacking",
    )


class PredictionInput(BaseModel):
    altitude: float = Field(..., ge=0, le=50000, description="Altitude in feet")
    velocity: float = Field(..., ge=0, le=1000, description="Airspeed in knots")
    vertical_speed: float = Field(..., description="Vertical speed in ft/min")
    horizontal_speed: float = Field(..., ge=0, description="Horizontal speed in knots")
    pitch_angle: float = Field(..., ge=-90, le=90, description="Pitch angle in degrees")
    roll_angle: float = Field(..., ge=-180, le=180, description="Roll angle in degrees")
    yaw_angle: float = Field(..., ge=-180, le=180, description="Yaw angle in degrees")
    g_force: float = Field(..., ge=-5, le=10, description="G-force loading")
    fuel_level: float = Field(..., ge=0, le=100, description="Fuel level percentage")
    engine_status: bool = Field(..., description="Engine operational status")
    wind_speed: float = Field(..., ge=0, description="Wind speed in knots")
    visibility: float = Field(..., ge=0, description="Visibility in statute miles")

class PredictionOutput(BaseModel):
    impact_score: float
    model_used: str
    prediction_probability: float
    risk_level: str
    risk_score: int
    recommendations: List[str]
    confidence: float
    timestamp: datetime

class BatchPredictionRequest(BaseModel):
    records: List[PredictionInput]

class FeatureImportance(BaseModel):
    feature: str
    importance: float
    description: str

class ExplainResponse(BaseModel):
    feature_importances: List[FeatureImportance]
    model_version: str
    total_features: int

class FlightRecordResponse(BaseModel):
    id: int
    altitude: float
    velocity: float
    prediction_probability: Optional[float]
    risk_level: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
