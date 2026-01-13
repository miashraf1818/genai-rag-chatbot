# backend/vectorstore/pinecone_utils.py
from langchain_pinecone import PineconeVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone import Pinecone
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# Initialize embeddings (same model as upload)
embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")

# Connect to existing index
vectorstore = PineconeVectorStore(
    index_name="my-genai-index",
    embedding=embeddings
)

def get_relevant_context(query: str, top_k: int = 3):
    """
    Query Pinecone for relevant document chunks
    """
    results = vectorstore.similarity_search(query, k=top_k)
    
    context_parts = []
    for doc in results:
        source = doc.metadata.get('filename', 'Unknown Source')
        context_parts.append(f"Source: {source}\nContent: {doc.page_content}")
    
    context = "\n\n---\n\n".join(context_parts)
    return context
