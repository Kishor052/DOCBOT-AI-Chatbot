# app/api/endpoints/upload.py
import uuid
import os
import time
import asyncio
import logging
from fastapi import APIRouter, File, UploadFile, Form, BackgroundTasks, HTTPException
from typing import List, Optional, Annotated
from pathlib import Path
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.services.ingestion_service import ingest_files_sync
from app.services.document_loader import load_documents, SUPPORTED_EXTENSIONS
from app.services.vector_store import search_similar
from app.services.cloud_storage import cloud_manager
from app.services.privacy_service import pii_redactor
from app.core.config import BASE_DIR, OPENAI_API_KEY, OPENAI_MODEL, OPENAI_API_BASE

logger = logging.getLogger(__name__)

router = APIRouter()

UPLOAD_DIR = BASE_DIR / "storage" / "raw_docs"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = SUPPORTED_EXTENSIONS | {".zip"}

STRICT_FIREWALL_RESPONSE = "I am DocsBot. I can only process and answer questions related to your uploaded documents."

@router.post("/upload")
@router.post("/upload-and-translate/")
async def upload_documents(
    file: Annotated[Optional[UploadFile], File()] = None,
    files: Annotated[Optional[List[UploadFile]], File()] = None,
    prompt: Annotated[Optional[str], Form()] = "Summarize these documents",
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Ultra-fast upload & RAG endpoint with strict firewall guardrails."""
    t_start = time.time()
    
    upload_list: List[UploadFile] = []
    if file:
        upload_list.append(file)
    if files:
        upload_list.extend(files)

    effective_prompt = prompt.strip() if (prompt and prompt.strip()) else "Summarize these documents."
    api_key = OPENAI_API_KEY or os.getenv("GROQ_API_KEY")

    job_id = str(uuid.uuid4())
    doc_count = 0
    extracted_text = ""
    zip_detected = False

    if upload_list:
        job_dir = UPLOAD_DIR / job_id
        job_dir.mkdir(parents=True, exist_ok=True)

        saved_paths: List[Path] = []

        for upload in upload_list:
            suffix = Path(upload.filename).suffix.lower()
            if suffix not in ALLOWED_EXTENSIONS:
                continue
            if suffix == ".zip":
                zip_detected = True

            dest = job_dir / upload.filename
            content = await upload.read()

            with dest.open("wb") as out_file:
                out_file.write(content)
            saved_paths.append(dest)

            # ☁️ Trigger Cloud Object Storage Upload (AWS S3 / Supabase)
            cloud_key = f"{job_id}/{upload.filename}"
            asyncio.create_task(cloud_manager.upload_file_to_cloud(dest, cloud_key))

        if saved_paths:
            # 1️⃣ Add background task for vector indexing
            background_tasks.add_task(ingest_files_sync, job_id, saved_paths)

            # 2️⃣ Fast preview sampling
            loaded_docs = await asyncio.to_thread(load_documents, saved_paths, max_files=10)
            doc_count = len(loaded_docs)
            extracted_text = "\n\n".join([doc.page_content for doc in loaded_docs])
    else:
        # No new files attached -> Retrieve relevant context from ChromaDB RAG store!
        retrieved_chunks = await asyncio.to_thread(search_similar, effective_prompt, n_results=5)
        if retrieved_chunks:
            extracted_text = "\n\n--- Retrieved Vector DB Context ---\n\n" + "\n\n".join(retrieved_chunks)
            doc_count = len(retrieved_chunks)
        else:
            # No files uploaded and vector store is empty -> Ask user to upload document first!
            return {
                "job_id": job_id,
                "message": "No documents provided.",
                "file_count": 0,
                "doc_count": 0,
                "execution_time_seconds": 0.01,
                "translation": "⚠️ **Please upload a document or ZIP archive first before prompting.**\n\nDocsBot requires at least one document (PDF, DOCX, TXT, or ZIP archive) attached to analyze and answer your questions."
            }

    if not api_key or api_key.strip() == "" or "your_" in api_key:
        return {
            "job_id": job_id,
            "message": "API key missing.",
            "error": "OpenAI/Groq API key is invalid or not set."
        }

    # 🛡️ Enterprise PII Protection: Redact sensitive numbers/keys before LLM processing
    extracted_text, pii_stats = pii_redactor.redact_sensitive_text(extracted_text, redact_emails=False)

    MAX_INPUT_CHARS = 3500
    if len(extracted_text) > MAX_INPUT_CHARS:
        extracted_text = extracted_text[:MAX_INPUT_CHARS] + "\n\n[Content sampled for instant response. All documents fully indexed in background.]"

    try:
        # Smart Model & Provider Auto-Detector (OpenAI vs Groq)
        base_url = OPENAI_API_BASE
        if api_key.startswith("sk-") and "groq" not in api_key:
            # Native OpenAI API Key
            base_url = "https://api.openai.com/v1"
            model_name = "gpt-4o-mini"
        elif api_key.startswith("gsk_"):
            # Groq Cloud API Key
            base_url = "https://api.groq.com/openai/v1"
            model_name = OPENAI_MODEL if (OPENAI_MODEL and "gpt" not in OPENAI_MODEL and "compound" not in OPENAI_MODEL) else "llama-3.3-70b-versatile"
        else:
            model_name = OPENAI_MODEL or "llama-3.3-70b-versatile"

        llm = ChatOpenAI(
            model=model_name,
            temperature=0.0,
            openai_api_key=api_key,
            base_url=base_url,
            max_tokens=1000,
        )

        sys_prompt = (
            "You are DocsBot, a strictly specialized AI document processing assistant. "
            "YOUR MANDATORY FIREWALL RULE: You MUST ONLY answer questions, extract information, summarize, or analyze data based STRICTLY on the provided document context. "
            "If the user asks ANY general conversation question, greeting (e.g. 'hello', 'hi', 'how are you', 'what can you do'), general knowledge, coding help, or ANYTHING outside the scope of processing the provided documents, "
            "you MUST refuse and respond ONLY with this exact sentence:\n"
            "\"I am DocsBot. I can only process and answer questions related to your uploaded documents.\"\n\n"
            "FORMATTING GUIDELINES:\n"
            "1. CITATIONS: Whenever extracting facts or answering, cite the source document name using the format [📄 filename.ext].\n"
            "2. COMPARISON MATRICES: When comparing multiple profiles, resumes, or documents, format the answer into a clear Markdown Table."
        )
        if zip_detected:
            sys_prompt += " The user uploaded a ZIP archive containing multiple documents."

        user_content = f"Question/Task:\n{effective_prompt}"
        if extracted_text:
            user_content = f"Document Context:\n{extracted_text}\n\n" + user_content

        messages = [
            SystemMessage(content=sys_prompt),
            HumanMessage(content=user_content)
        ]

        try:
            response = await asyncio.to_thread(llm.invoke, messages)
        except Exception as api_err:
            err_str = str(api_err)
            logger.warning(f"API Error ({err_str}). Retrying with smart model fallback...")
            fallback_model = "gpt-3.5-turbo" if api_key.startswith("sk-") else "llama-3.1-8b-instant"
            fallback_base = "https://api.openai.com/v1" if api_key.startswith("sk-") else "https://api.groq.com/openai/v1"

            compressed_text = extracted_text[:1800] if len(extracted_text) > 1800 else extracted_text
            user_content_retry = f"Document Context:\n{compressed_text}\n\nQuestion/Task:\n{effective_prompt}" if compressed_text else f"Question/Task:\n{effective_prompt}"
            messages_retry = [
                SystemMessage(content=sys_prompt),
                HumanMessage(content=user_content_retry)
            ]
            llm_fallback = ChatOpenAI(
                model=fallback_model,
                temperature=0.0,
                openai_api_key=api_key,
                base_url=fallback_base,
                max_tokens=800,
            )
            response = await asyncio.to_thread(llm_fallback.invoke, messages_retry)

        t_total = time.time() - t_start

        return {
            "job_id": job_id,
            "message": f"Processed request in {t_total:.2f}s",
            "file_count": len(upload_list),
            "doc_count": doc_count,
            "execution_time_seconds": round(t_total, 2),
            "translation": response.content
        }
    except Exception as e:
        logger.error(f"Instant response failed: {e}")
        return {
            "job_id": job_id,
            "message": "Processing error occurred.",
            "error": str(e)
        }
