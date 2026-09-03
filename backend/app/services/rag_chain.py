# backend/app/services/rag_chain.py
"""LangChain Retrieval‑Augmented Generation chain using Groq model via OpenAI compatibility API.
"""
import os
from typing import List, Tuple
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import OPENAI_API_KEY, OPENAI_MODEL, OPENAI_API_BASE
from app.services.vector_store import get_collection

def answer_question(question: str, k: int = 3) -> Tuple[str, List[dict]]:
    """Run the RAG query and return (answer, sources)."""
    collection = get_collection()
    results = collection.query(query_texts=[question], n_results=k)

    docs = results.get("documents", [[]])[0] if results.get("documents") else []
    metas = results.get("metadatas", [[]])[0] if results.get("metadatas") else []

    context_parts = []
    sources = []
    total_len = 0
    MAX_RAG_CHARS = 4000

    for doc, meta in zip(docs, metas):
        if total_len + len(doc) > MAX_RAG_CHARS:
            doc = doc[: (MAX_RAG_CHARS - total_len)]
        context_parts.append(doc)
        total_len += len(doc)
        
        source_path = meta.get("source", meta.get("filename", "document"))
        sources.append(
            {
                "filename": os.path.basename(source_path),
                "page": meta.get("page"),
                "snippet": doc[:150].replace("\n", " "),
            }
        )
        if total_len >= MAX_RAG_CHARS:
            break

    context = "\n\n".join(context_parts) if context_parts else "No uploaded documents available."

    llm = ChatOpenAI(
        model=OPENAI_MODEL,
        temperature=0.2,
        openai_api_key=OPENAI_API_KEY,
        base_url=OPENAI_API_BASE,
        max_tokens=800,
    )

    messages = [
        SystemMessage(content="You are an intelligent document assistant. Answer the question accurately based on the provided document context."),
        HumanMessage(content=f"Document Context:\n{context}\n\nUser Question:\n{question}")
    ]

    response = llm.invoke(messages)
    return response.content, sources
