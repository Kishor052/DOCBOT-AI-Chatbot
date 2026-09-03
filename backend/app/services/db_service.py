# app/services/db_service.py
import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ppzdnxmglhwnbcilvueq.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_emFs80qw6NitAinWCu3Ceg_cLkzLZTQ")

# Local persistent backup file store path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
LOCAL_DB_FILE = BASE_DIR / "storage" / "user_sessions.json"

class CloudDatabaseService:
    """Production Database Manager for Syncing User Sessions Across Devices (Laptop & Phone)."""

    def __init__(self):
        self.supabase = None
        self._init_client()
        self._ensure_local_db()

    def _ensure_local_db(self):
        try:
            LOCAL_DB_FILE.parent.mkdir(parents=True, exist_ok=True)
            if not LOCAL_DB_FILE.exists():
                with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
                    json.dump({}, f)
        except Exception as e:
            logger.warning(f"Local session store init warning: {e}")

    def _read_local_db(self) -> Dict[str, List[Dict[str, Any]]]:
        try:
            if LOCAL_DB_FILE.exists():
                with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Local DB read error: {e}")
        return {}

    def _write_local_db(self, data: Dict[str, List[Dict[str, Any]]]):
        try:
            with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Local DB write error: {e}")

    def _init_client(self):
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                from supabase import create_client
                self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
                logger.info("Supabase Cross-Device Database Client Initialized!")
            except Exception as e:
                logger.warning(f"Supabase client initialization warning: {e}")

    def save_chat_session(self, user_email: str, session_id: str, title: str, messages: List[Dict[str, Any]]) -> bool:
        """Saves or updates a chat session for cross-device sync."""
        email_key = user_email.lower().strip()
        
        # 1. Update local persistent storage
        try:
            db_data = self._read_local_db()
            user_sessions = db_data.get(email_key, [])
            
            existing_idx = next((i for i, s in enumerate(user_sessions) if s.get("session_id") == session_id), -1)
            session_payload = {
                "session_id": session_id,
                "user_email": email_key,
                "title": title,
                "messages": messages,
                "updated_at": "now()"
            }
            if existing_idx >= 0:
                user_sessions[existing_idx] = session_payload
            else:
                user_sessions.insert(0, session_payload)

            db_data[email_key] = user_sessions
            self._write_local_db(db_data)
        except Exception as local_err:
            logger.error(f"Local DB sync error: {local_err}")

        # 2. Try updating Supabase Cloud
        if self.supabase:
            try:
                payload = {
                    "session_id": session_id,
                    "user_email": email_key,
                    "title": title,
                    "messages": messages
                }
                self.supabase.table("chat_history").upsert(payload, on_conflict="session_id").execute()
                return True
            except Exception as e:
                logger.warning(f"Supabase sync notice: {e}")
        return True

    def get_user_sessions(self, user_email: str) -> List[Dict[str, Any]]:
        """Retrieves all chat sessions for a specific user email across any device."""
        email_key = user_email.lower().strip()
        sessions = []

        # 1. Try Supabase first
        if self.supabase:
            try:
                res = self.supabase.table("chat_history").select("*").eq("user_email", email_key).order("id", desc=True).execute()
                if res and hasattr(res, "data") and res.data:
                    return res.data
            except Exception as e:
                logger.warning(f"Supabase query notice: {e}")

        # 2. Fallback to persistent local storage
        db_data = self._read_local_db()
        return db_data.get(email_key, [])

db_service = CloudDatabaseService()
