"""
RAG (Retrieval-Augmented Generation) Service
Handles document retrieval and context generation for AI responses
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
import json

from .database import DatabaseManager
from .embeddings import EmbeddingService

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, embedding_service: EmbeddingService, db_manager: DatabaseManager):
        self.embedding_service = embedding_service
        self.db_manager = db_manager
        
    async def initialize(self):
        """Initialize RAG service"""
        try:
            logger.info("RAG service initialized")
        except Exception as e:
            logger.error(f"Error initializing RAG service: {str(e)}")
            raise
    
    async def retrieve_documents(
        self, 
        document_ids: List[str], 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Retrieve documents by IDs"""
        try:
            documents = []
            for doc_id in document_ids[:limit]:
                # In a real implementation, you would query the database
                # For now, return mock documents
                documents.append({
                    "id": doc_id,
                    "text": f"Document content for {doc_id}",
                    "metadata": {"type": "product", "source": "catalog"}
                })
            
            return documents
            
        except Exception as e:
            logger.error(f"Error retrieving documents: {str(e)}")
            raise
    
    async def search_similar_documents(
        self,
        query: str,
        source_type: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for similar documents using vector similarity"""
        try:
            # Create embedding for query
            query_embedding = await self.embedding_service.embed_single_text(query)
            
            # Search for similar embeddings
            similar_docs = await self.db_manager.search_embeddings(
                query_embedding=query_embedding,
                source_type=source_type,
                limit=limit
            )
            
            return similar_docs
            
        except Exception as e:
            logger.error(f"Error searching similar documents: {str(e)}")
            raise
    
    async def index_documents(self, documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Index documents for retrieval"""
        try:
            indexed_count = 0
            
            for doc in documents:
                try:
                    # Create embedding for document text
                    text = doc.get("text", "")
                    if not text:
                        continue
                    
                    embedding = await self.embedding_service.embed_single_text(text)
                    
                    # Store in database
                    await self.db_manager.store_embedding(
                        source_type=doc.get("source_type", "document"),
                        source_id=doc.get("id", ""),
                        text=text,
                        embedding=embedding,
                        metadata=doc.get("metadata", {})
                    )
                    
                    indexed_count += 1
                    
                except Exception as e:
                    logger.error(f"Error indexing document {doc.get('id', 'unknown')}: {str(e)}")
                    continue
            
            return {
                "indexed": indexed_count,
                "total": len(documents),
                "success_rate": indexed_count / len(documents) if documents else 0
            }
            
        except Exception as e:
            logger.error(f"Error indexing documents: {str(e)}")
            raise
    
    async def get_context_for_prompt(
        self,
        prompt: str,
        context_type: str = "general",
        max_context_length: int = 2000
    ) -> str:
        """Get relevant context for a prompt"""
        try:
            # Search for similar documents
            similar_docs = await self.search_similar_documents(
                query=prompt,
                source_type=context_type,
                limit=3
            )
            
            # Build context string
            context_parts = []
            current_length = 0
            
            for doc in similar_docs:
                doc_text = doc.get("text", "")
                if current_length + len(doc_text) > max_context_length:
                    break
                
                context_parts.append(f"Context: {doc_text}")
                current_length += len(doc_text)
            
            return "\n\n".join(context_parts)
            
        except Exception as e:
            logger.error(f"Error getting context for prompt: {str(e)}")
            return ""
    
    async def generate_contextual_prompt(
        self,
        base_prompt: str,
        context_type: str = "general",
        include_metadata: bool = True
    ) -> str:
        """Generate a prompt with relevant context"""
        try:
            # Get relevant context
            context = await self.get_context_for_prompt(base_prompt, context_type)
            
            if not context:
                return base_prompt
            
            # Build enhanced prompt
            enhanced_prompt = f"""Based on the following context:

{context}

Please respond to: {base_prompt}

Provide a helpful and accurate response based on the context provided."""
            
            return enhanced_prompt
            
        except Exception as e:
            logger.error(f"Error generating contextual prompt: {str(e)}")
            return base_prompt
