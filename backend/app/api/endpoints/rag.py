# backend/app/api/endpoints/rag.py
"""RAG query endpoint.
   POST /query with JSON body {"question": "...", "k": 5}
   Returns answer text and list of source citations.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.rag_chain import answer_question

router = APIRouter()

class QueryRequest(BaseModel):
    question: str = Field(..., description="User question to answer")
    k: int = Field(5, ge=1, le=20, description="Number of retrieved chunks to use")

class SourceCitation(BaseModel):
    filename: str
    page: int | None = None
    snippet: str

class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceCitation]

@router.post("/query", response_model=QueryResponse)
async def query_rag(req: QueryRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    answer, sources = answer_question(req.question, k=req.k)
    return QueryResponse(answer=answer, sources=sources)
