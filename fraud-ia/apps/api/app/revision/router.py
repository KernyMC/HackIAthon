import logging
from datetime import datetime
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..core.db import get_db
from .schemas import RevisionResult, Revisor, ColaRevisionItem, RevisionAccion, KanbanColumn, KanbanCard

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["revision"])

RAMO_A_REVISOR = {
    'Vehículos':              'REV-001',
    'Automóvil':              'REV-001',
    'Salud':                  'REV-002',
    'Accidentes Personales':  'REV-002',
    'Hogar':                  'REV-003',
    'Robo':                   'REV-003',
    'Vida':                   'REV-004',
    'Generales':              'REV-005',
    'Responsabilidad Civil':  'REV-005',
}
DEFAULT_REVISOR = 'REV-001'


def _get_revisor(db: Session, id_revisor: str) -> Revisor:
    row = db.execute(
        text("SELECT id_revisor, nombre, especialidad, email, casos_activos FROM app.revisores WHERE id_revisor = :id"),
        {"id": id_revisor},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=500, detail=f"Revisor {id_revisor} no encontrado")
    return Revisor(**dict(row))


@router.post("/siniestros/{id_siniestro}/revision", response_model=RevisionResult)
def enviar_a_revision(id_siniestro: str, db: Session = Depends(get_db)):
    sin = db.execute(
        text("SELECT id_siniestro, ramo, estado_revision FROM claims.siniestros WHERE id_siniestro = :id"),
        {"id": id_siniestro},
    ).mappings().first()
    if not sin:
        raise HTTPException(status_code=404, detail="Siniestro no encontrado")
    if sin["estado_revision"] == "En revisión":
        raise HTTPException(status_code=409, detail="El siniestro ya está en revisión humana")

    id_revisor = RAMO_A_REVISOR.get(sin["ramo"] or "", DEFAULT_REVISOR)
    ahora = datetime.now()

    db.execute(
        text("""
            UPDATE claims.siniestros
            SET estado_revision = 'En revisión',
                id_revisor_asignado = :rev,
                fecha_asignacion = :fecha
            WHERE id_siniestro = :id
        """),
        {"rev": id_revisor, "fecha": ahora, "id": id_siniestro},
    )
    db.execute(
        text("UPDATE app.revisores SET casos_activos = casos_activos + 1 WHERE id_revisor = :id"),
        {"id": id_revisor},
    )
    db.commit()

    revisor = _get_revisor(db, id_revisor)
    return RevisionResult(
        id_siniestro=id_siniestro,
        estado_revision="En revisión",
        revisor=revisor,
        fecha_asignacion=ahora,
        mensaje=f"Caso asignado a {revisor.nombre} · {revisor.especialidad}",
    )


@router.get("/revisiones/cola", response_model=list[ColaRevisionItem])
def get_cola_revision(limit: int = 20, db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT
                s.id_siniestro, s.ramo, s.ciudad,
                s.score_final, s.nivel_riesgo,
                s.estado_revision, s.fecha_asignacion,
                s.monto_reclamado,
                r.nombre AS revisor_nombre,
                r.especialidad AS revisor_especialidad
            FROM claims.siniestros s
            JOIN app.revisores r ON r.id_revisor = s.id_revisor_asignado
            WHERE s.estado_revision = 'En revisión'
            ORDER BY s.fecha_asignacion DESC
            LIMIT :limit
        """),
        {"limit": limit},
    ).mappings().all()
    return [ColaRevisionItem(**dict(r)) for r in rows]


@router.get("/revisores", response_model=list[Revisor])
def get_revisores(db: Session = Depends(get_db)):
    rows = db.execute(
        text("SELECT id_revisor, nombre, especialidad, email, casos_activos FROM app.revisores ORDER BY especialidad")
    ).mappings().all()
    return [Revisor(**dict(r)) for r in rows]


@router.patch("/siniestros/{id_siniestro}/revision", response_model=dict)
def resolver_revision(
    id_siniestro: str,
    payload: RevisionAccion,
    db: Session = Depends(get_db),
):
    sin = db.execute(
        text("SELECT id_siniestro, estado_revision, id_revisor_asignado FROM claims.siniestros WHERE id_siniestro = :id"),
        {"id": id_siniestro},
    ).mappings().first()
    if not sin:
        raise HTTPException(status_code=404, detail="Siniestro no encontrado")
    if sin["estado_revision"] not in ("En revisión",):
        raise HTTPException(status_code=409, detail="El siniestro no está en revisión")

    if payload.accion == "aprobar":
        db.execute(
            text("UPDATE claims.siniestros SET estado_revision = 'Aprobado' WHERE id_siniestro = :id"),
            {"id": id_siniestro},
        )
        db.execute(
            text("UPDATE app.revisores SET casos_activos = GREATEST(casos_activos - 1, 0) WHERE id_revisor = :rev"),
            {"rev": sin["id_revisor_asignado"]},
        )
        db.commit()
        return {"mensaje": "Siniestro aprobado", "estado_revision": "Aprobado"}

    elif payload.accion == "rechazar":
        db.execute(
            text("UPDATE claims.siniestros SET estado_revision = 'Rechazado' WHERE id_siniestro = :id"),
            {"id": id_siniestro},
        )
        db.execute(
            text("UPDATE app.revisores SET casos_activos = GREATEST(casos_activos - 1, 0) WHERE id_revisor = :rev"),
            {"rev": sin["id_revisor_asignado"]},
        )
        db.commit()
        return {"mensaje": "Siniestro rechazado", "estado_revision": "Rechazado"}

    elif payload.accion == "reasignar":
        if not payload.id_revisor_nuevo:
            raise HTTPException(status_code=422, detail="id_revisor_nuevo requerido para reasignar")
        rev_nuevo = db.execute(
            text("SELECT id_revisor FROM app.revisores WHERE id_revisor = :id"),
            {"id": payload.id_revisor_nuevo},
        ).first()
        if not rev_nuevo:
            raise HTTPException(status_code=404, detail="Revisor no encontrado")
        db.execute(
            text("UPDATE app.revisores SET casos_activos = GREATEST(casos_activos - 1, 0) WHERE id_revisor = :rev"),
            {"rev": sin["id_revisor_asignado"]},
        )
        db.execute(
            text("""
                UPDATE claims.siniestros
                SET id_revisor_asignado = :nuevo, fecha_asignacion = NOW()
                WHERE id_siniestro = :id
            """),
            {"nuevo": payload.id_revisor_nuevo, "id": id_siniestro},
        )
        db.execute(
            text("UPDATE app.revisores SET casos_activos = casos_activos + 1 WHERE id_revisor = :rev"),
            {"rev": payload.id_revisor_nuevo},
        )
        db.commit()
        return {"mensaje": "Reasignado correctamente", "id_revisor_nuevo": payload.id_revisor_nuevo}

    raise HTTPException(status_code=422, detail="accion debe ser 'aprobar', 'rechazar' o 'reasignar'")


@router.get("/revisiones/kanban", response_model=list[KanbanColumn])
def get_kanban(db: Session = Depends(get_db)):
    revisores = db.execute(
        text("SELECT id_revisor, nombre, especialidad, email, casos_activos FROM app.revisores ORDER BY especialidad")
    ).mappings().all()

    result = []
    for rev in revisores:
        rows = db.execute(
            text("""
                SELECT
                    s.id_siniestro, s.ramo, s.ciudad,
                    s.score_final, s.nivel_riesgo,
                    s.monto_reclamado, s.fecha_asignacion,
                    EXTRACT(DAY FROM NOW() - s.fecha_asignacion)::int AS dias_en_cola
                FROM claims.siniestros s
                WHERE s.id_revisor_asignado = :rev
                  AND s.estado_revision = 'En revisión'
                ORDER BY s.score_final DESC NULLS LAST
            """),
            {"rev": rev["id_revisor"]},
        ).mappings().all()

        cards = [
            KanbanCard(
                id_siniestro=r["id_siniestro"],
                ramo=r["ramo"] or "—",
                ciudad=r["ciudad"],
                score_final=float(r["score_final"]) if r["score_final"] else None,
                nivel_riesgo=r["nivel_riesgo"],
                monto_reclamado=float(r["monto_reclamado"]) if r["monto_reclamado"] else None,
                fecha_asignacion=r["fecha_asignacion"],
                dias_en_cola=r["dias_en_cola"] or 0,
            )
            for r in rows
        ]
        result.append(KanbanColumn(revisor=Revisor(**dict(rev)), casos=cards))
    return result
