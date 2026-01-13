from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database.connection import get_db
from backend.database.models import User
from backend.auth.schemas import (
    UserRegister, UserLogin, Token, UserResponse,
    UserProfileUpdate, UserProfileResponse
)
from backend.auth.utils import verify_password, get_password_hash, create_access_token
from backend.auth.dependencies import get_current_user
from backend.utils.email_service import email_service
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.responses import RedirectResponse
import httpx
from decouple import config


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user + send welcome email"""

    # ✅ Check if user exists by email (IMPROVED ERROR MESSAGE)
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="⚠️ User with this email already exists. Please login instead."
        )

    # ✅ Check if username exists (IMPROVED ERROR MESSAGE)
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="⚠️ Username already taken. Please choose another one."
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        is_verified=True  # Auto-verify for now
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 🎉 SEND WELCOME EMAIL (async in background - won't block response)
    try:
        email_service.send_welcome_email(new_user.email, new_user.username)
    except Exception as e:
        print(f"⚠️ Failed to send welcome email: {e}")

    # Create access token
    access_token = create_access_token(data={"sub": new_user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "username": new_user.username,
            "is_admin": new_user.is_admin
        }
    }


@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password"""

    user = db.query(User).filter(User.email == user_credentials.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Create token
    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_admin": user.is_admin
        }
    }


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


@router.put("/profile", response_model=UserProfileResponse)
def update_profile(
        profile_data: UserProfileUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Update user profile (name, bio, avatar, phone)"""

    # Update only provided fields
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name

    if profile_data.bio is not None:
        current_user.bio = profile_data.bio

    if profile_data.avatar_url is not None:
        current_user.avatar_url = profile_data.avatar_url

    if profile_data.phone is not None:
        current_user.phone = profile_data.phone

    current_user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(current_user)

    return current_user


@router.post("/logout")
def logout():
    """Logout user (client deletes token)"""
    return {"message": "Successfully logged out"}


# OAuth config
config_data = Config('.env')
oauth = OAuth()
oauth.register(
    name='google',
    client_id=config("GOOGLE_CLIENT_ID"),
    client_secret=config("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)


@router.get("/google/login")
async def google_login(request: Request):
    """Redirect to Google OAuth"""
    # Callback should go to BACKEND, not frontend!
    redirect_uri = "http://localhost:8000/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        # Get token from Google
        token = await oauth.google.authorize_access_token(request)

        # Get user info
        user_info = token.get('userinfo')
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info")

        email = user_info.get('email')
        google_id = user_info.get('sub')
        full_name = user_info.get('name')
        avatar_url = user_info.get('picture')

        # Check if user exists
        user = db.query(User).filter(User.email == email).first()

        if not user:
            # Create new user from Google
            username = email.split('@')[0]  # Use email prefix as username

            # Check if username exists
            counter = 1
            original_username = username
            while db.query(User).filter(User.username == username).first():
                username = f"{original_username}{counter}"
                counter += 1

            user = User(
                email=email,
                username=username,
                google_id=google_id,
                full_name=full_name,
                avatar_url=avatar_url,
                is_verified=True,
                hashed_password=None  # No password for Google users
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Send welcome email
            try:
                email_service.send_welcome_email(user.email, user.username)
            except Exception as e:
                print(f"⚠️ Failed to send welcome email: {e}")
        else:
            # Update existing user with Google info
            if not user.google_id:
                user.google_id = google_id
            user.avatar_url = avatar_url
            user.full_name = full_name
            user.last_login = datetime.utcnow()
            db.commit()

        # Create JWT token
        access_token = create_access_token(data={"sub": user.email})

        # Redirect to frontend with token
        frontend_url = config("FRONTEND_URL", default="http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}/auth/success?token={access_token}")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth failed: {str(e)}")
