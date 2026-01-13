from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models import User
from backend.auth.dependencies import get_current_user
from backend.auth.utils import get_password_hash, verify_password
from pydantic import BaseModel
from typing import Optional
import os
import shutil

router = APIRouter(prefix="/api/profile", tags=["Profile"])


# ============= REQUEST/RESPONSE MODELS =============

class ProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# ============= ENDPOINTS =============

@router.get("/")
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "bio": current_user.bio,
        "avatar_url": current_user.avatar_url,
        "created_at": current_user.created_at.isoformat(),
        "is_admin": current_user.is_admin
    }


@router.put("/")
async def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if data.full_name is not None:
        current_user.full_name = data.full_name
    
    if data.bio is not None:
        current_user.bio = data.bio
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully",
        "profile": {
            "full_name": current_user.full_name,
            "bio": current_user.bio
        }
    }


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload profile avatar"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only image files allowed (JPG, PNG, WEBP)")
    
    # Create avatars directory
    avatar_dir = "avatars"
    os.makedirs(avatar_dir, exist_ok=True)
    
    # Generate filename
    file_ext = os.path.splitext(file.filename)[1]
    avatar_filename = f"{current_user.id}_{current_user.username}{file_ext}"
    avatar_path = os.path.join(avatar_dir, avatar_filename)
    
    # Save file
    with open(avatar_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update user avatar_url
    current_user.avatar_url = f"/{avatar_dir}/{avatar_filename}"
    db.commit()
    
    return {
        "message": "Avatar uploaded successfully",
        "avatar_url": current_user.avatar_url
    }


@router.put("/password")
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Verify current password
    if not current_user.hashed_password:
        raise HTTPException(status_code=400, detail="Cannot change password for OAuth users")
    
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
