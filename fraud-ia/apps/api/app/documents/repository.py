from sqlalchemy import text
from sqlalchemy.orm import Session


def get_critical_documents(db: Session, limit: int = 30) -> list:
    sql = text("""
        SELECT
            d.id_documento, d.id_siniestro, d.tipo_documento,
            d.entregado, d.legible, d.inconsistencia_detectada, d.observacion,
            s.nivel_riesgo, s.score_final, s.ramo, s.ciudad
        FROM claims.documentos d
        JOIN claims.siniestros s ON s.id_siniestro = d.id_siniestro
        WHERE
            s.nivel_riesgo = 'Rojo Alto'
            AND (d.entregado = false OR d.legible = false OR d.inconsistencia_detectada = true)
        ORDER BY s.score_final DESC
        LIMIT :limit
    """)
    rows = db.execute(sql, {"limit": limit}).mappings().all()
    return [dict(r) for r in rows]
