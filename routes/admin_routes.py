from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from middleware.auth_guard import require_admin, get_current_user
from models.user import User
from models.flight_record import FlightRecord
from datetime import datetime
import os
import shutil

try:
    import psutil
except ModuleNotFoundError:
    psutil = None

admin_router = APIRouter(prefix="/admin", tags=["Admin"])
health_router = APIRouter(prefix="/api", tags=["Health"])

@health_router.get("/health")
def health():
    return {
        "status": "operational",
        "service": "SAFE-LAND-AI",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@admin_router.get("/users")
def list_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "email": u.email, "role": u.role, "created_at": u.created_at} for u in users]

@admin_router.delete("/user/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted"}

@admin_router.get("/system-metrics")
def system_metrics(admin: User = Depends(require_admin)):
    if psutil is not None:
        cpu_percent = psutil.cpu_percent()
        memory_percent = psutil.virtual_memory().percent
    else:
        # Keep the app bootable even when optional system metrics deps are missing.
        cpu_percent = 0.0
        memory_percent = 0.0

    disk_root = os.path.abspath(os.sep)
    disk_usage = shutil.disk_usage(disk_root)
    disk_percent = disk_usage.used / disk_usage.total * 100
    return {
        "cpu_percent": round(cpu_percent, 2),
        "memory_percent": round(memory_percent, 2),
        "disk_percent": round(disk_percent, 2),
        "metrics_source": "psutil" if psutil is not None else "fallback",
        "timestamp": datetime.utcnow().isoformat()
    }
