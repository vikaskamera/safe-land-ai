import numpy as np
import pickle
import os
from datetime import datetime
from typing import List, Dict, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from core.logger import logger
from core.config import settings

FEATURE_NAMES = [
    "altitude", "velocity", "vertical_speed", "horizontal_speed",
    "pitch_angle", "roll_angle", "yaw_angle", "g_force",
    "fuel_level", "engine_status", "wind_speed", "visibility"
]

FEATURE_DESCRIPTIONS = {
    "altitude": "Aircraft altitude above ground level",
    "velocity": "Total airspeed of the aircraft",
    "vertical_speed": "Rate of climb or descent",
    "horizontal_speed": "Horizontal ground speed",
    "pitch_angle": "Nose-up or nose-down attitude",
    "roll_angle": "Wing tilt angle from horizontal",
    "yaw_angle": "Heading deviation from centerline",
    "g_force": "Gravitational force loading on airframe",
    "fuel_level": "Remaining fuel as percentage of capacity",
    "engine_status": "Operational state of primary engine",
    "wind_speed": "Surface wind speed at landing zone",
    "visibility": "Forward visibility at approach zone"
}

def generate_training_data(n_samples: int = 5000) -> Tuple[np.ndarray, np.ndarray]:
    np.random.seed(42)
    X, y = [], []

    for _ in range(n_samples):
        altitude = np.random.uniform(0, 5000)
        velocity = np.random.uniform(50, 300)
        vertical_speed = np.random.uniform(-3000, 500)
        horizontal_speed = np.random.uniform(0, 250)
        pitch_angle = np.random.uniform(-30, 30)
        roll_angle = np.random.uniform(-45, 45)
        yaw_angle = np.random.uniform(-30, 30)
        g_force = np.random.uniform(-1, 4)
        fuel_level = np.random.uniform(0, 100)
        engine_status = np.random.choice([0, 1], p=[0.05, 0.95])
        wind_speed = np.random.uniform(0, 60)
        visibility = np.random.uniform(0, 10)

        risk_score = 0
        if altitude < 200 and vertical_speed < -1500: risk_score += 3
        if abs(pitch_angle) > 20: risk_score += 2
        if abs(roll_angle) > 30: risk_score += 2
        if g_force > 3 or g_force < 0: risk_score += 2
        if fuel_level < 10: risk_score += 3
        if engine_status == 0: risk_score += 4
        if wind_speed > 35: risk_score += 2
        if visibility < 1: risk_score += 2
        if velocity > 250 and altitude < 1000: risk_score += 2

        crash = 1 if risk_score >= 5 else 0

        X.append([altitude, velocity, vertical_speed, horizontal_speed,
                   pitch_angle, roll_angle, yaw_angle, g_force,
                   fuel_level, engine_status, wind_speed, visibility])
        y.append(crash)

    return np.array(X), np.array(y)

def train_and_save_model():
    os.makedirs("ml_models", exist_ok=True)
    logger.info("Training Random Forest crash detection model...")

    X, y = generate_training_data(5000)

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X, y)

    with open(settings.MODEL_PATH, "wb") as f:
        pickle.dump({"model": model, "feature_names": FEATURE_NAMES}, f)

    logger.info(f"Model trained and saved to {settings.MODEL_PATH}")
    logger.info(f"Training samples: {len(X)}, Crash cases: {sum(y)}")
    return model

class PredictionService:
    _instance = None
    _model = None
    _feature_names = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self):
        if not os.path.exists(settings.MODEL_PATH):
            logger.warning("Model not found, training new model...")
            self._model = train_and_save_model()
            self._feature_names = FEATURE_NAMES
        else:
            with open(settings.MODEL_PATH, "rb") as f:
                data = pickle.load(f)
                self._model = data["model"]
                self._feature_names = data["feature_names"]
            logger.info("Model loaded successfully")

    def predict(self, features: Dict) -> Dict:
        if self._model is None:
            self.load_model()

        X = np.array([[
            features["altitude"], features["velocity"],
            features["vertical_speed"], features["horizontal_speed"],
            features["pitch_angle"], features["roll_angle"],
            features["yaw_angle"], features["g_force"],
            features["fuel_level"], float(features["engine_status"]),
            features["wind_speed"], features["visibility"]
        ]])

        proba = self._model.predict_proba(X)[0]
        crash_prob = float(proba[1]) if len(proba) > 1 else float(proba[0])

        risk_level, risk_score = self._classify_risk(crash_prob)
        recommendations = self._generate_recommendations(features, crash_prob)
        confidence = float(max(proba))

        return {
            "prediction_probability": round(crash_prob, 4),
            "risk_level": risk_level,
            "risk_score": risk_score,
            "recommendations": recommendations,
            "confidence": round(confidence, 4),
            "timestamp": datetime.utcnow()
        }

    def _classify_risk(self, probability: float) -> Tuple[str, int]:
        if probability < 0.15:
            return "NOMINAL", 1
        elif probability < 0.35:
            return "ADVISORY", 2
        elif probability < 0.55:
            return "CAUTION", 3
        elif probability < 0.75:
            return "WARNING", 4
        else:
            return "CRITICAL", 5

    def _generate_recommendations(self, features: Dict, probability: float) -> List[str]:
        recs = []
        if features["fuel_level"] < 15:
            recs.append("FUEL CRITICAL: Declare fuel emergency, divert to nearest suitable airport immediately.")
        if not features["engine_status"]:
            recs.append("ENGINE FAILURE: Execute emergency engine-out checklist. Declare MAYDAY.")
        if features["vertical_speed"] < -1500 and features["altitude"] < 1000:
            recs.append("SINK RATE: Execute immediate go-around. TERRAIN PROXIMITY WARNING.")
        if abs(features["pitch_angle"]) > 20:
            recs.append("ATTITUDE UPSET: Reduce to normal pitch attitude. Check artificial horizon.")
        if abs(features["roll_angle"]) > 30:
            recs.append("EXCESSIVE BANK: Roll wings level immediately. Avoid stall entry.")
        if features["wind_speed"] > 35:
            recs.append("HIGH WIND: Wind exceeds crosswind limits. Consider alternate runway or divert.")
        if features["visibility"] < 1.5:
            recs.append("LOW VISIBILITY: Below IFR minimums. Execute missed approach or hold.")
        if features["g_force"] > 3:
            recs.append("HIGH G-LOAD: Reduce load factor. Check for structural damage post-flight.")
        if probability < 0.15 and not recs:
            recs.append("All parameters within normal operating envelope. Continue approach.")
        elif not recs:
            recs.append("Monitor parameters closely. Be prepared to execute go-around.")
        return recs

    def get_feature_importance(self) -> List[Dict]:
        if self._model is None:
            self.load_model()
        importances = self._model.feature_importances_
        result = []
        for name, importance in zip(self._feature_names, importances):
            result.append({
                "feature": name,
                "importance": round(float(importance), 4),
                "description": FEATURE_DESCRIPTIONS.get(name, "")
            })
        return sorted(result, key=lambda x: x["importance"], reverse=True)

prediction_service = PredictionService()
