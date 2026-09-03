# backend/app/api/endpoints/status.py
"""Simple endpoint to poll ingestion job status.
   Returns one of: "not_found", "processing", "completed", "error: ..."
"""
from fastapi import APIRouter, HTTPException

from app.services.ingestion_service import get_job_status

router = APIRouter()

@router.get("/status/{job_id}")
async def job_status(job_id: str):
    status = get_job_status(job_id)
    if status == "not_found":
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job_id": job_id, "status": status}
