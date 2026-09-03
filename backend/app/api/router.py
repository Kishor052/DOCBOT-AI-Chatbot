# backend/app/api/router.py
"""Central router that aggregates all endpoint routers.
   The FastAPI app will include this router via `app.include_router(router)`.
"""
from fastapi import APIRouter

from .endpoints.upload import router as upload_router
from .endpoints.status import router as status_router
from .endpoints.rag import router as rag_router

router = APIRouter()
router.include_router(upload_router, prefix="/api")
router.include_router(status_router, prefix="/api")
router.include_router(rag_router, prefix="/api")
