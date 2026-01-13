from typing import List, Dict
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone import Pinecone
from decouple import config
import uuid


class DocumentIndexer:
    """Index documents into Pinecone"""

    def __init__(self):
        # Initialize Pinecone
        pc = Pinecone(api_key=config("PINECONE_API_KEY"))
        self.index = pc.Index(config("PINECONE_INDEX_NAME"))

        # Initialize embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name="BAAI/bge-large-en-v1.5"
        )

    def embed_text(self, text: str) -> List[float]:
        """Generate embeddings for text"""
        return self.embeddings.embed_query(text)

    def index_document_chunks(
            self,
            chunks: List[Dict],
            user_id: int,
            document_id: str = None
    ) -> Dict:
        """
        Index document chunks into Pinecone

        Args:
            chunks: List of chunk dicts from DocumentProcessor
            user_id: User ID for namespace isolation
            document_id: Optional document ID for tracking

        Returns:
            Dict with indexing results
        """

        if not document_id:
            document_id = str(uuid.uuid4())

        vectors_to_upsert = []

        for chunk in chunks:
            # Generate embedding
            embedding = self.embed_text(chunk["text"])

            # Create unique ID for this chunk
            chunk_id = f"{document_id}_chunk_{chunk['chunk_index']}"

            # Prepare metadata
            metadata = {
                "user_id": user_id,
                "document_id": document_id,
                "chunk_index": chunk["chunk_index"],
                "total_chunks": chunk["total_chunks"],
                "file_name": chunk["file_name"],
                "text": chunk["text"][:1000]  # Store first 1000 chars in metadata
            }

            # Add to upsert list
            vectors_to_upsert.append({
                "id": chunk_id,
                "values": embedding,
                "metadata": metadata
            })

        # Upsert to Pinecone (batch upsert for efficiency)
        batch_size = 100
        for i in range(0, len(vectors_to_upsert), batch_size):
            batch = vectors_to_upsert[i:i + batch_size]
            self.index.upsert(vectors=batch, namespace=f"user_{user_id}")

        return {
            "document_id": document_id,
            "chunks_indexed": len(chunks),
            "status": "success"
        }

    def delete_document(self, document_id: str, user_id: int):
        """Delete all chunks of a document from Pinecone"""
        # Query to get all chunk IDs for this document
        # Then delete them
        # This is simplified - in production, you'd want better tracking
        pass

    def search_user_documents(
            self,
            query: str,
            user_id: int,
            top_k: int = 5
    ) -> List[Dict]:
        """
        Search user's documents for relevant chunks

        Args:
            query: Search query
            user_id: User ID
            top_k: Number of results to return

        Returns:
            List of relevant chunks with scores
        """
        # Generate query embedding
        query_embedding = self.embed_text(query)

        # Search in user's namespace
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            namespace=f"user_{user_id}",
            include_metadata=True
        )

        return results.get("matches", [])


# Global instance
document_indexer = DocumentIndexer()
