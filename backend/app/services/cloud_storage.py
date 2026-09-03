# app/services/cloud_storage.py
import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Cloud Environment Configuration
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "docbot-documents")

class CloudStorageManager:
    """Production-Grade Cloud Object Storage Manager (AWS S3 & Supabase Storage)."""
    
    def __init__(self):
        self.provider = self._detect_provider()
        logger.info(f"Cloud Storage Provider Initialized: {self.provider}")

    def _detect_provider(self) -> str:
        if AWS_S3_BUCKET and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
            return "s3"
        elif SUPABASE_URL and SUPABASE_KEY:
            return "supabase"
        return "local"

    async def upload_file_to_cloud(self, local_file_path: Path, destination_name: str) -> Dict[str, Any]:
        """Uploads a local file to Cloud Object Storage (S3 or Supabase)."""
        if self.provider == "s3":
            return await self._upload_to_s3(local_file_path, destination_name)
        elif self.provider == "supabase":
            return await self._upload_to_supabase(local_file_path, destination_name)
        else:
            # Fallback to local storage path with simulated Cloud URI
            cloud_url = f"file://{local_file_path.resolve()}"
            return {
                "success": True,
                "provider": "local_cloud_emulated",
                "cloud_url": cloud_url,
                "key": destination_name
            }

    async def _upload_to_s3(self, file_path: Path, key: str) -> Dict[str, Any]:
        try:
            import boto3
            s3_client = boto3.client(
                's3',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION
            )
            s3_client.upload_file(str(file_path), AWS_S3_BUCKET, key)
            cloud_url = f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
            logger.info(f"Successfully uploaded {key} to AWS S3: {cloud_url}")
            return {
                "success": True,
                "provider": "aws_s3",
                "cloud_url": cloud_url,
                "key": key
            }
        except Exception as e:
            logger.error(f"AWS S3 Upload Error: {e}")
            return {"success": False, "error": str(e), "provider": "aws_s3"}

    async def _upload_to_supabase(self, file_path: Path, key: str) -> Dict[str, Any]:
        try:
            from supabase import create_client
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            with open(file_path, 'rb') as f:
                res = supabase.storage.from_(SUPABASE_BUCKET).upload(key, f)
            cloud_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{key}"
            logger.info(f"Successfully uploaded {key} to Supabase Storage: {cloud_url}")
            return {
                "success": True,
                "provider": "supabase",
                "cloud_url": cloud_url,
                "key": key
            }
        except Exception as e:
            logger.error(f"Supabase Upload Error: {e}")
            return {"success": False, "error": str(e), "provider": "supabase"}

# Global Cloud Storage Manager Instance
cloud_manager = CloudStorageManager()
