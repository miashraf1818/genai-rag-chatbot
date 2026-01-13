from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models import User, Conversation, ChatHistory
from backend.auth.dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])


# ============= REQUEST/RESPONSE MODELS =============

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Chat"


class ConversationUpdate(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int
    last_message: Optional[str] = None

    class Config:
        from_attributes = True


# ============= ENDPOINTS =============

@router.post("/", response_model=dict)
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new conversation"""
    conversation = Conversation(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=data.title
    )
    
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    return {
        "id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at.isoformat(),
        "message_count": 0
    }


@router.get("/", response_model=list)
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all user's conversations"""
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()
    
    result = []
    for conv in conversations:
        # Get message count and last message
        message_count = len(conv.messages)
        last_message = conv.messages[-1].question if conv.messages else None
        
        result.append({
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at.isoformat(),
            "updated_at": conv.updated_at.isoformat(),
            "message_count": message_count,
            "last_message": last_message
        })
    
    return result


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific conversation with all messages"""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = []
    for chat in conversation.messages:
        messages.append({
            "id": chat.id,
            "question": chat.question,
            "answer": chat.answer,
            "timestamp": chat.timestamp.isoformat()
        })
    
    return {
        "id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at.isoformat(),
        "updated_at": conversation.updated_at.isoformat(),
        "messages": messages
    }


@router.put("/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    data: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rename a conversation"""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.title = data.title
    db.commit()
    
    return {
        "id": conversation.id,
        "title": conversation.title,
        "updated_at": conversation.updated_at.isoformat()
    }


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a conversation and all its messages"""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db.delete(conversation)
    db.commit()
    
    return {"message": "Conversation deleted successfully"}
