from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

import numpy as np
from sklearn.linear_model import LinearRegression


SUPPORTED_ENSEMBLES = {"rf_only", "xgb_only", "average", "weighted", "stacking"}


@dataclass
class EnsembleArtifacts:
    weighted_weights: Dict[str, float]
    stacking_model: LinearRegression


def build_meta_features(rf_pred: np.ndarray, xgb_pred: np.ndarray) -> np.ndarray:
    rf_arr = np.asarray(rf_pred, dtype=float).reshape(-1, 1)
    xgb_arr = np.asarray(xgb_pred, dtype=float).reshape(-1, 1)
    return np.hstack([rf_arr, xgb_arr])


def fit_weighted_average(y_true: np.ndarray, rf_pred: np.ndarray, xgb_pred: np.ndarray) -> Dict[str, float]:
    meta = build_meta_features(rf_pred, xgb_pred)
    target = np.asarray(y_true, dtype=float)

    weights, *_ = np.linalg.lstsq(meta, target, rcond=None)
    weights = np.clip(weights, 0.0, None)
    total = float(weights.sum())

    if total <= 0:
        return {"rf": 0.5, "xgb": 0.5}

    return {"rf": float(weights[0] / total), "xgb": float(weights[1] / total)}


def fit_stacking_model(y_true: np.ndarray, rf_pred: np.ndarray, xgb_pred: np.ndarray) -> LinearRegression:
    model = LinearRegression()
    model.fit(build_meta_features(rf_pred, xgb_pred), np.asarray(y_true, dtype=float))
    return model


def apply_ensemble(
    method: str,
    rf_pred: np.ndarray,
    xgb_pred: np.ndarray,
    weighted_weights: Dict[str, float] | None = None,
    stacking_model: LinearRegression | None = None,
) -> np.ndarray:
    if method not in SUPPORTED_ENSEMBLES:
        raise ValueError(f"Unsupported ensemble method: {method}")

    rf_arr = np.asarray(rf_pred, dtype=float).reshape(-1)
    xgb_arr = np.asarray(xgb_pred, dtype=float).reshape(-1)

    if method == "rf_only":
        result = rf_arr
    elif method == "xgb_only":
        result = xgb_arr
    elif method == "average":
        result = (rf_arr + xgb_arr) / 2.0
    elif method == "weighted":
        weights = weighted_weights or {"rf": 0.5, "xgb": 0.5}
        result = (weights["rf"] * rf_arr) + (weights["xgb"] * xgb_arr)
    else:
        if stacking_model is None:
            raise ValueError("Stacking model is required for stacking inference")
        result = stacking_model.predict(build_meta_features(rf_arr, xgb_arr))

    return np.clip(result, 0.0, 1.0)
