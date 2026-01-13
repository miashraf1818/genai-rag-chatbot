from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy.orm import Session
from backend.vectorstore.pinecone_utils import get_relevant_context
from backend.llm.llama_groq import ask_llama_with_context
from backend.auth.router import router as auth_router
from backend.auth.dependencies import get_current_user
from backend.database.models import User, ChatHistory
from backend.database.connection import get_db
import os

# Fix tokenizers parallelism warning
os.environ["TOKENIZERS_PARALLELISM"] = "false"

app = FastAPI(
    title="GenAI RAG Chatbot API",
    description="Production-ready RAG chatbot with authentication",
    version="1.0.0"
)

# ============= MIDDLEWARE =============
# Add session middleware (required for OAuth)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= INCLUDE ROUTERS =============
# Include authentication router
app.include_router(auth_router)

# Include file upload router
try:
    from backend.api.files import router as files_router
    app.include_router(files_router)
    print("✅ File upload router loaded successfully")
except ImportError:
    print("⚠️ File upload router not found - create backend/api/files.py first")

# Include conversations router
try:
    from backend.api.conversations import router as conversations_router
    app.include_router(conversations_router)
    print("✅ Conversations router loaded successfully")
except ImportError:
    print("⚠️ Conversations router not found")

# Include profile router
try:
    from backend.api.profile import router as profile_router
    app.include_router(profile_router)
    print("✅ Profile router loaded successfully")
except ImportError:
    print("⚠️ Profile router not found")

# Include chat history router
try:
    from backend.api.chat_history import router as chat_history_router
    app.include_router(chat_history_router)
except ImportError:
    print("⚠️ Chat history router not found - create backend/api/chat_history.py first")

# Include admin router
try:
    from backend.api.admin import router as admin_router
    app.include_router(admin_router)
    print("✅ Admin router loaded successfully")
except ImportError as e:
    print(f"⚠️ Admin router not found: {e}")


@app.get("/")
def root():
    return {
        "message": "GenAI RAG Chatbot API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# ============= CHAT HISTORY ENDPOINT =============
@app.get("/api/chat/history")
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get chat history for the current user"""
    history = db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id
    ).order_by(ChatHistory.timestamp.desc()).limit(limit).all()
    
    # Reverse to show oldest first
    history.reverse()
    
    return {
        "history": [
            {
                "id": chat.id,
                "question": chat.question,
                "answer": chat.answer,
                "timestamp": chat.timestamp.isoformat()
            }
            for chat in history
        ],
        "count": len(history)
    }


# ============= WEBSOCKET FOR REAL-TIME CHAT =============
@app.websocket("/ws/chat")
async def chat(websocket: WebSocket):
    """WebSocket endpoint for real-time chat (no auth for now)"""
    await websocket.accept()

    while True:
        try:
            # Receive user query
            user_query = await websocket.receive_text()

            # Get relevant context from Pinecone
            context = get_relevant_context(user_query)

            # Stream response from Llama 3
            for chunk in ask_llama_with_context(user_query, context):
                await websocket.send_text(chunk)

            # Send end signal
            await websocket.send_text("[DONE]")

        except Exception as e:
            await websocket.send_text(f"Error: {str(e)}")
            break


# ============= AUTHENTICATED CHAT WITH HISTORY SAVING =============
@app.post("/api/chat")
async def chat_with_auth(
    query: dict,  # {question: str, conversation_id?: str}
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated chat endpoint with history saving
    Requires JWT token in Authorization header
    **FILTERS DOCUMENTS BY USER_ID - Each user only sees their own docs**
    
    Request body:
    - question (required): The user's question
    - conversation_id (optional): ID of conversation to add to, creates new if not provided
    """
    from backend.database.models import Conversation
    import uuid
    
    user_query = query.get("question", "")
    conversation_id = query.get("conversation_id")

    if not user_query:
        return {"error": "Question is required"}

    # Get or create conversation
    if conversation_id:
        # Use existing conversation
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        
        if not conversation:
            return {"error": "Conversation not found"}
    else:
        # Create new conversation with title from first question
        title = user_query[:50] + "..." if len(user_query) > 50 else user_query
        conversation = Conversation(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            title=title
        )
        db.add(conversation)
        db.flush()  # Get the ID without committing

    # Get context from Pinecone - FILTERED BY USER ID
    try:
        from backend.vectorstore.pinecone_utils import vectorstore
        
        # Search with user_id filter (each user only sees their documents)
        results = vectorstore.similarity_search(
            user_query,
            k=3,
            filter={"user_id": {"$eq": str(current_user.id)}}
        )
        context = "\n\n".join([doc.page_content for doc in results])
        
        if not context:
            context = f"No documents found for user {current_user.username}. Please upload documents first."
    except Exception as e:
        print(f"Error retrieving context: {e}")
        context = "No relevant context available."

    # Get response from Llama
    response_chunks = []
    for chunk in ask_llama_with_context(user_query, context):
        response_chunks.append(chunk)

    full_response = "".join(response_chunks)

    # Save to chat history with conversation link
    chat_history = ChatHistory(
        user_id=current_user.id,
        conversation_id=conversation.id,
        question=user_query,
        answer=full_response
    )
    db.add(chat_history)
    db.commit()
    db.refresh(chat_history)

    return {
        "id": chat_history.id,
        "conversation_id": conversation.id,
        "question": user_query,
        "answer": full_response,
        "user": current_user.username,
        "timestamp": chat_history.timestamp.isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
