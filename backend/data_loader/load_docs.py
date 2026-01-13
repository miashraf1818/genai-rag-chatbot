# backend/data_loader/load_docs.py
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
import os
from dotenv import load_dotenv

load_dotenv(".env")

# Initialize Pinecone (new way, Nov 2025)
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# Load PDF
loader = PyPDFLoader('data/docs/django_guide.pdf')
documents = loader.load()

# Split into chunks
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
docs = splitter.split_documents(documents)

# Create embeddings
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-en-v1.5"  # 1024 dimensions
)
# Upload to Pinecone
vectorstore = PineconeVectorStore.from_documents(
    docs,
    embeddings,
    index_name="my-genai-index"
)

print('✅ Uploaded docs to Pinecone!')
