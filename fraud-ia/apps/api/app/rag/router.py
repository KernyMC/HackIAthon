from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..core.db import get_db
from .retriever import buscar_conocimiento_negocio

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.get("/search")
def rag_search(
    query: str = Query(..., min_length=3),
    top_k: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    results = buscar_conocimiento_negocio(db, query, top_k)
    return {"query": query, "results": results}
