from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..core.db import get_db
from . import repository

router = APIRouter(prefix="/api/proveedores", tags=["providers"])


@router.get("/riesgo")
def get_provider_risk(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return repository.get_provider_risk(db, limit=limit)
