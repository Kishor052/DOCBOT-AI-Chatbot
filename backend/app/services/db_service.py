# app/services/db_service.py
import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ppzdnxmglhwnbcilvueq.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_emFs80qw6NitAinWCu3Ceg_cLkzLZTQ")

class CloudDatabaseService:
    """Production Database Manager for Syncing User Sessions Across Devices (Laptop & Phone)."""

    def __init__(self):
        self.supabase = None
        self._init_client()

    def _init_client(self):
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                from supabase import create_client
                self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
                logger.info("Supabase Cross-Device Database Client Initialized Successfully!")
            except Exception as e:
                logger.warning(f"Supabase client initialization warning: {e}")

    def save_chat_session(self, user_email: str, session_id: str, title: str, messages: List[Dict[str, Any]]) -> bool:
        """Saves or updates a chat session in Supabase Cloud for cross-device sync."""
        if not self.supabase:
            return False
        try:
            payload = {
                "session_id": session_id,
                "user_email": user_email.lower(),
                "title": title,
                "messages": messages,
                "updated_at": "now()"
            }
            self.supabase.table("chat_history").upsert(payload, on_conflict="session_id").execute()
            return True
        except Exception as e:
            logger.error(f"Failed to sync session to Supabase DB: {e}")
            return False

    def get_user_sessions(self, user_email: str) -> List[Dict[str, Any]]:
        """Retrieves all chat sessions for a specific user email across any device."""
        if not self.supabase:
            return []
        try:
            res = self.supabase.table("chat_history").select("*").eq("user_email", user_email.lower()).order("updated_at", desc=True).execute()
            return res.data if res and hasattr(res, "data") else []
        except Exception as e:
            logger.error(f"Failed to fetch user sessions from Supabase DB: {e}")
            return []

db_service = CloudDatabaseService()
