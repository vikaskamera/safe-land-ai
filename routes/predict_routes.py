from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from schemas.prediction_schema import PredictionInput, PredictionOutput, BatchPredictionRequest, ExplainResponse
from services.prediction_service import prediction_service
from middleware.auth_guard import get_current_user, require_pilot_or_admin
from models.user import User
from models.flight_record import FlightRecord

router = APIRouter(prefix="/api", tags=["Predictions"])

@router.post("/predict", response_model=PredictionOutput)
def predict(
    payload: PredictionInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pilot_or_admin)
):
    features = payload.dict()
    result = prediction_service.predict(features)

    record = FlightRecord(
        user_id=current_user.id,
        **features,
        prediction_probability=result["prediction_probability"],
        risk_level=result["risk_level"]
    )
    db.add(record)
    db.commit()

    return result

@router.post("/predict/preview", response_model=PredictionOutput)
def predict_preview(
    payload: PredictionInput,
    current_user: User = Depends(require_pilot_or_admin)
):
    return prediction_service.predict(payload.dict())

@router.post("/predict/batch")
def predict_batch(
    payload: BatchPredictionRequest,
    current_user: User = Depends(require_pilot_or_admin)
):
    results = []
    for record in payload.records:
        result = prediction_service.predict(record.dict())
        results.append(result)
    return {"results": results, "total": len(results)}

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    records = (
        db.query(FlightRecord)
        .filter(FlightRecord.user_id == current_user.id)
        .order_by(FlightRecord.created_at.desc())
        .offset(offset).limit(limit).all()
    )
    return {
        "records": [
            {
                "id": r.id,
                "altitude": r.altitude,
                "velocity": r.velocity,
                "vertical_speed": r.vertical_speed,
                "pitch_angle": r.pitch_angle,
                "g_force": r.g_force,
                "fuel_level": r.fuel_level,
                "wind_speed": r.wind_speed,
                "prediction_probability": r.prediction_probability,
                "risk_level": r.risk_level,
                "created_at": r.created_at.isoformat()
            } for r in records
        ],
        "total": db.query(FlightRecord).filter(FlightRecord.user_id == current_user.id).count()
    }

@router.get("/explain", response_model=ExplainResponse)
def explain(current_user: User = Depends(get_current_user)):
    importances = prediction_service.get_feature_importance()
    return {
        "feature_importances": importances,
        "model_version": "RandomForest-v1.0",
        "total_features": len(importances)
    }
