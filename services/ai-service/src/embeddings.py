"""
Embedding Service for AI Service
Handles text embeddings for RAG (Retrieval-Augmented Generation)
"""

import os
import asyncio
import logging
from typing import List, Dict, Any
import numpy as np

from sentence_transformers import SentenceTransformer
import torch

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.models = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    async def initialize(self):
        """Initialize embedding service"""
        try:
            # Load embedding models
            await self.load_embedding_models()
            logger.info(f"Embedding service initialized with device: {self.device}")
            
        except Exception as e:
            logger.error(f"Error initializing embedding service: {str(e)}")
            raise
    
    async def load_embedding_models(self):
        """Load embedding models"""
        try:
            # Load a lightweight embedding model for development
            model_name = "all-MiniLM-L6-v2"  # 384 dimensions
            
            model = SentenceTransformer(model_name)
            if self.device == "cuda":
                model = model.to(self.device)
            
            self.models["embed-small-v1"] = {
                "model": model,
                "dimensions": 384,
                "name": model_name
            }
            
            logger.info(f"Loaded embedding model: {model_name}")
            
        except Exception as e:
            logger.warning(f"Could not load embedding models: {str(e)}")
            # Continue without embedding models - will use mock embeddings
    
    async def embed_texts(self, texts: List[str], model: str = "embed-small-v1") -> List[List[float]]:
        """Create embeddings for texts"""
        try:
            if model in self.models:
                return await self.embed_texts_local(texts, model)
            else:
                return await self.embed_texts_mock(texts)
                
        except Exception as e:
            logger.error(f"Error creating embeddings: {str(e)}")
            raise
    
    async def embed_texts_local(self, texts: List[str], model: str) -> List[List[float]]:
        """Create embeddings using local model"""
        try:
            model_info = self.models[model]
            model_obj = model_info["model"]
            
            # Run embedding in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                None, 
                lambda: model_obj.encode(texts, convert_to_tensor=False)
            )
            
            return embeddings.tolist()
            
        except Exception as e:
            logger.error(f"Error with local embedding: {str(e)}")
            raise
    
    async def embed_texts_mock(self, texts: List[str]) -> List[List[float]]:
        """Create mock embeddings for development"""
        try:
            embeddings = []
            for text in texts:
                # Generate deterministic mock embedding
                import hashlib
                text_hash = hashlib.md5(text.encode()).hexdigest()
                seed = int(text_hash[:8], 16)
                
                np.random.seed(seed)
                embedding = np.random.normal(0, 1, 384).tolist()
                embeddings.append(embedding)
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Error creating mock embeddings: {str(e)}")
            raise
    
    async def embed_single_text(self, text: str, model: str = "embed-small-v1") -> List[float]:
        """Create embedding for single text"""
        try:
            embeddings = await self.embed_texts([text], model)
            return embeddings[0]
            
        except Exception as e:
            logger.error(f"Error creating single embedding: {str(e)}")
            raise
    
    def get_model_dimensions(self, model: str = "embed-small-v1") -> int:
        """Get dimensions for embedding model"""
        if model in self.models:
            return self.models[model]["dimensions"]
        return 384  # Default for mock embeddings
