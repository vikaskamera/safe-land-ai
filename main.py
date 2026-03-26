import os
os.makedirs("logs", exist_ok=True)
os.makedirs("ml_models", exist_ok=True)

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from core.config import settings
from core.database import init_db
from core.logger import logger
from middleware.request_logger import RequestLoggerMiddleware
from routes.auth_routes import router as auth_router
from routes.predict_routes import router as predict_router
from routes.admin_routes import admin_router, health_router
from services.prediction_service import prediction_service
from services.telemetry_service import manager, telemetry_simulator

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== SAFE-LAND-AI Platform Starting ===")
    init_db()
    prediction_service.load_model()
    logger.info("All systems nominal. Platform ready.")
    yield
    logger.info("=== SAFE-LAND-AI Platform Shutting Down ===")

app = FastAPI(
    title="SAFE-LAND-AI",
    description="Aviation Intelligence Platform — Crash Landing Probability Prediction",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggerMiddleware)

app.include_router(auth_router)
app.include_router(predict_router)
app.include_router(admin_router)
app.include_router(health_router)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            frame = telemetry_simulator.next_frame()
            prediction = prediction_service.predict(frame)
            payload = {**frame, **prediction, "timestamp": frame["timestamp"]}
            if not await manager.send_personal(websocket, payload):
                break
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket endpoint error: {e}")
        manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "service": "SAFE-LAND-AI Aviation Intelligence Platform",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000)
