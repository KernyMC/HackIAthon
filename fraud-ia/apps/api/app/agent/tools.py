"""
FraudIA Agent Tools - SQL and RAG tools for the Google ADK agent.
All SQL tools use parameterized queries. No free-form NL-to-SQL.
"""
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..rag.retriever import buscar_conocimiento_negocio as _rag_search

logger = logging.getLogger(__name__)


def _get_db() -> Session:
    from ..core.db import SessionLocal
    return SessionLocal()


def buscar_conocimiento_negocio(query: str, top_k: int = 5) -> dict:
    """
    Busca en la base de conocimiento: reglas de negocio, glosario, ética,
    proceso de revisión y criterios de puntuación de riesgo.
    Usar cuando la pregunta es conceptual, definitoria o sobre políticas.
    """
    db = _get_db()
    try:
        results = _rag_search(db, query, top_k)
        return {
            "tool": "buscar_conocimiento_negocio",
            "query": query,
            "results": results,
            "count": len(results),
        }
    except Exception as e:
        logger.error(f"RAG search error: {e}")
        return {"tool": "buscar_conocimiento_negocio", "error": str(e), "results": []}
    finally:
        db.close()


def listar_siniestros_mayor_riesgo(limit: int = 10) -> dict:
    """
    Devuelve los N siniestros con mayor score_final desde AlloyDB.
    Incluye alertas activadas, nivel de riesgo y acción sugerida.
    """
    db = _get_db()
    try:
        sql = text("""
            SELECT
                s.id_siniestro, s.ramo, s.cobertura, s.ciudad,
                s.monto_reclamado, s.score_reglas, s.score_modelo_simulado,
                s.score_final, s.nivel_riesgo, s.alertas_activadas,
                s.reglas_criticas_activadas, s.accion_sugerida,
                s.dias_desde_inicio_poliza, s.documentos_completos,
                p.nombre_proveedor, p.en_lista_restrictiva
            FROM claims.siniestros s
            LEFT JOIN claims.proveedores p ON p.id_proveedor = s.id_proveedor
            ORDER BY s.score_final DESC NULLS LAST
            LIMIT :limit
        """)
        rows = db.execute(sql, {"limit": limit}).mappings().all()
        return {
            "tool": "listar_siniestros_mayor_riesgo",
            "siniestros": [dict(r) for r in rows],
            "count": len(rows),
        }
    except Exception as e:
        logger.error(f"listar_siniestros_mayor_riesgo error: {e}")
        return {"tool": "listar_siniestros_mayor_riesgo", "error": str(e)}
    finally:
        db.close()


def explicar_siniestro(id_siniestro: str) -> dict:
    """
    Devuelve detalle completo de un siniestro: score, alertas, documentos,
    datos del proveedor y de la póliza.
    """
    db = _get_db()
    try:
        sql = text("""
            SELECT
                s.*,
                p.nombre_proveedor, p.tipo AS tipo_proveedor,
                p.en_lista_restrictiva, p.porcentaje_casos_observados,
                pol.fecha_inicio, pol.fecha_fin, pol.canal_venta,
                pol.estado_poliza, pol.plan_producto
            FROM claims.siniestros s
            LEFT JOIN claims.proveedores p ON p.id_proveedor = s.id_proveedor
            LEFT JOIN claims.polizas pol ON pol.id_poliza = s.id_poliza
            WHERE s.id_siniestro = :id
        """)
        row = db.execute(sql, {"id": id_siniestro}).mappings().one_or_none()
        if not row:
            return {
                "tool": "explicar_siniestro",
                "error": f"Siniestro {id_siniestro} no encontrado",
            }

        docs_sql = text("""
            SELECT tipo_documento, entregado, legible,
                   inconsistencia_detectada, observacion
            FROM claims.documentos
            WHERE id_siniestro = :id
        """)
        docs = db.execute(docs_sql, {"id": id_siniestro}).mappings().all()

        result = dict(row)
        result["documentos"] = [dict(d) for d in docs]
        return {"tool": "explicar_siniestro", "siniestro": result}
    except Exception as e:
        logger.error(f"explicar_siniestro error: {e}")
        return {"tool": "explicar_siniestro", "error": str(e)}
    finally:
        db.close()


def analizar_proveedores_alertas(limit: int = 10) -> dict:
    """
    Devuelve proveedores con mayor concentración de alertas rojas y amarillas.
    Útil para identificar proveedores recurrentes en casos sospechosos.
    """
    db = _get_db()
    try:
        sql = text("""
            SELECT
                vpr.*,
                p.en_lista_restrictiva,
                p.porcentaje_casos_observados,
                p.antiguedad_meses
            FROM claims.v_provider_risk vpr
            LEFT JOIN claims.proveedores p ON p.id_proveedor = vpr.id_proveedor
            ORDER BY vpr.casos_rojos DESC, vpr.score_promedio DESC
            LIMIT :limit
        """)
        rows = db.execute(sql, {"limit": limit}).mappings().all()
        return {
            "tool": "analizar_proveedores_alertas",
            "proveedores": [dict(r) for r in rows],
            "count": len(rows),
        }
    except Exception as e:
        logger.error(f"analizar_proveedores_alertas error: {e}")
        return {"tool": "analizar_proveedores_alertas", "error": str(e)}
    finally:
        db.close()


def listar_documentos_faltantes_casos_criticos(limit: int = 20) -> dict:
    """
    Devuelve documentos faltantes, ilegibles o inconsistentes
    asociados a siniestros de nivel Rojo Alto.
    """
    db = _get_db()
    try:
        sql = text("""
            SELECT
                d.id_documento, d.id_siniestro, d.tipo_documento,
                d.entregado, d.legible, d.inconsistencia_detectada, d.observacion,
                s.nivel_riesgo, s.score_final, s.ramo, s.ciudad, s.accion_sugerida
            FROM claims.documentos d
            JOIN claims.siniestros s ON s.id_siniestro = d.id_siniestro
            WHERE
                s.nivel_riesgo = 'Rojo Alto'
                AND (
                    d.entregado = false
                    OR d.legible = false
                    OR d.inconsistencia_detectada = true
                )
            ORDER BY s.score_final DESC
            LIMIT :limit
        """)
        rows = db.execute(sql, {"limit": limit}).mappings().all()
        return {
            "tool": "listar_documentos_faltantes_casos_criticos",
            "documentos": [dict(r) for r in rows],
            "count": len(rows),
        }
    except Exception as e:
        logger.error(f"listar_documentos_faltantes error: {e}")
        return {"tool": "listar_documentos_faltantes_casos_criticos", "error": str(e)}
    finally:
        db.close()


def listar_casos_cerca_inicio_poliza(limit: int = 20) -> dict:
    """
    Devuelve siniestros ocurridos dentro de los primeros 90 días
    desde el inicio de la póliza — señal de posible riesgo moral.
    """
    db = _get_db()
    try:
        sql = text("""
            SELECT
                s.id_siniestro, s.ramo, s.cobertura, s.ciudad,
                s.dias_desde_inicio_poliza, s.monto_reclamado,
                s.score_final, s.nivel_riesgo, s.alertas_activadas,
                s.accion_sugerida, p.nombre_proveedor
            FROM claims.siniestros s
            LEFT JOIN claims.proveedores p ON p.id_proveedor = s.id_proveedor
            WHERE s.dias_desde_inicio_poliza BETWEEN 0 AND 90
            ORDER BY s.dias_desde_inicio_poliza ASC, s.score_final DESC
            LIMIT :limit
        """)
        rows = db.execute(sql, {"limit": limit}).mappings().all()
        return {
            "tool": "listar_casos_cerca_inicio_poliza",
            "siniestros": [dict(r) for r in rows],
            "count": len(rows),
            "nota": "Siniestros dentro de los primeros 90 días desde inicio de póliza",
        }
    except Exception as e:
        logger.error(f"listar_casos_cerca_inicio_poliza error: {e}")
        return {"tool": "listar_casos_cerca_inicio_poliza", "error": str(e)}
    finally:
        db.close()


def listar_narrativas_similares(threshold: float = 0.22, limit: int = 15) -> dict:
    """
    Devuelve pares de siniestros con narrativas similares detectadas por TF-IDF coseno.
    Activa la regla RF-07 (Narrativa Clonada). Útil para detectar fraude coordinado,
    anillos de fraude o talleres cómplices que presentan relatos repetitivos.
    """
    db = _get_db()
    try:
        pares_sql = text("""
            SELECT
                n.id_par, n.id_siniestro_a, n.id_siniestro_b,
                n.cluster_narrativa,
                n.similitud_coseno_simulada AS similitud,
                n.descripcion_a, n.descripcion_b,
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
                ROUND(AVG(similitud_coseno_simulada)::numeric, 3) AS similitud_promedio,
                COUNT(DISTINCT id_siniestro_a) + COUNT(DISTINCT id_siniestro_b) AS casos_aprox
            FROM claims.narrativas_similares
            WHERE similitud_coseno_simulada >= :threshold AND metodo = 'tfidf_cosine'
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

        return {
            "tool": "listar_narrativas_similares",
            "resumen": {
                "total_clusters": len(clusters),
                "total_pares": int(total_pares),
                "casos_involucrados": int(casos_involucrados),
            },
            "clusters": clusters,
            "pares_top": pares[:10],
        }
    except Exception as e:
        logger.error(f"listar_narrativas_similares error: {e}")
        return {"tool": "listar_narrativas_similares", "error": str(e)}
    finally:
        db.close()


def generar_resumen_ejecutivo() -> dict:
    """
    Devuelve KPIs, hallazgos principales y recomendaciones para jefatura.
    Combina estadísticas SQL con contexto de negocio.
    """
    db = _get_db()
    try:
        kpis = db.execute(text("SELECT * FROM claims.v_kpis")).mappings().one()

        top_providers = db.execute(text("""
            SELECT nombre_proveedor, casos_rojos, score_promedio, monto_total_reclamado
            FROM claims.v_provider_risk
            ORDER BY casos_rojos DESC
            LIMIT 5
        """)).mappings().all()

        top_sin = db.execute(text("""
            SELECT id_siniestro, ramo, ciudad, score_final, nivel_riesgo, accion_sugerida
            FROM claims.siniestros
            ORDER BY score_final DESC
            LIMIT 5
        """)).mappings().all()

        sin_sin_docs = db.execute(text("""
            SELECT COUNT(*) FROM claims.siniestros
            WHERE documentos_completos = false AND nivel_riesgo = 'Rojo Alto'
        """)).scalar()

        sin_inicio = db.execute(text("""
            SELECT COUNT(*) FROM claims.siniestros
            WHERE dias_desde_inicio_poliza <= 30 AND nivel_riesgo IN ('Rojo Alto','Amarillo Medio')
        """)).scalar()

        return {
            "tool": "generar_resumen_ejecutivo",
            "kpis": dict(kpis),
            "top_proveedores_riesgo": [dict(r) for r in top_providers],
            "top_siniestros_score": [dict(r) for r in top_sin],
            "hallazgos": {
                "casos_rojos_sin_documentos_completos": sin_sin_docs,
                "casos_altos_cerca_inicio_poliza": sin_inicio,
            },
            "recomendaciones": [
                "Priorizar revisión de los 10 casos con mayor score_final.",
                "Investigar proveedores con más de 3 casos rojos.",
                "Completar documentación faltante en casos rojos antes de liquidar.",
                "Revisar siniestros ocurridos en los primeros 30 días de vigencia.",
                "Aplicar criterio humano — el sistema genera alertas, no decisiones.",
            ],
        }
    except Exception as e:
        logger.error(f"generar_resumen_ejecutivo error: {e}")
        return {"tool": "generar_resumen_ejecutivo", "error": str(e)}
    finally:
        db.close()
