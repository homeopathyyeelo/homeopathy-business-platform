"""
Configuration settings for Invoice Parser Service
"""

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Service
    SERVICE_NAME: str = "invoice-parser-service"
    SERVICE_PORT: int = 8005
    LOG_LEVEL: str = "INFO"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_PREFIX: str = "homeoerp"
    
    # MinIO/S3
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "invoices"
    MINIO_SECURE: bool = False
    
    # OCR
    TESSERACT_CMD: Optional[str] = None  # Auto-detect
    OCR_LANG: str = "eng"
    
    # Matching
    FUZZY_MATCH_THRESHOLD: float = 0.75
    AUTO_MATCH_THRESHOLD: float = 0.85
    
    # LLM (Optional)
    OPENAI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-3.5-turbo"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: list = [".pdf", ".PDF"]
    
    # Processing
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
