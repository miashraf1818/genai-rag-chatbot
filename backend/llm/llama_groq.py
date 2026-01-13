# backend/llm/llama_groq.py
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()


def ask_llama_with_context(query: str, context: str):
    """
    Ask Llama 3 via Groq with retrieved context
    Streams the response token by token
    """
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    # Build the prompt with context
    prompt = f"""You are a helpful AI assistant. 

**If context from documents is provided**, use it to answer the question accurately and cite relevant information.
**If no document context is available or the question is general**, answer based on your knowledge while being helpful and informative.

Retrieved Document Context:
{context}

User Question: {query}

Your Response:"""
    
    # System message with custom introduction
    system_message = """You are a helpful AI assistant created by Mohammed Ikram as part of the GenAI RAG Chatbot project.

**CORE INSTRUCTIONS:**
1. **Analyze the User's Request:** Determine if the user is asking about specific documents or general topics.
2. **Use Context Wisely:**
   - If the user asks about uploaded documents and relevant context is provided, **YOU MUST** use that context to answer. Cite the source filename (e.g., "According to resume.pdf...").
   - If the context is irrelevant or empty, **IGNORE IT** and answer based on your general knowledge.
   - If the user asks a general question (e.g., "What is Python?", "Write a poem"), answer directly using your general knowledge. Do not mention "context" or "documents" unless relevant.

3. **Identity & Introduction:**
   - **ONLY** if explicitly asked "Who created you?" or "Who made you?", respond with:
     "I'm an AI-powered chatbot created by Mohammed Ikram. This is a RAG (Retrieval-Augmented Generation) chatbot that can answer questions based on uploaded documents and provide general assistance."
   - For all other greetings ("hi", "hello"), just respond naturally.

4. **Response Style:**
   - Be professional, concise, and helpful.
   - Format answers using Markdown (bolding, lists) for readability.
"""
    
    # Stream the completion
    stream = client.chat.completions.create(
        model="llama-3.3-70b-versatile",  # Updated to current supported model
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=1024,
        stream=True
    )
    
    for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content

