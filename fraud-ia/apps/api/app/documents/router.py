from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..core.db import get_db
from . import repository

router = APIRouter(prefix="/api/documentos", tags=["documents"])


@router.get("/criticos")
def get_critical_documents(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return repository.get_critical_documents(db, limit=limit)
