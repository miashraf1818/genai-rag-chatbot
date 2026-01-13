#!/bin/bash

# Activate virtual environment and start the FastAPI server

echo "🚀 Starting GenAI RAG Chatbot Server..."

# Activate virtual environment
source .venv/bin/activate

# Start server with hot reload
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
