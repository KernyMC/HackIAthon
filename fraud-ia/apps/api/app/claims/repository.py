from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Optional


def get_kpis(db: Session) -> dict:
    row = db.execute(text("SELECT * FROM claims.v_kpis")).mappings().one()
    return dict(row)


def list_siniestros(
    db: Session,
    nivel_riesgo: Optional[str] = None,
    ramo: Optional[str] = None,
    search: Optional[str] = None,
    score_min: Optional[float] = None,
    estado_revision: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    conditions = []
    params: dict = {"limit": limit, "offset": offset}

    if nivel_riesgo:
        conditions.append("s.nivel_riesgo = :nivel_riesgo")
        params["nivel_riesgo"] = nivel_riesgo
    if ramo:
        conditions.append("s.ramo = :ramo")
        params["ramo"] = ramo
    if score_min is not None:
        conditions.append("s.score_final >= :score_min")
        params["score_min"] = score_min
    if search:
        conditions.append(
            "(s.id_siniestro ILIKE :search OR s.descripcion ILIKE :search "
            "OR s.ciudad ILIKE :search OR p.nombre_proveedor ILIKE :search)"
        )
        params["search"] = f"%{search}%"
    if estado_revision:
        conditions.append("s.estado_revision = :estado_revision")
        params["estado_revision"] = estado_revision

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    count_sql = f"""
        SELECT COUNT(*)
        FROM claims.siniestros s
        LEFT JOIN claims.proveedores p ON p.id_proveedor = s.id_proveedor
        {where}
    """
    total = db.execute(text(count_sql), params).scalar()

    data_sql = f"""
        SELECT
            s.id_siniestro, s.id_poliza, s.id_asegurado, s.id_proveedor,
            s.ramo, s.cobertura, s.ciudad, s.sucursal, s.estado,
            s.fecha_ocurrencia, s.fecha_reporte,
            s.monto_reclamado, s.monto_estimado, s.monto_pagado, s.suma_asegurada,
            s.score_reglas, s.score_modelo_simulado, s.score_final, s.nivel_riesgo,
            s.alertas_activadas, s.reglas_criticas_activadas, s.accion_sugerida,
            s.documentos_completos, s.dias_desde_inicio_poliza,
            s.etiqueta_fraude_simulada, s.estado_revision,
            p.nombre_proveedor
        FROM claims.siniestros s
        LEFT JOIN claims.proveedores p ON p.id_proveedor = s.id_proveedor
        {where}
        ORDER BY s.score_final DESC NULLS LAST
        LIMIT :limit OFFSET :offset
    """
    rows = db.execute(text(data_sql), params).mappings().all()
    return {"items": [dict(r) for r in rows], "total": total or 0}


def get_narrativas_similares(db: Session, threshold: float = 0.22, limit: int = 20) -> dict:
    pares_sql = text("""
        SELECT
            n.id_par,
            n.id_siniestro_a,
            n.id_siniestro_b,
            n.cluster_narrativa,
            n.similitud_coseno_simulada AS similitud,
            n.descripcion_a,
            n.descripcion_b,
            p.nombre_proveedor
        FROM claims.narrativas_similares n
        LEFT JOIN claims.siniestros s ON s.id_siniestro = n.id_siniestro_a
        LEFT JOIN claims.proveedores p ON p.id_proveedor = s.id_proveedor
        WHERE n.similitud_coseno_simulada >= :threshold
          AND n.metodo = 'tfidf_cosine'
        ORDER BY n.similitud_coseno_simulada DESC
        LIMIT :limit
    """)
    pares = [dict(r) for r in db.execute(pares_sql, {"threshold": threshold, "limit": limit}).mappings()]

    clusters_sql = text("""
        SELECT
            cluster_narrativa,
            COUNT(*) AS total_pares,
            ROUND(AVG(similitud_coseno_simulada)::numeric, 4) AS similitud_promedio,
            COUNT(DISTINCT id_siniestro_a) + COUNT(DISTINCT id_siniestro_b) AS casos_aprox
        FROM claims.narrativas_similares
        WHERE similitud_coseno_simulada >= :threshold
          AND cluster_narrativa IS NOT NULL
          AND metodo = 'tfidf_cosine'
        GROUP BY cluster_narrativa
        ORDER BY AVG(similitud_coseno_simulada) DESC
    """)
    clusters = [dict(r) for r in db.execute(clusters_sql, {"threshold": threshold}).mappings()]

    total_pares = db.execute(
        text("SELECT COUNT(*) FROM claims.narrativas_similares WHERE similitud_coseno_simulada >= :t AND metodo = 'tfidf_cosine'"),
        {"t": threshold}
    ).scalar() or 0

    casos_involucrados = db.execute(text("""
        SELECT COUNT(DISTINCT sin_id) FROM (
            SELECT id_siniestro_a AS sin_id FROM claims.narrativas_similares WHERE similitud_coseno_simulada >= :t AND metodo = 'tfidf_cosine'
            UNION
            SELECT id_siniestro_b AS sin_id FROM claims.narrativas_similares WHERE similitud_coseno_simulada >= :t AND metodo = 'tfidf_cosine'
        ) u
    """), {"t": threshold}).scalar() or 0

    avg_sim = db.execute(
        text("SELECT AVG(similitud_coseno_simulada) FROM claims.narrativas_similares WHERE similitud_coseno_simulada >= :t AND metodo = 'tfidf_cosine'"),
        {"t": threshold}
    ).scalar() or 0

    return {
        "resumen": {
            "total_clusters": len(clusters),
            "total_pares": int(total_pares),
            "casos_involucrados": int(casos_involucrados),
            "similitud_promedio": round(float(avg_sim), 4),
        },
        "clusters": clusters,
        "pares": pares,
    }


def get_siniestro_detail(db: Session, id_siniestro: str) -> Optional[dict]:
    sql = text("""
        SELECT
            s.*,
            p.nombre_proveedor, p.tipo AS tipo_proveedor, p.en_lista_restrictiva,
            p.porcentaje_casos_observados,
            pol.fecha_inicio, pol.fecha_fin, pol.canal_venta, pol.estado_poliza,
            pol.plan_producto
        FROM claims.siniestros s
        LEFT JOIN claims.proveedores p ON p.id_proveedor = s.id_proveedor
        LEFT JOIN claims.polizas pol ON pol.id_poliza = s.id_poliza
        WHERE s.id_siniestro = :id
    """)
    row = db.execute(sql, {"id": id_siniestro}).mappings().one_or_none()
    if not row:
        return None
    result = dict(row)

    docs_sql = text("""
        SELECT * FROM claims.documentos WHERE id_siniestro = :id
    """)
    docs = db.execute(docs_sql, {"id": id_siniestro}).mappings().all()
    result["documentos"] = [dict(d) for d in docs]
    return result
