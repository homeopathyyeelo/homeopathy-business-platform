"""
MinIO Storage Service
Handle PDF file storage
"""

from minio import Minio
from minio.error import S3Error
from app.core.config import settings
import io

class MinIOStorage:
    """MinIO/S3 storage for invoice PDFs"""
    
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket()
    
    def _ensure_bucket(self):
        """Create bucket if not exists"""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error as e:
            print(f"MinIO bucket error: {e}")
    
    async def upload(self, path: str, content: bytes):
        """Upload file to MinIO"""
        try:
            self.client.put_object(
                self.bucket,
                path,
                io.BytesIO(content),
                length=len(content),
                content_type='application/pdf'
            )
        except S3Error as e:
            raise Exception(f"Upload failed: {e}")
    
    async def download(self, path: str) -> bytes:
        """Download file from MinIO"""
        try:
            response = self.client.get_object(self.bucket, path)
            return response.read()
        except S3Error as e:
            raise Exception(f"Download failed: {e}")
    
    def get_url(self, path: str, expires: int = 3600) -> str:
        """Get presigned URL for file"""
        try:
            return self.client.presigned_get_object(
                self.bucket,
                path,
                expires=expires
            )
        except S3Error as e:
            raise Exception(f"URL generation failed: {e}")
