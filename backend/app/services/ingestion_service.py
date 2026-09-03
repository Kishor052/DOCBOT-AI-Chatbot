# backend/app/services/ingestion_service.py
"""Asynchronous ingestion pipeline for high-capacity bulk documents and ZIP archives.
   - Runs in a background worker thread (outside FastAPI event loop) so HTTP responses deliver instantly in 1-2 seconds.
"""
import uuid
import logging
from pathlib import Path
from typing import List

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.services.document_loader import load_documents
from app.services.vector_store import add_documents

logger = logging.getLogger(__name__)
_job_status = {}

def get_job_status(job_id: str) -> str:
    return _job_status.get(job_id, "not_found")

def ingest_files_sync(job_id: str, file_paths: List[Path]):
    """Synchronous background worker thread that processes bulk files & extracts ZIP archives without blocking FastAPI event loop."""
    _job_status[job_id] = "processing"
    try:
        # 1️⃣ Load & extract all raw documents
        docs = load_documents(file_paths, max_files=None)
        logger.info(f"[ingestion_service] Job {job_id}: Resolved & extracted {len(docs)} document pages.")

        if not docs:
            _job_status[job_id] = "completed_empty"
            return

        # 2️⃣ Chunking – ~1000 chars with 200 overlap
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = []
        for doc in docs:
            for chunk in splitter.split_text(doc.page_content):
                meta = dict(doc.metadata)
                meta["chunk_text"] = chunk
                chunks.append((chunk, meta))

        if not chunks:
            _job_status[job_id] = "completed_empty"
            return

        # 3️⃣ Batch insert into ChromaDB (batch size = 500)
        texts = [c[0] for c in chunks]
        metadatas = [c[1] for c in chunks]
        ids = [str(uuid.uuid4()) for _ in texts]

        BATCH_SIZE = 500
        for i in range(0, len(texts), BATCH_SIZE):
            batch_ids = ids[i:i + BATCH_SIZE]
            batch_texts = texts[i:i + BATCH_SIZE]
            batch_metadatas = metadatas[i:i + BATCH_SIZE]
            add_documents(ids=batch_ids, documents=batch_texts, metadatas=batch_metadatas)

        logger.info(f"[ingestion_service] Job {job_id}: Successfully indexed {len(chunks)} chunks across {len(docs)} documents.")
        _job_status[job_id] = "completed"
    except Exception as exc:
        _job_status[job_id] = f"error: {exc}"
        logger.error(f"[ingestion_service] Job {job_id} failed: {exc}")

# Alias for backward compatibility
ingest_files_async = ingest_files_sync
