"""
Notification endpoints — list, mark read, delete, settings.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.base import get_db
from app.db.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    channel: str
    is_read: bool
    related_id: Optional[str]
    related_type: Optional[str]
    created_at: str


class NotificationSettingsUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    slack_webhook: Optional[str] = None
    discord_webhook: Optional[str] = None
    notify_critical: Optional[bool] = None
    notify_high: Optional[bool] = None
    notify_pipeline_fail: Optional[bool] = None


@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List notifications for the current user."""
    try:
        from app.db.models.notification import Notification
        query = db.query(Notification).filter(Notification.user_id == current_user.id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        notifs = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
        return [NotificationResponse(
            id=str(n.id), title=n.title, message=n.message,
            type=n.type, channel=n.channel, is_read=n.is_read,
            related_id=str(n.related_id) if n.related_id else None,
            related_type=n.related_type,
            created_at=str(n.created_at),
        ) for n in notifs]
    except Exception:
        return []


@router.post("/{notif_id}/read")
def mark_read(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    try:
        from app.db.models.notification import Notification
        notif = db.query(Notification).filter(
            Notification.id == notif_id,
            Notification.user_id == current_user.id
        ).first()
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found")
        notif.is_read = True
        db.commit()
        return {"message": "Marked as read"}
    except HTTPException:
        raise
    except Exception:
        return {"message": "Updated"}


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications as read."""
    try:
        from app.db.models.notification import Notification
        db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).update({"is_read": True})
        db.commit()
    except Exception:
        pass
    return {"message": "All notifications marked as read"}


@router.delete("/{notif_id}")
def delete_notification(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a notification."""
    try:
        from app.db.models.notification import Notification
        notif = db.query(Notification).filter(
            Notification.id == notif_id,
            Notification.user_id == current_user.id
        ).first()
        if notif:
            db.delete(notif)
            db.commit()
    except Exception:
        pass
    return {"message": "Deleted"}
