"""
Database manager for AI Service
Handles connections to PostgreSQL with pgvector extension
"""

import os
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, JSON, select, insert, update
import redis.asyncio as redis

logger = logging.getLogger(__name__)

Base = declarative_base()

class AIModel(Base):
    __tablename__ = "ai_models"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    variant = Column(String)
    endpoint_url = Column(String, nullable=False)
    status = Column(String, default="ready")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AIPrompt(Base):
    __tablename__ = "ai_prompts"
    
    id = Column(String, primary_key=True)
    key = Column(String, unique=True)
    language = Column(String, default="en")
    prompt_template = Column(Text, nullable=False)
    description = Column(Text)
    last_used = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class AIRequest(Base):
    __tablename__ = "ai_requests"
    
    id = Column(String, primary_key=True)
    requestor_user_id = Column(String)
    model_id = Column(String)
    prompt = Column(Text, nullable=False)
    context = Column(JSON)
    response = Column(Text)
    tokens_used = Column(Integer)
    cost_estimate = Column(Float)
    status = Column(String, default="done")
    created_at = Column(DateTime, default=datetime.utcnow)

class Embedding(Base):
    __tablename__ = "embeddings"
    
    id = Column(String, primary_key=True)
    source_type = Column(String)  # product, faq, template, doc
    source_id = Column(String)    # id of product/faq/etc
    text = Column(Text)
    embedding = Column(String)    # JSON string of vector
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.session_factory = None
        self.redis_client = None
        self.pg_pool = None
        
    async def initialize(self):
        """Initialize database connections"""
        try:
            # PostgreSQL connection
            database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy")
            # Use asyncpg for async PostgreSQL connections
            async_database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
            self.engine = create_async_engine(async_database_url, echo=False)
            self.session_factory = async_sessionmaker(
                self.engine, 
                class_=AsyncSession, 
                expire_on_commit=False
            )
            
            # Redis connection
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            
            # Direct PostgreSQL connection for vector operations
            self.pg_pool = await asyncpg.create_pool(
                database_url,
                min_size=5,
                max_size=20
            )
            
            logger.info("Database connections initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}")
            raise
    
    async def health_check(self) -> bool:
        """Check database health"""
        try:
            async with self.session_factory() as session:
                await session.execute(select(1))
            await self.redis_client.ping()
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return False
    
    async def log_ai_request(
        self,
        user_id: Optional[str],
        model: str,
        prompt: str,
        response: str,
        tokens_used: int,
        context_documents: Optional[List[str]] = None
    ):
        """Log AI request for audit purposes"""
        try:
            async with self.session_factory() as session:
                ai_request = AIRequest(
                    id=f"req_{datetime.utcnow().timestamp()}",
                    requestor_user_id=user_id,
                    model_id=model,
                    prompt=prompt,
                    response=response,
                    tokens_used=tokens_used,
                    context=json.dumps(context_documents) if context_documents else None,
                    status="done"
                )
                session.add(ai_request)
                await session.commit()
                
        except Exception as e:
            logger.error(f"Error logging AI request: {str(e)}")
    
    async def store_embedding(
        self,
        source_type: str,
        source_id: str,
        text: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Store embedding in database"""
        try:
            embedding_id = f"emb_{datetime.utcnow().timestamp()}"
            
            async with self.session_factory() as session:
                embedding_record = Embedding(
                    id=embedding_id,
                    source_type=source_type,
                    source_id=source_id,
                    text=text,
                    embedding=json.dumps(embedding),
                    metadata=metadata
                )
                session.add(embedding_record)
                await session.commit()
                
            return embedding_id
            
        except Exception as e:
            logger.error(f"Error storing embedding: {str(e)}")
            raise
    
    async def search_embeddings(
        self,
        query_embedding: List[float],
        source_type: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search for similar embeddings using vector similarity"""
        try:
            # Use direct PostgreSQL connection for vector operations
            async with self.pg_pool.acquire() as conn:
                # Convert embedding to PostgreSQL vector format
                vector_str = "[" + ",".join(map(str, query_embedding)) + "]"
                
                query = """
                    SELECT id, source_type, source_id, text, metadata, 
                           embedding <-> $1::vector as distance
                    FROM embeddings
                    WHERE ($2::text IS NULL OR source_type = $2)
                    ORDER BY embedding <-> $1::vector
                    LIMIT $3
                """
                
                rows = await conn.fetch(query, vector_str, source_type, limit)
                
                results = []
                for row in rows:
                    results.append({
                        "id": row["id"],
                        "source_type": row["source_type"],
                        "source_id": row["source_id"],
                        "text": row["text"],
                        "metadata": row["metadata"],
                        "distance": float(row["distance"])
                    })
                
                return results
                
        except Exception as e:
            logger.error(f"Error searching embeddings: {str(e)}")
            raise
    
    async def get_ai_prompt(self, key: str) -> Optional[Dict[str, Any]]:
        """Get AI prompt by key"""
        try:
            async with self.session_factory() as session:
                result = await session.execute(
                    select(AIPrompt).where(AIPrompt.key == key)
                )
                prompt = result.scalar_one_or_none()
                
                if prompt:
                    return {
                        "id": prompt.id,
                        "key": prompt.key,
                        "language": prompt.language,
                        "prompt_template": prompt.prompt_template,
                        "description": prompt.description,
                        "last_used": prompt.last_used
                    }
                return None
                
        except Exception as e:
            logger.error(f"Error getting AI prompt: {str(e)}")
            return None
    
    async def update_prompt_usage(self, key: str):
        """Update last used timestamp for prompt"""
        try:
            async with self.session_factory() as session:
                await session.execute(
                    update(AIPrompt)
                    .where(AIPrompt.key == key)
                    .values(last_used=datetime.utcnow())
                )
                await session.commit()
                
        except Exception as e:
            logger.error(f"Error updating prompt usage: {str(e)}")
    
    async def cache_set(self, key: str, value: Any, ttl: int = 3600):
        """Set cache value in Redis"""
        try:
            await self.redis_client.setex(key, ttl, json.dumps(value))
        except Exception as e:
            logger.error(f"Error setting cache: {str(e)}")
    
    async def cache_get(self, key: str) -> Optional[Any]:
        """Get cache value from Redis"""
        try:
            value = await self.redis_client.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.error(f"Error getting cache: {str(e)}")
            return None
    
    async def close(self):
        """Close database connections"""
        try:
            if self.engine:
                await self.engine.dispose()
            if self.redis_client:
                await self.redis_client.close()
            if self.pg_pool:
                await self.pg_pool.close()
            logger.info("Database connections closed")
        except Exception as e:
            logger.error(f"Error closing database connections: {str(e)}")
