# app/api/endpoints/history.py
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.services.db_service import db_service

router = APIRouter()

class SyncSessionRequest(BaseModel):
    user_email: str
    session_id: str
    title: str
    messages: List[Dict[str, Any]]

@router.post("/history/sync")
async def sync_session(req: SyncSessionRequest):
    if not req.user_email or not req.session_id:
        raise HTTPException(status_code=400, detail="User email and session ID required")
    
    success = db_service.save_chat_session(req.user_email, req.session_id, req.title, req.messages)
    return {"status": "synced" if success else "local_only", "session_id": req.session_id}

@router.get("/history")
async def get_history(user_email: str = Query(..., description="User Gmail address")):
    if not user_email:
        return {"sessions": []}
    
    sessions = db_service.get_user_sessions(user_email)
    return {"user_email": user_email, "sessions": sessions}
