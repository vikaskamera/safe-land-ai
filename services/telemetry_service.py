import asyncio
import json
import random
import math
from datetime import datetime
from typing import List
from fastapi import WebSocket, WebSocketDisconnect
from core.logger import logger

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        dead = []
        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception:
                dead.append(conn)
        for conn in dead:
            self.disconnect(conn)

    async def send_personal(self, websocket: WebSocket, message: dict) -> bool:
        try:
            await websocket.send_json(message)
            return True
        except WebSocketDisconnect:
            self.disconnect(websocket)
            return False
        except Exception as e:
            logger.error(f"WebSocket send error: {e}")
            self.disconnect(websocket)
            return False

manager = ConnectionManager()

class TelemetrySimulator:
    """Generates realistic simulated aircraft telemetry for demo/testing"""
    def __init__(self):
        self.t = 0
        self.altitude = 3000.0
        self.velocity = 145.0
        self.vertical_speed = -400.0

    def next_frame(self) -> dict:
        self.t += 1
        noise = lambda s: random.gauss(0, s)

        self.altitude = max(0, self.altitude + self.vertical_speed / 60 + noise(10))
        self.velocity = max(80, min(200, self.velocity + noise(2)))
        self.vertical_speed = max(-2500, min(500, self.vertical_speed + noise(50)))

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "altitude": round(self.altitude, 1),
            "velocity": round(self.velocity, 1),
            "vertical_speed": round(self.vertical_speed, 1),
            "horizontal_speed": round(self.velocity * math.cos(math.radians(3)), 1),
            "pitch_angle": round(-3 + noise(1.5), 2),
            "roll_angle": round(noise(2), 2),
            "yaw_angle": round(noise(1), 2),
            "g_force": round(1.0 + noise(0.1), 3),
            "fuel_level": round(max(0, 68 - self.t * 0.02), 1),
            "engine_status": True,
            "wind_speed": round(max(0, 12 + noise(3)), 1),
            "visibility": round(max(0, 8.5 + noise(0.5)), 1),
            "frame": self.t
        }

telemetry_simulator = TelemetrySimulator()
