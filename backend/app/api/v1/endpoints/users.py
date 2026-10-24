"""User management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.base import get_db
from app.db.models.user import User
from app.core.security import hash_password, verify_password
from app.api.v1.endpoints.auth import get_current_user
from app.schemas.auth import UserResponse, UserUpdate, PasswordChange

router = APIRouter(prefix="/users", tags=["Users"])


def _user_resp(u: User) -> UserResponse:
    return UserResponse(
        id=str(u.id), email=u.email, username=u.username,
        full_name=u.full_name, role=u.role, is_active=u.is_active,
        created_at=u.created_at, last_login=u.last_login, avatar_url=u.avatar_url,
    )


@router.get("/", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "security_engineer"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return [_user_resp(u) for u in db.query(User).filter(User.is_active == True).all()]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if str(current_user.id) != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    u = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_resp(u)


@router.put("/me", response_model=UserResponse)
def update_profile(payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.email:
        if db.query(User).filter(User.email == payload.email, User.id != current_user.id).first():
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = payload.email
    if payload.full_name:
        current_user.full_name = payload.full_name
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return _user_resp(current_user)


@router.post("/me/change-password")
def change_password(payload: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Password changed successfully"}


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if str(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.is_active = False
    u.updated_at = datetime.utcnow()
    db.commit()
