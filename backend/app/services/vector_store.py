# backend/app/services/vector_store.py
"""ChromaDB vector store wrapper used by the ingestion pipeline and the RAG chain.
Persisted under <PROJECT_ROOT>/storage/vector_db. Uses local ONNX embedding model.
"""
import os
import logging
from pathlib import Path
from typing import List, Tuple

from chromadb import PersistentClient
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2

from app.core.config import VECTOR_DB_PATH

logger = logging.getLogger(__name__)

# Ensure the directory exists
Path(VECTOR_DB_PATH).mkdir(parents=True, exist_ok=True)

client = PersistentClient(path=VECTOR_DB_PATH)
_embedding_fn = ONNXMiniLM_L6_V2()

def get_collection(name: str = "doc_collection"):
    """Retrieve (or create) a collection with local embedding function."""
    return client.get_or_create_collection(name=name, embedding_function=_embedding_fn)

def add_documents(
    ids: List[str],
    documents: List[str],
    metadatas: List[dict],
    collection_name: str = "doc_collection",
):
    """Bulk add documents to Chroma. Chroma auto-embeds using ONNXMiniLM_L6_V2."""
    collection = get_collection(collection_name)
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
    )

def search_similar(query: str, n_results: int = 5, collection_name: str = "doc_collection") -> List[str]:
    """Hybrid RAG Search: Combines Dense Vector Embeddings with Keyword Match Boosting."""
    try:
        collection = get_collection(collection_name)
        if collection.count() == 0:
            return []
        
        # 1. Dense Vector Similarity Search
        res = collection.query(query_texts=[query], n_results=min(n_results * 2, collection.count()))
        if not res or "documents" not in res or not res["documents"]:
            return []
            
        retrieved_docs = [doc for doc in res["documents"][0] if doc]
        
        # 2. Hybrid Keyword Rescoring & Boosting
        query_words = set(query.lower().split())
        scored_docs: List[Tuple[float, str]] = []
        
        for idx, doc in enumerate(retrieved_docs):
            doc_lower = doc.lower()
            keyword_score = sum(1.0 for word in query_words if len(word) > 2 and word in doc_lower)
            position_score = (len(retrieved_docs) - idx) / len(retrieved_docs)
            total_score = (keyword_score * 2.0) + position_score
            scored_docs.append((total_score, doc))
            
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored_docs[:n_results]]
        
    except Exception as e:
        logger.error(f"Vector store hybrid search error: {e}")
    return []
