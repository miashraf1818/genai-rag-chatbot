from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth users

    # Profile fields
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)

    # OAuth fields
    google_id = Column(String, unique=True, nullable=True)

    # Status fields
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    
    # Admin blocking fields
    is_blocked = Column(Boolean, default=False)
    blocked_at = Column(DateTime, nullable=True)
    blocked_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    block_reason = Column(Text, nullable=True)
    login_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    chat_history = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"


class Conversation(Base):
    """Conversation/Session model - groups related chat messages"""
    __tablename__ = "conversations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, default="New Chat")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("ChatHistory", back_populates="conversation", cascade="all, delete-orphan")


class ChatHistory(Base):
    """Chat history storage"""
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=True)
    
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="chat_history")
    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<ChatHistory {self.id}>"


class AdminAction(Base):
    """Admin action audit log"""
    __tablename__ = "admin_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action_type = Column(String(50), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<AdminAction {self.action_type} by {self.admin_id}>"


class UserAnalytics(Base):
    """Daily aggregated user analytics"""
    __tablename__ = "user_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, unique=True, index=True)
    total_users = Column(Integer, default=0)
    active_users = Column(Integer, default=0)
    new_users = Column(Integer, default=0)
    total_chats = Column(Integer, default=0)
    files_uploaded = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<UserAnalytics {self.date}>"
