from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models import User
from backend.auth.dependencies import get_current_user
# Lazy import vectorstore to avoid startup errors
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_core.documents import Document
import os
import tempfile

router = APIRouter(prefix="/api", tags=["File Upload"])


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and process a document file
    Supports: PDF, TXT, MD, DOCX
    """
    
    # Check file type
    allowed_extensions = ['.pdf', '.txt', '.md', '.docx']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not supported. Allowed: PDF, TXT, MD, DOCX"
        )
    
    # Check file size (max 10MB)
    content = await file.read()
    file_size = len(content)
    
    max_size = 10 * 1024 * 1024  # 10MB
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max 10MB"
        )
    
    try:
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Process based on file type
        documents = []
        
        if file_ext == '.pdf':
            # Load PDF
            loader = PyPDFLoader(temp_file_path)
            documents = loader.load()
        
        elif file_ext == '.docx':
            # Load DOCX
            try:
                loader = Docx2txtLoader(temp_file_path)
                documents = loader.load()
            except Exception as e:
                print(f"Error loading DOCX: {e}")
                # Fallback or error
                raise HTTPException(status_code=400, detail="Error reading DOCX file. Ensure it is valid.")

        elif file_ext in ['.txt', '.md']:
            # Load text file
            text_content = content.decode('utf-8')
            documents = [Document(
                page_content=text_content,
                metadata={"source": file.filename}
            )]
        
        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = text_splitter.split_documents(documents)
        
        # Add metadata
        for chunk in chunks:
            chunk.metadata['user_id'] = str(current_user.id)  # Convert to string for Pinecone
            chunk.metadata['filename'] = file.filename
            chunk.metadata['uploaded_by'] = current_user.username
        
        # Lazy import vectorstore (avoid startup errors)
        from backend.vectorstore.pinecone_utils import vectorstore
        
        # OPTION: Delete user's old documents first (uncomment if you want this)
        # This makes each user have only their LATEST upload
        # try:
        #     from pinecone import Pinecone
        #     pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        #     index = pc.Index(os.getenv("PINECONE_INDEX_NAME", "my-genai-index"))
        #     
        #     # Delete all vectors for this user
        #     index.delete(filter={"user_id": {"$eq": str(current_user.id)}})
        #     print(f"✅ Cleared old documents for user {current_user.id}")
        # except Exception as e:
        #     print(f"⚠️ Could not clear old docs: {e}")
        
        # Add to Pinecone
        vectorstore.add_documents(chunks)
        
        # Clean up temp file
        os.unlink(temp_file_path)
        
        return {
            "success": True,
            "message": f"Successfully processed {file.filename}",
            "filename": file.filename,
            "chunks_created": len(chunks),
            "file_size_kb": round(file_size / 1024, 2)
        }
    
    except Exception as e:
        # Clean up temp file if exists
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )




@router.get("/files/list")
async def list_uploaded_files(current_user: User = Depends(get_current_user)):
    """Get list of files uploaded by current user"""
    upload_dir = "uploads"
    
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        return {"files": [], "message": "No files uploaded yet"}
    
    user_files = []
    
    for filename in os.listdir(upload_dir):
        # Files are saved as: {user_id}_{timestamp}_{filename}
        if filename.startswith(f"{current_user.id}_"):
            file_path = os.path.join(upload_dir, filename)
            file_stat = os.stat(file_path)
            
            # Extract original filename (remove user_id and timestamp prefix)
            parts = filename.split('_', 2)
            original_name = parts[2] if len(parts) > 2 else filename
            
            user_files.append({
                "filename": original_name,
                "size": file_stat.st_size,
                "uploaded_at": file_stat.st_ctime,
                "full_path": filename
            })
    
    # Sort by upload time (newest first)
    user_files.sort(key=lambda x: x['uploaded_at'], reverse=True)
    
    return {
        "files": user_files,
        "count": len(user_files),
        "user": current_user.username
    }
