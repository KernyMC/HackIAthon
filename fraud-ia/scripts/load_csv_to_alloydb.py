#!/usr/bin/env python3
"""
Load synthetic CSV data into AlloyDB claims.* tables.
Handles column mapping, boolean normalization, and JSONB conversion.
Idempotent: uses INSERT ... ON CONFLICT DO UPDATE.
"""
import os
import sys
import json
import logging
from pathlib import Path
from urllib.parse import quote_plus
import pandas as pd
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).parent.parent
DATA_DIR = REPO_ROOT / "data" / "synthetic"

BOOL_MAP = {"Si": True, "No": False, "si": True, "no": False,
            "True": True, "False": False, "1": True, "0": False,
            True: True, False: False,
            "No aplica": None, "no aplica": None, "N/A": None, "n/a": None}


def get_engine():
    host = os.environ.get("ALLOYDB_HOST", "localhost")
    port = os.environ.get("ALLOYDB_PORT", "5432")
    db = os.environ.get("ALLOYDB_DATABASE", "fraudia")
    user = os.environ.get("ALLOYDB_USER", "loader_user")
    password = os.environ.get("ALLOYDB_PASSWORD", "")
    url = f"postgresql+psycopg://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/{db}"
    return create_engine(url, pool_pre_ping=True)


def norm_bool(val):
    if pd.isna(val):
        return None
    return BOOL_MAP.get(val, None)


def norm_json(val):
    if pd.isna(val) if not isinstance(val, (list, dict)) else False:
        return "[]"
    if isinstance(val, (list, dict)):
        return json.dumps(val, ensure_ascii=False)
    s = str(val).strip()
    if not s or s in ("nan", "None", ""):
        return "[]"
    if s.startswith("[") or s.startswith("{"):
        try:
            json.loads(s)
            return s
        except Exception:
            pass
    # pipe-separated values
    if "|" in s:
        parts = [p.strip() for p in s.split("|") if p.strip()]
        return json.dumps(parts, ensure_ascii=False)
    return json.dumps([s], ensure_ascii=False)


def maybe_float(val):
    try:
        if pd.isna(val):
            return None
    except Exception:
        pass
    try:
        return float(val)
    except Exception:
        return None


def maybe_int(val):
    try:
        if pd.isna(val):
            return None
    except Exception:
        pass
    try:
        return int(float(val))
    except Exception:
        return None


def load_siniestros(engine):
    path = DATA_DIR / "siniestros_scored.csv"
    df = pd.read_csv(path)
    logger.info(f"Loading siniestros: {len(df)} rows")

    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(text("""
                INSERT INTO claims.siniestros (
                    id_siniestro, id_poliza, id_asegurado, id_vehiculo,
                    id_conductor, id_proveedor, ramo, cobertura, ciudad, sucursal, estado,
                    fecha_ocurrencia, fecha_reporte, monto_reclamado, monto_estimado,
                    monto_pagado, suma_asegurada, descripcion, documentos_completos,
                    beneficiario, dias_desde_inicio_poliza, dias_desde_fin_poliza,
                    dias_entre_ocurrencia_reporte, historial_siniestros_asegurado,
                    historial_siniestros_vehiculo, historial_siniestros_conductor,
                    historial_solo_rc_asegurado, tipo_impacto, hora_evento,
                    tercero_identificado, evidencia_camaras, tipo_via, clima,
                    documento_inconsistente, relato_ilogico, narrativa_cluster_id,
                    similitud_narrativa_max, etiqueta_fraude_simulada,
                    perfil_riesgo_generacion, deducible, canal_venta,
                    proveedor_en_lista_restrictiva, proveedor_casos_observados_ultimo_anio,
                    ratio_monto_suma_asegurada, score_reglas, score_modelo_simulado,
                    score_final, nivel_riesgo, alertas_activadas,
                    reglas_criticas_activadas, accion_sugerida
                ) VALUES (
                    :id_siniestro, :id_poliza, :id_asegurado, :id_vehiculo,
                    :id_conductor, :id_proveedor, :ramo, :cobertura, :ciudad,
                    :sucursal, :estado, :fecha_ocurrencia, :fecha_reporte,
                    :monto_reclamado, :monto_estimado, :monto_pagado, :suma_asegurada,
                    :descripcion, :documentos_completos, :beneficiario,
                    :dias_desde_inicio_poliza, :dias_desde_fin_poliza,
                    :dias_entre_ocurrencia_reporte, :historial_siniestros_asegurado,
                    :historial_siniestros_vehiculo, :historial_siniestros_conductor,
                    :historial_solo_rc_asegurado, :tipo_impacto, :hora_evento,
                    :tercero_identificado, :evidencia_camaras, :tipo_via, :clima,
                    :documento_inconsistente, :relato_ilogico, :narrativa_cluster_id,
                    :similitud_narrativa_max, :etiqueta_fraude_simulada,
                    :perfil_riesgo_generacion, :deducible, :canal_venta,
                    :proveedor_en_lista_restrictiva, :proveedor_casos_observados_ultimo_anio,
                    :ratio_monto_suma_asegurada, :score_reglas, :score_modelo_simulado,
                    :score_final, :nivel_riesgo, CAST(:alertas AS jsonb),
                    CAST(:reglas AS jsonb), :accion_sugerida
                )
                ON CONFLICT (id_siniestro) DO UPDATE SET
                    score_final = EXCLUDED.score_final,
                    nivel_riesgo = EXCLUDED.nivel_riesgo,
                    alertas_activadas = EXCLUDED.alertas_activadas,
                    reglas_criticas_activadas = EXCLUDED.reglas_criticas_activadas,
                    accion_sugerida = EXCLUDED.accion_sugerida
            """), {
                "id_siniestro": row.get("id_siniestro"),
                "id_poliza": row.get("id_poliza") or None,
                "id_asegurado": row.get("id_asegurado") or None,
                "id_vehiculo": row.get("id_vehiculo") or None,
                "id_conductor": row.get("id_conductor") or None,
                "id_proveedor": row.get("id_proveedor") or None,
                "ramo": row.get("ramo"),
                "cobertura": row.get("cobertura"),
                "ciudad": row.get("ciudad"),
                "sucursal": row.get("sucursal"),
                "estado": row.get("estado"),
                "fecha_ocurrencia": row.get("fecha_ocurrencia") or None,
                "fecha_reporte": row.get("fecha_reporte") or None,
                "monto_reclamado": maybe_float(row.get("monto_reclamado")),
                "monto_estimado": maybe_float(row.get("monto_estimado")),
                "monto_pagado": maybe_float(row.get("monto_pagado")),
                "suma_asegurada": maybe_float(row.get("suma_asegurada")),
                "descripcion": row.get("descripcion"),
                "documentos_completos": norm_bool(row.get("documentos_completos")),
                "beneficiario": row.get("beneficiario") or None,
                "dias_desde_inicio_poliza": maybe_int(row.get("dias_desde_inicio_poliza")),
                "dias_desde_fin_poliza": maybe_int(row.get("dias_desde_fin_poliza")),
                "dias_entre_ocurrencia_reporte": maybe_int(row.get("dias_entre_ocurrencia_reporte")),
                "historial_siniestros_asegurado": maybe_int(row.get("historial_siniestros_asegurado")),
                "historial_siniestros_vehiculo": maybe_int(row.get("historial_siniestros_vehiculo")),
                "historial_siniestros_conductor": maybe_int(row.get("historial_siniestros_conductor")),
                "historial_solo_rc_asegurado": maybe_int(row.get("historial_solo_rc_asegurado")),
                "tipo_impacto": row.get("tipo_impacto") or None,
                "hora_evento": maybe_int(row.get("hora_evento")),
                "tercero_identificado": norm_bool(row.get("tercero_identificado")),
                "evidencia_camaras": norm_bool(row.get("evidencia_camaras")),
                "tipo_via": row.get("tipo_via") or None,
                "clima": row.get("clima") or None,
                "documento_inconsistente": norm_bool(row.get("documento_inconsistente")),
                "relato_ilogico": norm_bool(row.get("relato_ilogico")),
                "narrativa_cluster_id": maybe_int(row.get("narrativa_cluster_id")),
                "similitud_narrativa_max": maybe_float(row.get("similitud_narrativa_max")),
                "etiqueta_fraude_simulada": maybe_int(row.get("etiqueta_fraude_simulada")),
                "perfil_riesgo_generacion": row.get("perfil_riesgo_generacion") or None,
                "deducible": maybe_float(row.get("deducible")),
                "canal_venta": row.get("canal_venta") or None,
                "proveedor_en_lista_restrictiva": norm_bool(row.get("proveedor_en_lista_restrictiva")),
                "proveedor_casos_observados_ultimo_anio": maybe_int(row.get("proveedor_casos_observados_ultimo_anio")),
                "ratio_monto_suma_asegurada": maybe_float(row.get("ratio_monto_suma_asegurada")),
                "score_reglas": maybe_float(row.get("score_reglas")),
                "score_modelo_simulado": maybe_float(row.get("score_modelo_simulado")),
                "score_final": maybe_float(row.get("score_final")),
                "nivel_riesgo": row.get("nivel_riesgo"),
                "alertas": norm_json(row.get("alertas_activadas")),
                "reglas": norm_json(row.get("reglas_criticas_activadas")),
                "accion_sugerida": row.get("accion_sugerida"),
            })
    logger.info("Siniestros loaded.")


def load_polizas(engine):
    df = pd.read_csv(DATA_DIR / "polizas.csv")
    logger.info(f"Loading polizas: {len(df)} rows")
    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(text("""
                INSERT INTO claims.polizas
                    (id_poliza, id_asegurado, id_vehiculo, ramo, fecha_inicio, fecha_fin,
                     prima, suma_asegurada, deducible, canal_venta, ciudad, estado_poliza, plan_producto)
                VALUES
                    (:id_poliza, :id_asegurado, :id_vehiculo, :ramo, :fecha_inicio, :fecha_fin,
                     :prima, :suma_asegurada, :deducible, :canal_venta, :ciudad, :estado_poliza, :plan_producto)
                ON CONFLICT (id_poliza) DO UPDATE SET estado_poliza = EXCLUDED.estado_poliza
            """), {
                "id_poliza": row.get("id_poliza"),
                "id_asegurado": row.get("id_asegurado") or None,
                "id_vehiculo": row.get("id_vehiculo") or None,
                "ramo": row.get("ramo"),
                "fecha_inicio": row.get("fecha_inicio") or None,
                "fecha_fin": row.get("fecha_fin") or None,
                "prima": maybe_float(row.get("prima")),
                "suma_asegurada": maybe_float(row.get("suma_asegurada")),
                "deducible": maybe_float(row.get("deducible")),
                "canal_venta": row.get("canal_venta") or None,
                "ciudad": row.get("ciudad") or None,
                "estado_poliza": row.get("estado_poliza") or None,
                "plan_producto": row.get("plan_producto") or None,
            })
    logger.info("Polizas loaded.")


def load_asegurados(engine):
    df = pd.read_csv(DATA_DIR / "asegurados.csv")
    logger.info(f"Loading asegurados: {len(df)} rows")
    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(text("""
                INSERT INTO claims.asegurados
                    (id_asegurado, segmento, antiguedad_meses, ciudad,
                     numero_polizas, reclamos_ultimos_12_meses, mora_actual, score_cliente_simulado)
                VALUES
                    (:id_asegurado, :segmento, :antiguedad_meses, :ciudad,
                     :numero_polizas, :reclamos, :mora, :score)
                ON CONFLICT (id_asegurado) DO NOTHING
            """), {
                "id_asegurado": row.get("id_asegurado"),
                "segmento": row.get("segmento"),
                "antiguedad_meses": maybe_int(row.get("antiguedad_meses")),
                "ciudad": row.get("ciudad"),
                "numero_polizas": maybe_int(row.get("numero_polizas")),
                "reclamos": maybe_int(row.get("reclamos_ultimos_12_meses")),
                "mora": norm_bool(row.get("mora_actual")),
                "score": maybe_float(row.get("score_cliente_simulado")),
            })
    logger.info("Asegurados loaded.")


def load_vehiculos(engine):
    df = pd.read_csv(DATA_DIR / "vehiculos.csv")
    logger.info(f"Loading vehiculos: {len(df)} rows")
    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(text("""
                INSERT INTO claims.vehiculos
                    (id_vehiculo, placa_hash, marca, modelo, anio,
                     chasis_hash, motor_hash, ciudad, uso)
                VALUES
                    (:id_vehiculo, :placa_hash, :marca, :modelo, :anio,
                     :chasis_hash, :motor_hash, :ciudad, :uso)
                ON CONFLICT (id_vehiculo) DO NOTHING
            """), {
                "id_vehiculo": row.get("id_vehiculo"),
                "placa_hash": row.get("placa_hash"),
                "marca": row.get("marca"),
                "modelo": row.get("modelo"),
                "anio": maybe_int(row.get("anio")),
                "chasis_hash": row.get("chasis_hash"),
                "motor_hash": row.get("motor_hash"),
                "ciudad": row.get("ciudad"),
                "uso": row.get("uso") or None,
            })
    logger.info("Vehiculos loaded.")


def load_conductores(engine):
    df = pd.read_csv(DATA_DIR / "conductores.csv")
    logger.info(f"Loading conductores: {len(df)} rows")
    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(text("""
                INSERT INTO claims.conductores
                    (id_conductor, rango_edad, antiguedad_licencia_anios,
                     ciudad, relacion_asegurado)
                VALUES
                    (:id_conductor, :rango_edad, :antiguedad_licencia_anios,
                     :ciudad, :relacion_asegurado)
                ON CONFLICT (id_conductor) DO NOTHING
            """), {
                "id_conductor": row.get("id_conductor"),
                "rango_edad": row.get("rango_edad") or None,
                "antiguedad_licencia_anios": maybe_int(row.get("antiguedad_licencia_anios")),
                "ciudad": row.get("ciudad"),
                "relacion_asegurado": row.get("relacion_asegurado") or None,
            })
    logger.info("Conductores loaded.")


def load_proveedores(engine):
    df = pd.read_csv(DATA_DIR / "proveedores.csv")
    logger.info(f"Loading proveedores: {len(df)} rows")
    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(text("""
                INSERT INTO claims.proveedores
                    (id_proveedor, nombre_proveedor, tipo, ciudad,
                     reclamos_asociados, monto_promedio_reclamado,
                     porcentaje_casos_observados, en_lista_restrictiva,
                     casos_observados_ultimo_anio, antiguedad_meses)
                VALUES
                    (:id_proveedor, :nombre_proveedor, :tipo, :ciudad,
                     :reclamos_asociados, :monto_promedio,
                     :porcentaje, :en_lista, :casos_ultimo_anio, :antiguedad)
                ON CONFLICT (id_proveedor) DO UPDATE SET
                    porcentaje_casos_observados = EXCLUDED.porcentaje_casos_observados,
                    en_lista_restrictiva = EXCLUDED.en_lista_restrictiva
            """), {
                "id_proveedor": row.get("id_proveedor"),
                "nombre_proveedor": row.get("nombre_proveedor"),
                "tipo": row.get("tipo"),
                "ciudad": row.get("ciudad"),
                "reclamos_asociados": maybe_int(row.get("reclamos_asociados")),
                "monto_promedio": maybe_float(row.get("monto_promedio_reclamado")),
                "porcentaje": maybe_float(row.get("porcentaje_casos_observados")),
                "en_lista": norm_bool(row.get("en_lista_restrictiva")),
                "casos_ultimo_anio": maybe_int(row.get("casos_observados_ultimo_anio")),
                "antiguedad": maybe_int(row.get("antiguedad_meses")),
            })
    logger.info("Proveedores loaded.")


def load_documentos(engine):
    df = pd.read_csv(DATA_DIR / "documentos.csv")
    logger.info(f"Loading documentos: {len(df)} rows")
    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(text("""
                INSERT INTO claims.documentos
                    (id_documento, id_siniestro, tipo_documento,
                     entregado, legible, fecha_emision,
                     inconsistencia_detectada, observacion)
                VALUES
                    (:id_documento, :id_siniestro, :tipo_documento,
                     :entregado, :legible, :fecha_emision,
                     :inconsistencia, :observacion)
                ON CONFLICT (id_documento) DO UPDATE SET
                    inconsistencia_detectada = EXCLUDED.inconsistencia_detectada
            """), {
                "id_documento": row.get("id_documento"),
                "id_siniestro": row.get("id_siniestro"),
                "tipo_documento": row.get("tipo_documento"),
                "entregado": norm_bool(row.get("entregado")),
                "legible": norm_bool(row.get("legible")),
                "fecha_emision": None if pd.isna(row.get("fecha_emision")) else row.get("fecha_emision"),
                "inconsistencia": norm_bool(row.get("inconsistencia_detectada")),
                "observacion": row.get("observacion") or None,
            })
    logger.info("Documentos loaded.")


def load_narrativas(engine):
    df = pd.read_csv(DATA_DIR / "narrativas_similares.csv")
    logger.info(f"Loading narrativas: {len(df)} rows")
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE claims.narrativas_similares"))
        for _, row in df.iterrows():
            conn.execute(text("""
                INSERT INTO claims.narrativas_similares
                    (id_siniestro_a, id_siniestro_b, cluster_narrativa,
                     similitud_coseno_simulada, descripcion_a, descripcion_b)
                VALUES
                    (:sin_a, :sin_b, :cluster, :similitud, :desc_a, :desc_b)
            """), {
                "sin_a": row.get("id_siniestro_a"),
                "sin_b": row.get("id_siniestro_b"),
                "cluster": row.get("cluster_narrativa") or None,
                "similitud": maybe_float(row.get("similitud_coseno_simulada")),
                "desc_a": row.get("descripcion_a") or None,
                "desc_b": row.get("descripcion_b") or None,
            })
    logger.info("Narrativas loaded.")


def validate_counts(engine):
    from sqlalchemy import text as t
    with engine.connect() as conn:
        for table in ["siniestros", "polizas", "asegurados", "vehiculos",
                      "conductores", "proveedores", "documentos"]:
            count = conn.execute(t(f"SELECT COUNT(*) FROM claims.{table}")).scalar()
            logger.info(f"  claims.{table}: {count} rows")


def main():
    logger.info("=== FraudIA CSV Loader ===")

    # Check GCS if bucket set
    gcs_bucket = os.environ.get("GCS_BUCKET", "")
    if gcs_bucket:
        logger.info(f"GCS bucket detected: {gcs_bucket}. Downloading CSVs...")
        _download_from_gcs(gcs_bucket)

    engine = get_engine()
    load_proveedores(engine)
    load_asegurados(engine)
    load_vehiculos(engine)
    load_conductores(engine)
    load_polizas(engine)
    load_siniestros(engine)
    load_documentos(engine)
    load_narrativas(engine)
    validate_counts(engine)
    engine.dispose()
    logger.info("=== Load completed ===")


def _download_from_gcs(bucket: str):
    try:
        from google.cloud import storage
        client = storage.Client()
        bucket_obj = client.bucket(bucket)
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        for blob in client.list_blobs(bucket, prefix="data/synthetic/"):
            if blob.name.endswith(".csv"):
                dest = DATA_DIR / Path(blob.name).name
                blob.download_to_filename(str(dest))
                logger.info(f"  Downloaded: {dest.name}")
    except Exception as e:
        logger.warning(f"GCS download failed: {e}. Using local files.")


if __name__ == "__main__":
    main()
