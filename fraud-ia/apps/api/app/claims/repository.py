from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Optional
import time

# Simple in-memory TTL cache — avoids hitting AlloyDB on every dashboard render
_cache: dict = {}
_CACHE_TTL = 60  # seconds


def _cached(key: str, ttl: int, fn):
    now = time.monotonic()
    entry = _cache.get(key)
    if entry and now - entry["ts"] < ttl:
        return entry["val"]
    val = fn()
    _cache[key] = {"val": val, "ts": now}
    return val


def get_kpis(db: Session) -> dict:
    return _cached("kpis", _CACHE_TTL, lambda: dict(
        db.execute(text("SELECT * FROM claims.v_kpis")).mappings().one()
    ))


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


def _parse_alerta(raw: str) -> tuple[str, str]:
    """Split 'RF-01: texto descriptivo' into (codigo, descripcion).
    Falls back to (raw, raw) when the format doesn't match."""
    if ": " in raw:
        parts = raw.split(": ", 1)
        return parts[0].strip(), parts[1].strip()
    return raw.strip(), raw.strip()


def get_alertas_analytics(db: Session) -> dict:
    rows = db.execute(text("""
        SELECT
            alerta,
            COUNT(*) AS frecuencia
        FROM claims.siniestros,
             jsonb_array_elements_text(alertas_activadas) AS alerta
        WHERE alertas_activadas IS NOT NULL
          AND alertas_activadas != 'null'::jsonb
        GROUP BY alerta
        ORDER BY frecuencia DESC
        LIMIT 20
    """)).mappings().all()

    items = []
    total_alertas = 0
    for r in rows:
        codigo, descripcion = _parse_alerta(r["alerta"])
        freq = int(r["frecuencia"])
        total_alertas += freq
        items.append({"codigo": codigo, "descripcion": descripcion, "frecuencia": freq})

    casos_con_alertas = db.execute(text("""
        SELECT COUNT(*) FROM claims.siniestros
        WHERE alertas_activadas IS NOT NULL
          AND alertas_activadas != 'null'::jsonb
          AND jsonb_array_length(alertas_activadas) > 0
    """)).scalar() or 0

    return {
        "total_alertas": total_alertas,
        "reglas_activadas": len(items),
        "casos_con_alertas": int(casos_con_alertas),
        "items": items,
    }


def get_resumen_ejecutivo(db: Session) -> dict:
    # KPIs base
    kpis_row = db.execute(text("SELECT * FROM claims.v_kpis")).mappings().one()
    kpis = dict(kpis_row)

    # Top 5 reglas más frecuentes
    alerta_rows = db.execute(text("""
        SELECT
            alerta,
            COUNT(*) AS frecuencia
        FROM claims.siniestros,
             jsonb_array_elements_text(alertas_activadas) AS alerta
        WHERE alertas_activadas IS NOT NULL
          AND alertas_activadas != 'null'::jsonb
        GROUP BY alerta
        ORDER BY frecuencia DESC
        LIMIT 5
    """)).mappings().all()

    top_reglas = []
    for r in alerta_rows:
        codigo, descripcion = _parse_alerta(r["alerta"])
        top_reglas.append({"codigo": codigo, "descripcion": descripcion, "frecuencia": int(r["frecuencia"])})

    # Top ramos
    ramo_rows = db.execute(text("""
        SELECT
            ramo,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE nivel_riesgo = 'Rojo Alto') AS rojos,
            COUNT(*) FILTER (WHERE nivel_riesgo = 'Amarillo Medio') AS amarillos
        FROM claims.siniestros
        GROUP BY ramo
        ORDER BY total DESC
        LIMIT 8
    """)).mappings().all()

    top_ramos = [
        {
            "ramo": r["ramo"],
            "total": int(r["total"]),
            "rojos": int(r["rojos"]),
            "amarillos": int(r["amarillos"]),
        }
        for r in ramo_rows
    ]

    # Últimos 30 días
    sin_30 = db.execute(text("""
        SELECT COUNT(*) FROM claims.siniestros
        WHERE fecha_reporte >= NOW() - INTERVAL '30 days'
    """)).scalar() or 0

    rojos_30 = db.execute(text("""
        SELECT COUNT(*) FROM claims.siniestros
        WHERE fecha_reporte >= NOW() - INTERVAL '30 days'
          AND nivel_riesgo = 'Rojo Alto'
    """)).scalar() or 0

    return {
        "total_siniestros": kpis.get("total_siniestros", 0),
        "casos_rojos": kpis.get("casos_rojos", 0),
        "casos_amarillos": kpis.get("casos_amarillos", 0),
        "casos_verdes": kpis.get("casos_verdes", 0),
        "monto_total_reclamado": float(kpis.get("monto_total_reclamado") or 0),
        "monto_en_riesgo": float(kpis.get("monto_rojo_reclamado") or 0),
        "score_promedio": float(kpis.get("score_promedio") or 0),
        "top_reglas": top_reglas,
        "top_ramos": top_ramos,
        "siniestros_ultimos_30_dias": int(sin_30),
        "casos_rojos_ultimos_30_dias": int(rojos_30),
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
