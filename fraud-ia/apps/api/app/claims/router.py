from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.db import get_db
from . import repository, schemas

router = APIRouter(prefix="/api", tags=["claims"])


@router.get("/kpis", response_model=schemas.KPIs)
def get_kpis(db: Session = Depends(get_db)):
    return repository.get_kpis(db)


@router.get("/siniestros", response_model=schemas.SiniestroPage)
def list_siniestros(
    nivel_riesgo: Optional[str] = Query(None),
    ramo: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    score_min: Optional[float] = Query(None),
    estado_revision: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    result = repository.list_siniestros(
        db, nivel_riesgo=nivel_riesgo, ramo=ramo, search=search,
        score_min=score_min, estado_revision=estado_revision, limit=limit, offset=offset
    )
    return schemas.SiniestroPage(
        items=result["items"],
        total=result["total"],
        limit=limit,
        offset=offset,
    )


@router.get("/narrativas/similares")
def get_narrativas_similares(
    threshold: float = Query(0.22, ge=0.0, le=1.0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return repository.get_narrativas_similares(db, threshold=threshold, limit=limit)


@router.get("/siniestros/{id_siniestro}")
def get_siniestro(id_siniestro: str, db: Session = Depends(get_db)):
    detail = repository.get_siniestro_detail(db, id_siniestro)
    if not detail:
        raise HTTPException(status_code=404, detail="Siniestro no encontrado")
    return detail
