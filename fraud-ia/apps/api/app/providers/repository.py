from sqlalchemy import text
from sqlalchemy.orm import Session


def get_provider_risk(db: Session, limit: int = 10) -> list:
    sql = text("""
        SELECT
            vpr.*,
            p.en_lista_restrictiva,
            p.porcentaje_casos_observados,
            p.antiguedad_meses
        FROM claims.v_provider_risk vpr
        LEFT JOIN claims.proveedores p ON p.id_proveedor = vpr.id_proveedor
        WHERE vpr.id_proveedor IS NOT NULL
        ORDER BY vpr.casos_rojos DESC, vpr.score_promedio DESC
        LIMIT :limit
    """)
    rows = db.execute(sql, {"limit": limit}).mappings().all()
    return [dict(r) for r in rows]
