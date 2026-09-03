# backend/main.py
"""FastAPI application entry point for DocBot.
   - Includes CORS middleware.
   - Mounts central router defined in `app/api/router.py`.
   - Provides health check endpoint.
"""
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.router import router as api_router

# ---------------------------------------------------------------------------
# Environment & Logging Configuration
# ---------------------------------------------------------------------------
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# FastAPI Application Setup
# ---------------------------------------------------------------------------
app = FastAPI(title="DocBot RAG Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include central API routers (/api/upload, /api/status, /api/query)
app.include_router(api_router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}