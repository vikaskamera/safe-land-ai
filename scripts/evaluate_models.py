from __future__ import annotations

import numpy as np
from sklearn.model_selection import train_test_split

from services.ensemble import apply_ensemble, fit_stacking_model, fit_weighted_average
from services.prediction_service import (
    build_preprocessor,
    build_rf_regressor,
    evaluate_predictions,
    load_training_data,
)
from services.xgb_model import build_xgb_regressor


def main():
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
    rf_test_pred = rf_model.predict(X_test_proc)
    xgb_test_pred = xgb_model.predict(X_test_proc)

    weighted_weights = fit_weighted_average(y_val, rf_val_pred, xgb_val_pred)
    stacking_model = fit_stacking_model(y_val, rf_val_pred, xgb_val_pred)

    results = {
        "Random Forest": evaluate_predictions(y_test, rf_test_pred),
        "XGBoost": evaluate_predictions(y_test, xgb_test_pred),
        "Average Ensemble": evaluate_predictions(y_test, apply_ensemble("average", rf_test_pred, xgb_test_pred)),
        "Weighted Ensemble": evaluate_predictions(
            y_test,
            apply_ensemble("weighted", rf_test_pred, xgb_test_pred, weighted_weights=weighted_weights),
        ),
        "Stacking Ensemble": evaluate_predictions(
            y_test,
            apply_ensemble("stacking", rf_test_pred, xgb_test_pred, stacking_model=stacking_model),
        ),
    }

    print("Model Comparison")
    print("-" * 72)
    print(f"{'Model':<22} {'RMSE':>12} {'MAE':>12} {'R2':>12}")
    print("-" * 72)
    for model_name, metrics in results.items():
        print(f"{model_name:<22} {metrics['rmse']:>12.4f} {metrics['mae']:>12.4f} {metrics['r2']:>12.4f}")
    print("-" * 72)
    print(
        "Weighted ensemble weights: "
        f"rf={weighted_weights['rf']:.4f}, xgb={weighted_weights['xgb']:.4f}"
    )


if __name__ == "__main__":
    main()
