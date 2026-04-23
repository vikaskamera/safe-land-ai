from __future__ import annotations

import os
from datetime import datetime
from typing import Dict, List, Tuple

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from core.config import settings
from core.logger import logger
from services.ensemble import (
    SUPPORTED_ENSEMBLES,
    apply_ensemble,
    fit_stacking_model,
    fit_weighted_average,
)
from services.xgb_model import build_xgb_regressor

FEATURE_NAMES = [
    "altitude", "velocity", "vertical_speed", "horizontal_speed",
    "pitch_angle", "roll_angle", "yaw_angle", "g_force",
    "fuel_level", "engine_status", "wind_speed", "visibility",
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
    "visibility": "Forward visibility at approach zone",
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
        if altitude < 200 and vertical_speed < -1500:
            risk_score += 3
        if abs(pitch_angle) > 20:
            risk_score += 2
        if abs(roll_angle) > 30:
            risk_score += 2
        if g_force > 3 or g_force < 0:
            risk_score += 2
        if fuel_level < 10:
            risk_score += 3
        if engine_status == 0:
            risk_score += 4
        if wind_speed > 35:
            risk_score += 2
        if visibility < 1:
            risk_score += 2
        if velocity > 250 and altitude < 1000:
            risk_score += 2

        impact_score = min(risk_score / 10.0, 1.0)

        X.append([
            altitude, velocity, vertical_speed, horizontal_speed,
            pitch_angle, roll_angle, yaw_angle, g_force,
            fuel_level, engine_status, wind_speed, visibility,
        ])
        y.append(impact_score)

    return np.array(X, dtype=float), np.array(y, dtype=float)


def load_training_data() -> Tuple[np.ndarray, np.ndarray]:
    dataset_path = "dataset.csv"
    if os.path.exists(dataset_path):
        logger.info(f"Loading training data from {dataset_path}")
        data = np.genfromtxt(dataset_path, delimiter=",", skip_header=1)
        X = np.asarray(data[:, :-1], dtype=float)
        y = np.asarray(data[:, -1], dtype=float)
        return X, y

    logger.warning(f"{dataset_path} not found. Synthesizing data...")
    return generate_training_data(5000)


def build_preprocessor() -> SimpleImputer:
    return SimpleImputer(strategy="median")


def build_rf_regressor() -> RandomForestRegressor:
    return RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )


def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    return {"rmse": rmse, "mae": mae, "r2": r2}


def train_and_save_model() -> Dict:
    os.makedirs("ml_models", exist_ok=True)
    logger.info("Training RF + XGBoost ensemble bundle...")

    X, y = load_training_data()
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.3, random_state=42, shuffle=True
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42, shuffle=True
    )

    preprocessor = build_preprocessor()
    X_train_proc = preprocessor.fit_transform(X_train)
    X_val_proc = preprocessor.transform(X_val)
    X_test_proc = preprocessor.transform(X_test)

    rf_model = build_rf_regressor()
    rf_model.fit(X_train_proc, y_train)

    xgb_model = build_xgb_regressor(random_state=42)
    xgb_model.fit(X_train_proc, y_train)

    rf_val_pred = rf_model.predict(X_val_proc)
    xgb_val_pred = xgb_model.predict(X_val_proc)

    weighted_weights = fit_weighted_average(y_val, rf_val_pred, xgb_val_pred)
    stacking_model = fit_stacking_model(y_val, rf_val_pred, xgb_val_pred)

    test_predictions = {
        "rf_only": rf_model.predict(X_test_proc),
        "xgb_only": xgb_model.predict(X_test_proc),
        "average": apply_ensemble("average", rf_model.predict(X_test_proc), xgb_model.predict(X_test_proc)),
        "weighted": apply_ensemble(
            "weighted",
            rf_model.predict(X_test_proc),
            xgb_model.predict(X_test_proc),
            weighted_weights=weighted_weights,
        ),
        "stacking": apply_ensemble(
            "stacking",
            rf_model.predict(X_test_proc),
            xgb_model.predict(X_test_proc),
            stacking_model=stacking_model,
        ),
    }
    metrics = {name: evaluate_predictions(y_test, pred) for name, pred in test_predictions.items()}

    artifact = {
        "rf_model": rf_model,
        "xgb_model": xgb_model,
        "preprocessor": preprocessor,
        "feature_names": FEATURE_NAMES,
        "weighted_weights": weighted_weights,
        "stacking_model": stacking_model,
        "metrics": metrics,
        "trained_at": datetime.utcnow().isoformat(),
    }
    joblib.dump(artifact, settings.MODEL_ARTIFACT_PATH)
    joblib.dump(artifact, settings.MODEL_PATH)

    logger.info(f"Model bundle saved to {settings.MODEL_ARTIFACT_PATH}")
    logger.info(f"Training samples: {len(X_train)}, Validation samples: {len(X_val)}, Test samples: {len(X_test)}")
    return artifact


class PredictionService:
    _instance = None
    _artifact = None
    _rf_model = None
    _xgb_model = None
    _preprocessor = None
    _feature_names = None
    _weighted_weights = None
    _stacking_model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self):
        artifact_path = settings.MODEL_ARTIFACT_PATH
        if not os.path.exists(artifact_path):
            logger.warning("Model bundle not found, training new models...")
            self._artifact = train_and_save_model()
        else:
            self._artifact = joblib.load(artifact_path)
            logger.info("Prediction bundle loaded successfully")

        self._rf_model = self._artifact["rf_model"]
        self._xgb_model = self._artifact["xgb_model"]
        self._preprocessor = self._artifact["preprocessor"]
        self._feature_names = self._artifact["feature_names"]
        self._weighted_weights = self._artifact["weighted_weights"]
        self._stacking_model = self._artifact["stacking_model"]

    def _ensure_loaded(self):
        if self._artifact is None:
            self.load_model()

    def _normalize_features(self, features: Dict) -> np.ndarray:
        row = []
        missing_fields = []

        for feature_name in FEATURE_NAMES:
            if feature_name not in features:
                missing_fields.append(feature_name)
                row.append(np.nan)
                continue

            value = features[feature_name]
            if isinstance(value, bool):
                value = float(value)

            row.append(value)

        if missing_fields:
            raise ValueError(f"Missing required feature(s): {', '.join(missing_fields)}")

        array = np.asarray([row], dtype=float)
        if not np.isfinite(array).all():
            raise ValueError("Input features contain invalid numeric values")
        return array

    def _resolve_method(self, method: str | None = None) -> str:
        selected = (method or settings.ENSEMBLE_METHOD or "average").strip().lower()
        if selected not in SUPPORTED_ENSEMBLES:
            raise ValueError(
                f"Unsupported ensemble method '{selected}'. "
                f"Choose one of: {', '.join(sorted(SUPPORTED_ENSEMBLES))}"
            )
        return selected

    def predict(self, features: Dict, ensemble_method: str | None = None) -> Dict:
        self._ensure_loaded()

        raw_input = self._normalize_features(features)
        transformed = self._preprocessor.transform(raw_input)
        method = self._resolve_method(ensemble_method)

        rf_pred = self._rf_model.predict(transformed)
        xgb_pred = self._xgb_model.predict(transformed)
        final_pred = apply_ensemble(
            method,
            rf_pred,
            xgb_pred,
            weighted_weights=self._weighted_weights,
            stacking_model=self._stacking_model,
        )

        impact_score = float(final_pred[0])
        risk_level, risk_score = self._classify_risk(impact_score)
        recommendations = self._generate_recommendations(features, impact_score)
        confidence = float(
            max(
                1.0 - abs(float(rf_pred[0]) - float(xgb_pred[0])),
                0.5 if method in {"rf_only", "xgb_only"} else 0.0,
            )
        )

        return {
            "impact_score": round(impact_score, 4),
            "model_used": method,
            "prediction_probability": round(impact_score, 4),
            "risk_level": risk_level,
            "risk_score": risk_score,
            "recommendations": recommendations,
            "confidence": round(min(confidence, 1.0), 4),
            "timestamp": datetime.utcnow(),
        }

    def _classify_risk(self, score: float) -> Tuple[str, int]:
        if score < 0.15:
            return "NOMINAL", 1
        if score < 0.35:
            return "ADVISORY", 2
        if score < 0.55:
            return "CAUTION", 3
        if score < 0.75:
            return "WARNING", 4
        return "CRITICAL", 5

    def _generate_recommendations(self, features: Dict, score: float) -> List[str]:
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
        if score < 0.15 and not recs:
            recs.append("All parameters within normal operating envelope. Continue approach.")
        elif not recs:
            recs.append("Monitor parameters closely. Be prepared to execute go-around.")
        return recs

    def get_feature_importance(self) -> List[Dict]:
        self._ensure_loaded()
        importances = self._rf_model.feature_importances_
        result = []
        for name, importance in zip(self._feature_names, importances):
            result.append({
                "feature": name,
                "importance": round(float(importance), 4),
                "description": FEATURE_DESCRIPTIONS.get(name, ""),
            })
        return sorted(result, key=lambda x: x["importance"], reverse=True)

    def get_model_metrics(self) -> Dict[str, Dict[str, float]]:
        self._ensure_loaded()
        return self._artifact.get("metrics", {})


prediction_service = PredictionService()
