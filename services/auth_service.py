from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from models.user import User, UserRole
from core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from core.logger import logger
from jose import JWTError

class AuthService:
    def register(self, db: Session, username: str, email: str, password: str, role: str = "pilot") -> User:
        if len(password) < 6 or len(password) > 16:
            raise ValueError("Password must be between 6 and 16 characters")
        if db.query(User).filter(User.username == username).first():
            raise ValueError("Username already registered")
        if db.query(User).filter(User.email == email).first():
            raise ValueError("Email already registered")

        try:
            user_role = UserRole(role)
        except ValueError:
            user_role = UserRole.pilot

        user = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
            role=user_role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"New user registered: {username} ({role})")
        return user

    def login(self, db: Session, username: str, password: str) -> dict:
        if len(password) < 6 or len(password) > 16:
            raise ValueError("Invalid credentials")
        user = db.query(User).filter(User.username == username).first()
        if not user or not verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")

        user.last_login = datetime.utcnow()
        db.commit()

        token_data = {"sub": str(user.id), "role": user.role.value, "username": user.username}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        logger.info(f"User logged in: {username}")
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    def refresh(self, db: Session, refresh_token: str) -> dict:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise ValueError("Invalid token type")

            user = db.query(User).filter(User.id == int(payload["sub"])).first()
            if not user:
                raise ValueError("User not found")

            token_data = {"sub": str(user.id), "role": user.role.value, "username": user.username}
            new_access = create_access_token(token_data)
            new_refresh = create_refresh_token(token_data)
            return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}
        except JWTError:
            raise ValueError("Invalid or expired token")

    def get_current_user(self, db: Session, token: str) -> Optional[User]:
        try:
            payload = decode_token(token)
            user = db.query(User).filter(User.id == int(payload["sub"])).first()
            return user
        except (JWTError, ValueError):
            return None

    def update_profile(self, db: Session, user: User, payload: dict) -> User:
        for field in ("full_name", "designation", "organization", "phone", "location", "bio"):
            if field in payload:
                value = payload[field].strip() if isinstance(payload[field], str) else payload[field]
                setattr(user, field, value or None)
        db.commit()
        db.refresh(user)
        logger.info(f"User profile updated: {user.username}")
        return user

auth_service = AuthService()
