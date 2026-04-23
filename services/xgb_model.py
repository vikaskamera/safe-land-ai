from __future__ import annotations

from typing import Any

try:
    from xgboost import XGBRegressor
except ImportError:  # pragma: no cover - handled at runtime with install guidance
    XGBRegressor = None


def build_xgb_regressor(random_state: int = 42) -> Any:
    if XGBRegressor is None:
        raise RuntimeError(
            "xgboost is not installed. Install dependencies with "
            "`python -m pip install -r requirements.txt` before training."
        )

    return XGBRegressor(
        objective="reg:squarederror",
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_alpha=0.0,
        reg_lambda=1.0,
        random_state=random_state,
        n_jobs=1,
    )
