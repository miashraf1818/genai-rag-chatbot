from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from backend.database.connection import get_db
from backend.database.models import User, ChatHistory, AdminAction, UserAnalytics
from backend.auth.dependencies import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============= PYDANTIC SCHEMAS =============

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool
    is_admin: bool
    is_blocked: bool
    created_at: datetime
    last_login: Optional[datetime]
    login_count: int
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    page_size: int


class StatsOverview(BaseModel):
    total_users: int
    active_users_7d: int
    active_users_30d: int
    total_chats: int
    total_chats_today: int
    blocked_users: int


class BlockUserRequest(BaseModel):
    reason: Optional[str] = None


class AdminActionResponse(BaseModel):
    id: int
    admin_id: int
    action_type: str
    target_user_id: Optional[int]
    details: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= ENDPOINTS =============

@router.get("/stats/overview", response_model=StatsOverview)
async def get_stats_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get overview statistics for admin dashboard"""
    
    # Total users
    total_users = db.query(User).count()
    
    # Active users (logged in last 7/30 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    active_7d = db.query(User).filter(User.last_login >= seven_days_ago).count()
    active_30d = db.query(User).filter(User.last_login >= thirty_days_ago).count()
    
    # Total chats
    total_chats = db.query(ChatHistory).count()
    
    # Chats today
    today = datetime.utcnow().date()
    chats_today = db.query(ChatHistory).filter(
        func.date(ChatHistory.timestamp) == today
    ).count()
    
    # Blocked users
    blocked_users = db.query(User).filter(User.is_blocked == True).count()
    
    return StatsOverview(
        total_users=total_users,
        active_users_7d=active_7d,
        active_users_30d=active_30d,
        total_chats=total_chats,
        total_chats_today=chats_today,
        blocked_users=blocked_users
    )


@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = Query(None, regex="^(active|blocked|all)$"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all users with pagination and filtering"""
    
    query = db.query(User)
    
    # Search filter
    if search:
        query = query.filter(
            (User.email.contains(search)) | (User.username.contains(search))
        )
    
    # Status filter
    if status == "active":
        query = query.filter(User.is_blocked == False, User.is_active == True)
    elif status == "blocked":
        query = query.filter(User.is_blocked == True)
    
    # Get total count
    total = query.count()
    
    # Pagination
    offset = (page - 1) * page_size
    users = query.order_by(desc(User.created_at)).offset(offset).limit(page_size).all()
    
    return UserListResponse(
        users=users,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get detailed information about a specific user"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's chat history count
    chat_count = db.query(ChatHistory).filter(ChatHistory.user_id == user_id).count()
    
    # Get recent chats
    recent_chats = db.query(ChatHistory).filter(
        ChatHistory.user_id == user_id
    ).order_by(desc(ChatHistory.timestamp)).limit(5).all()
    
    return {
        "user": UserResponse.from_orm(user),
        "stats": {
            "total_chats": chat_count,
        },
        "recent_chats": [
            {
                "id": chat.id,
                "question": chat.question[:100] + "..." if len(chat.question) > 100 else chat.question,
                "timestamp": chat.timestamp
            }
            for chat in recent_chats
        ]
    }


@router.post("/users/{user_id}/block")
async def block_user(
    user_id: int,
    request: BlockUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Block a user account"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_blocked:
        raise HTTPException(status_code=400, detail="User is already blocked")
    
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot block admin users")
    
    # Block the user
    user.is_blocked = True
    user.blocked_at = datetime.utcnow()
    user.blocked_by = admin.id
    user.block_reason = request.reason
    
    # Log admin action
    admin_action = AdminAction(
        admin_id=admin.id,
        action_type="BLOCK_USER",
        target_user_id=user_id,
        details=f"Reason: {request.reason}" if request.reason else None
    )
    db.add(admin_action)
    db.commit()
    
    return {"message": "User blocked successfully", "user": UserResponse.from_orm(user)}


@router.post("/users/{user_id}/unblock")
async def unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Unblock a user account"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.is_blocked:
        raise HTTPException(status_code=400, detail="User is not blocked")
    
    # Unblock the user
    user.is_blocked = False
    user.blocked_at = None
    user.blocked_by = None
    user.block_reason = None
    
    # Log admin action
    admin_action = AdminAction(
        admin_id=admin.id,
        action_type="UNBLOCK_USER",
        target_user_id=user_id
    )
    db.add(admin_action)
    db.commit()
    
    return {"message": "User unblocked successfully", "user": UserResponse.from_orm(user)}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a user account (soft delete - set is_active to False)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot delete admin users")
    
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Soft delete
    user.is_active = False
    
    # Log admin action
    admin_action = AdminAction(
        admin_id=admin.id,
        action_type="DELETE_USER",
        target_user_id=user_id
    )
    db.add(admin_action)
    db.commit()
    
    return {"message": "User deleted successfully"}


@router.post("/users/{user_id}/toggle-admin")
async def toggle_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Toggle admin status for a user"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own admin status")
    
    # Toggle admin
    user.is_admin = not user.is_admin
    
    # Log admin action
    action_type = "MAKE_ADMIN" if user.is_admin else "REMOVE_ADMIN"
    admin_action = AdminAction(
        admin_id=admin.id,
        action_type=action_type,
        target_user_id=user_id
    )
    db.add(admin_action)
    db.commit()
    
    return {"message": f"User admin status updated", "is_admin": user.is_admin}


@router.get("/logs", response_model=List[AdminActionResponse])
async def get_admin_logs(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get admin action logs"""
    
    logs = db.query(AdminAction).order_by(desc(AdminAction.created_at)).limit(limit).all()
    return logs
