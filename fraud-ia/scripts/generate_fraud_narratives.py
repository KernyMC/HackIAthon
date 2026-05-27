#!/usr/bin/env python3
"""
Genera siniestros fraudulentos con descripciones similares usando Gemini (o templates),
los inserta en la BD, y calcula similitud TF-IDF para poblar claims.narrativas_similares.

Uso:
    python scripts/generate_fraud_narratives.py

Requiere:
    ALLOYDB_HOST, ALLOYDB_PORT, ALLOYDB_DATABASE, ALLOYDB_USER, ALLOYDB_PASSWORD
    GOOGLE_CLOUD_PROJECT (para Gemini, opcional)

Instalar: pip install scikit-learn
"""
import os
import sys
import json
import random
import logging
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ── Cluster definitions ──────────────────────────────────────────────────────

CLUSTERS = [
    {
        "id": 1,
        "label": "Ring Accidente · Av. Universitaria",
        "tipo": "ring_accidente",
        "proveedor_id": None,  # uses existing
        "ciudad": "Quito",
        "ramo": "Vehículos",
        "cobertura": "Colisión y Volcamiento",
        "n": 6,
        "base": "Colisión por alcance en la intersección de la Av. Universitaria y Av. América, sector norte de Quito. Vehículo asegurado fue impactado en su parte trasera mientras esperaba el cambio de semáforo. Daños en parachoque trasero, maletero y sistema de escape.",
        "fallback": [
            "Choque por detrás en el semáforo de Universitaria y América. Otro vehículo que circulaba a exceso de velocidad golpeó la parte posterior del carro asegurado. Se registraron daños en parachoque trasero, tapa de maletero y silenciador.",
            "Impacto en la parte posterior del vehículo asegurado en la Av. Universitaria cruce con América. El conductor detuvo el auto en el semáforo cuando un vehículo desconocido le golpeó por atrás. Daños visibles en zócalo trasero, maletero y tubo de escape.",
            "Accidente de tránsito en Av. Universitaria y Av. América, norte de Quito. El asegurado estaba detenido esperando luz verde cuando recibió un impacto trasero de fuerte intensidad. Se reportan daños en defensa posterior, carrocería del maletero y escape.",
            "En la esquina de la Av. Universitaria con América, el vehículo asegurado fue alcanzado por la parte trasera mientras esperaba el semáforo. El impacto causó daños en el parachoque posterior, maletero y sistema de escape del vehículo.",
            "Siniestro ocurrido en la intersección Universitaria-América, norte de Quito. Vehículo detenido en semáforo fue impactado por la parte trasera. Los daños incluyen defensa posterior, tapa de baúl y conducto de escape deteriorados.",
        ],
        "score_range": (78, 92),
        "monto_range": (1800, 3500),
    },
    {
        "id": 2,
        "label": "Ring Accidente · Ruta E35",
        "tipo": "ring_accidente",
        "proveedor_id": None,
        "ciudad": "Latacunga",
        "ramo": "Vehículos",
        "cobertura": "Pérdida Total por Accidente",
        "n": 7,
        "base": "Volcamiento en la curva del km 45 de la vía E35 Latacunga-Ambato durante aguacero intenso. El vehículo perdió el control y cayó por el costado de la vía. Daños estructurales en techo, laterales izquierdos y sistema de dirección comprometido.",
        "fallback": [
            "Pérdida de control y volcamiento en km 45 de la E35, sector Latacunga-Ambato, bajo lluvia intensa. El asegurado no pudo controlar el vehículo en la curva. Se evidencian daños en techo abolido, laterales y columna de dirección.",
            "En el kilómetro 45 de la carretera E35 entre Latacunga y Ambato, el vehículo asegurado se volcó en condiciones de lluvia. La curva pronunciada y el piso mojado causaron el accidente. Presenta daños en estructura del techo, costado izquierdo y mecanismo de dirección.",
            "Accidente con volcamiento en la vía E35, km 45, Latacunga-Ambato, durante tormenta. El conductor reportó que la calzada estaba resbaladiza. Vehículo con daños severos en techo, carrocería lateral y dirección.",
            "El asegurado perdió el control del vehículo en la curva del km 45 de la E35 Latacunga-Ambato por las fuertes lluvias y el vehículo se volcó. Daños: techo hundido, laterales golpeados, dirección averiada.",
            "Siniestro tipo volcamiento en el km 45 de la autopista E35, tramo Latacunga-Ambato, en condiciones lluviosas. La curva se tornó peligrosa por el agua acumulada. Daños reportados: deformación del techo, lateral izquierdo y sistema de dirección.",
            "Durante precipitaciones intensas en la vía E35 entre Latacunga y Ambato, el vehículo del asegurado sufrió volcamiento en el km 45. El firme resbaladizo provocó pérdida de control en la curva. Afectaciones en techo, laterales y columna de dirección.",
        ],
        "score_range": (82, 95),
        "monto_range": (8000, 18000),
    },
    {
        "id": 3,
        "label": "Taller Cómplice · Automotriz Norte",
        "tipo": "taller_complice",
        "proveedor_id": "PROV-AUTOMOTRIZ-NORTE",
        "ciudad": "Quito",
        "ramo": "Vehículos",
        "cobertura": "Daños propios",
        "n": 12,
        "base": "El vehículo asegurado recibió impacto lateral en el estacionamiento. Daños en guardafango delantero derecho, capó con abolladuras y parabrisas frontal con fisuras. Reparación autorizada en Automotriz Norte.",
        "fallback": [
            "Colisión lateral en zona de parqueadero. Se reportan daños en guardafango anterior derecho, capó deformado y vidrio frontal agrietado. El asegurado solicita reparación en el taller Automotriz Norte.",
            "Impacto en estacionamiento de centro comercial. Daños observados: guardafango delantero derecho doblado, capó con hundimiento leve y parabrisas con fractura. Cotización presentada por Automotriz Norte.",
            "El vehículo sufrió un golpe lateral mientras estaba estacionado. Se evidencia daño en el guardafango frontal derecho, abolladuras en el capó y fisura en el parabrisas. La reparación se realizaría en Automotriz Norte.",
            "Daños causados por impacto lateral en parqueadero. Guardafango delantero derecho dañado, capó abollado y cristal frontal con grieta. El propietario presenta presupuesto de Automotriz Norte para la reparación.",
            "Golpe recibido en estacionamiento mientras el vehículo estaba sin conductor. Afectaciones: guarda fango derecho delantero, capó dañado y parabrisas con fisura horizontal. Se solicita reparación en Automotriz Norte.",
            "El asegurado reporta impacto lateral de vehículo desconocido en área de parqueo. Daños confirmados: guardafango anterior derecho, capó con deformación y parabrisas frontal con rotura parcial. Taller Automotriz Norte emite presupuesto.",
            "Siniestro en zona de estacionamiento. El vehículo presentó daños en guardafango delantero derecho, capó con impacto y vidrio parabrisas con cuarteaduras. Se autoriza reparación en Automotriz Norte previa evaluación.",
            "Vehículo golpeado lateralmente en parqueadero subterráneo. Daños: guardafango frontal derecho partido, capó con abolladura y parabrisas con fisura. Cotización de reparación adjuntada de Automotriz Norte.",
            "Impacto lateral recibido por el vehículo asegurado en zona de parqueo. Se registraron daños en el guardafango delantero derecho, abolladuras en el capó y grieta en el parabrisas. Taller Automotriz Norte presentó presupuesto de reparación.",
            "El conductor reporta haber encontrado su vehículo con daños al salir del estacionamiento. Se observa guardafango derecho delantero doblado, capó con golpe y fisura en parabrisas. Automotriz Norte es el taller de preferencia del asegurado.",
            "Daño lateral en zona de parqueo de supermercado. Guardafango anterior derecho con deformación, capó abollado en esquina y parabrisas frontal con quebradura. La reparación se realizó en Automotriz Norte con cotización aprobada.",
        ],
        "score_range": (75, 88),
        "monto_range": (2200, 4800),
    },
]

# ── DB connection ────────────────────────────────────────────────────────────

def get_engine():
    host     = os.environ.get("ALLOYDB_HOST", "localhost")
    port     = os.environ.get("ALLOYDB_PORT", "5432")
    db       = os.environ.get("ALLOYDB_DATABASE", "fraudia")
    user     = os.environ.get("ALLOYDB_USER", "loader_user")
    password = os.environ.get("ALLOYDB_PASSWORD", "")
    url = f"postgresql+psycopg://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/{db}"
    return create_engine(url, pool_pre_ping=True)


# ── Gemini generation ────────────────────────────────────────────────────────

def generate_descriptions_gemini(base: str, n: int) -> list[str]:
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel

        project  = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
        location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
        if not project:
            raise ValueError("GOOGLE_CLOUD_PROJECT not set")

        vertexai.init(project=project, location=location)
        model = GenerativeModel("gemini-2.5-flash")

        prompt = f"""Eres un generador de datos sintéticos para pruebas de detección de fraude en seguros de Ecuador.

Genera exactamente {n} variaciones en español de la siguiente descripción de un siniestro de vehículo, manteniendo el mismo evento pero usando palabras y estructuras de oraciones distintas. Cada variación debe:
- Describir claramente el mismo accidente o situación con los mismos lugares y daños
- Mantener los nombres de lugares, proveedores o características físicas clave
- Variar la redacción, el orden de las palabras y usar algunos sinónimos
- Tener entre 40 y 80 palabras cada una
- Sonar como un reporte real de siniestro de seguros en Ecuador

Descripción base: {base}

Responde con exactamente {n} variaciones, una por línea, sin numeración, prefijos ni texto adicional."""

        response = model.generate_content(prompt)
        lines = [l.strip() for l in response.text.strip().split("\n") if l.strip()]
        if len(lines) >= n:
            logger.info(f"Gemini generated {len(lines)} descriptions")
            return lines[:n]
        logger.warning(f"Gemini only returned {len(lines)}, expected {n}")
        return lines
    except Exception as e:
        logger.warning(f"Gemini unavailable ({e}), using template fallback")
        return []


# ── Setup taller proveedor ───────────────────────────────────────────────────

def ensure_taller_proveedor(conn):
    conn.execute(text("""
        INSERT INTO claims.proveedores
            (id_proveedor, nombre_proveedor, tipo, ciudad,
             reclamos_asociados, monto_promedio_reclamado,
             porcentaje_casos_observados, en_lista_restrictiva, antiguedad_meses)
        VALUES
            ('PROV-AUTOMOTRIZ-NORTE', 'Automotriz Norte', 'Taller de reparación', 'Quito',
             12, 3200.00, 91.7, TRUE, 18)
        ON CONFLICT (id_proveedor) DO UPDATE SET
            en_lista_restrictiva = TRUE,
            porcentaje_casos_observados = 91.7
    """))
    conn.commit()
    logger.info("Proveedor PROV-AUTOMOTRIZ-NORTE ensured in DB")


# ── Clean existing fraud data ────────────────────────────────────────────────

def clean_fraud_data(conn):
    deleted_sin = conn.execute(text(
        "DELETE FROM claims.siniestros WHERE id_siniestro LIKE 'SIN-FRAUD-%' RETURNING id_siniestro"
    )).rowcount
    deleted_nar = conn.execute(text(
        "DELETE FROM claims.narrativas_similares WHERE metodo = 'tfidf_cosine' RETURNING id_par"
    )).rowcount
    conn.commit()
    logger.info(f"Cleaned {deleted_sin} fraud siniestros and {deleted_nar} tfidf pairs")


# ── Insert fraud siniestros ──────────────────────────────────────────────────

def insert_fraud_siniestros(conn, cluster: dict, descriptions: list[str]) -> list[str]:
    inserted_ids = []
    base_date = date(2024, 9, 1)

    for i, desc in enumerate(descriptions):
        sin_id = f"SIN-FRAUD-{'R1' if cluster['id'] == 1 else 'R2' if cluster['id'] == 2 else 'T1'}-{i+1:03d}"
        score_final = random.uniform(*cluster["score_range"])
        score_reglas = score_final + random.uniform(-5, 5)
        score_modelo = score_final + random.uniform(-8, 8)
        score_reglas = max(0, min(100, score_reglas))
        score_modelo = max(0, min(100, score_modelo))
        monto = random.uniform(*cluster["monto_range"])
        dias_inicio = random.randint(8, 45)
        fecha_ocurrencia = base_date + timedelta(days=random.randint(0, 90))
        fecha_reporte = fecha_ocurrencia + timedelta(days=random.randint(1, 5))

        alertas = json.dumps(["RF-07: Narrativa Clonada o Idéntica (>85% similitud)"])
        reglas_criticas = json.dumps(["RF-07"])

        proveedor_id = cluster.get("proveedor_id")

        conn.execute(text("""
            INSERT INTO claims.siniestros (
                id_siniestro, id_poliza, id_asegurado, id_proveedor,
                ramo, cobertura, ciudad, sucursal, estado,
                fecha_ocurrencia, fecha_reporte,
                monto_reclamado, monto_estimado, monto_pagado, suma_asegurada,
                descripcion,
                documentos_completos,
                dias_desde_inicio_poliza, dias_desde_fin_poliza, dias_entre_ocurrencia_reporte,
                historial_siniestros_asegurado, historial_siniestros_vehiculo, historial_siniestros_conductor,
                score_reglas, score_modelo_simulado, score_final,
                nivel_riesgo, alertas_activadas, reglas_criticas_activadas,
                accion_sugerida, etiqueta_fraude_simulada
            ) VALUES (
                :id, :poliza, :asegurado, :proveedor,
                :ramo, :cobertura, :ciudad, :sucursal, 'En Investigación',
                :fecha_oc, :fecha_rep,
                :monto, :monto_est, 0, :suma,
                :desc,
                FALSE,
                :dias_inicio, :dias_fin, :dias_rep,
                :hist_a, :hist_v, :hist_c,
                :score_r, :score_m, :score_f,
                'Rojo Alto', CAST(:alertas AS jsonb), CAST(:reglas AS jsonb),
                'Escalar a Unidad de Antifraude — Narrativa Clonada Detectada', 1
            )
            ON CONFLICT (id_siniestro) DO NOTHING
        """), {
            "id": sin_id,
            "poliza": f"POL-FRAUD-{cluster['id']:02d}-{i+1:03d}",
            "asegurado": f"AS-FRAUD-{cluster['id']:02d}-{i+1:03d}",
            "proveedor": proveedor_id,
            "ramo": cluster["ramo"],
            "cobertura": cluster["cobertura"],
            "ciudad": cluster["ciudad"],
            "sucursal": cluster["ciudad"],
            "fecha_oc": fecha_ocurrencia,
            "fecha_rep": fecha_reporte,
            "monto": round(monto, 2),
            "monto_est": round(monto * 1.1, 2),
            "suma": round(monto * 3, 2),
            "desc": desc,
            "dias_inicio": dias_inicio,
            "dias_fin": random.randint(300, 700),
            "dias_rep": (fecha_reporte - fecha_ocurrencia).days,
            "hist_a": random.randint(1, 4),
            "hist_v": random.randint(1, 3),
            "hist_c": random.randint(0, 2),
            "score_r": round(score_reglas, 2),
            "score_m": round(score_modelo, 2),
            "score_f": round(score_final, 2),
            "alertas": alertas,
            "reglas": reglas_criticas,
        })
        inserted_ids.append(sin_id)

    conn.commit()
    logger.info(f"  Cluster {cluster['id']}: inserted {len(inserted_ids)} siniestros")
    return inserted_ids


# ── TF-IDF analysis ──────────────────────────────────────────────────────────

def run_tfidf_analysis(conn, threshold: float = 0.22) -> list[dict]:
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
    except ImportError:
        logger.error("scikit-learn not installed. Run: pip install scikit-learn")
        sys.exit(1)

    # Fetch all siniestros
    rows = conn.execute(text("""
        SELECT id_siniestro, descripcion
        FROM claims.siniestros
        WHERE descripcion IS NOT NULL AND descripcion != ''
        ORDER BY id_siniestro
    """)).fetchall()

    all_ids   = [r[0] for r in rows]
    all_descs = [r[1] for r in rows]

    logger.info(f"TF-IDF: {len(all_ids)} siniestros with descriptions")

    # Identify fraud siniestros
    fraud_ids = [id_ for id_ in all_ids if id_.startswith("SIN-FRAUD-")]
    if not fraud_ids:
        logger.warning("No fraud siniestros found — run insert step first")
        return []

    def get_cluster(id_: str) -> int:
        if "R1" in id_: return 1
        if "R2" in id_: return 2
        if "T1" in id_: return 3
        return 0

    # Vectorize ALL descriptions (gives proper IDF weighting)
    vectorizer = TfidfVectorizer(
        analyzer="word",
        ngram_range=(1, 2),
        max_features=10000,
        sublinear_tf=True,
        min_df=1,
    )
    tfidf_matrix = vectorizer.fit_transform(all_descs)

    fraud_indices = [all_ids.index(fid) for fid in fraud_ids]
    fraud_matrix  = tfidf_matrix[fraud_indices]

    # Compute fraud vs all
    sim_matrix = cosine_similarity(fraud_matrix, tfidf_matrix)

    pairs: dict[tuple, dict] = {}
    for fi, fraud_idx in enumerate(fraud_indices):
        id_a     = fraud_ids[fi]
        desc_a   = all_descs[fraud_idx]
        cluster_a = get_cluster(id_a)

        for j, sim in enumerate(sim_matrix[fi]):
            if j == fraud_idx:
                continue
            if sim < threshold:
                continue
            id_b = all_ids[j]
            if id_a == id_b:
                continue

            key = (min(id_a, id_b), max(id_a, id_b))
            if key in pairs:
                continue

            desc_b    = all_descs[j]
            cluster_b = get_cluster(id_b)
            cluster   = cluster_a if cluster_b == 0 or cluster_a == cluster_b else cluster_a

            pairs[key] = {
                "id_a": key[0],
                "id_b": key[1],
                "cluster": cluster,
                "sim": float(sim),
                "desc_a": desc_a if id_a == key[0] else desc_b,
                "desc_b": desc_b if id_b == key[1] else desc_a,
            }

    result = sorted(pairs.values(), key=lambda x: x["sim"], reverse=True)
    logger.info(f"TF-IDF: found {len(result)} pairs with similarity >= {threshold}")
    return result


# ── Write pairs to DB ────────────────────────────────────────────────────────

def write_pairs(conn, pairs: list[dict]):
    if not pairs:
        logger.warning("No pairs to write")
        return

    for p in pairs:
        conn.execute(text("""
            INSERT INTO claims.narrativas_similares
                (id_siniestro_a, id_siniestro_b, cluster_narrativa,
                 similitud_coseno_simulada, descripcion_a, descripcion_b, metodo)
            VALUES
                (:a, :b, :cluster, :sim, :da, :db, 'tfidf_cosine')
        """), {
            "a": p["id_a"],
            "b": p["id_b"],
            "cluster": p["cluster"],
            "sim": round(p["sim"], 4),
            "da": p["desc_a"][:500],
            "db": p["desc_b"][:500],
        })

    conn.commit()
    logger.info(f"Wrote {len(pairs)} pairs to claims.narrativas_similares")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    engine = get_engine()

    with engine.connect() as conn:
        logger.info("=== Step 1: Setup ===")
        ensure_taller_proveedor(conn)
        clean_fraud_data(conn)

        logger.info("=== Step 2: Generate & insert fraud siniestros ===")
        all_fraud_ids = []

        for cluster in CLUSTERS:
            logger.info(f"  Cluster {cluster['id']}: {cluster['label']} ({cluster['n']} siniestros)")

            # Try Gemini first
            descriptions = generate_descriptions_gemini(cluster["base"], cluster["n"] - 1)

            # Pad with fallback if needed
            fallback = cluster["fallback"]
            while len(descriptions) < cluster["n"] - 1:
                descriptions.append(fallback[len(descriptions) % len(fallback)])

            # Always include the base description
            all_descriptions = [cluster["base"]] + descriptions[:cluster["n"] - 1]

            fraud_ids = insert_fraud_siniestros(conn, cluster, all_descriptions)
            all_fraud_ids.extend(fraud_ids)

        logger.info(f"Inserted {len(all_fraud_ids)} fraud siniestros total")

        logger.info("=== Step 3: TF-IDF similarity analysis ===")
        pairs = run_tfidf_analysis(conn)

        logger.info("=== Step 4: Write pairs to DB ===")
        write_pairs(conn, pairs)

    # Summary
    with engine.connect() as conn:
        stats = conn.execute(text("""
            SELECT
                COUNT(DISTINCT cluster_narrativa) AS clusters,
                COUNT(*) AS total_pares,
                AVG(similitud_coseno_simulada) AS avg_sim
            FROM claims.narrativas_similares
            WHERE metodo = 'tfidf_cosine'
        """)).mappings().one()

    logger.info("=== DONE ===")
    logger.info(f"Clusters detectados: {stats['clusters']}")
    logger.info(f"Pares con alta similitud: {stats['total_pares']}")
    logger.info(f"Similitud promedio: {float(stats['avg_sim'] or 0):.1%}")
    logger.info("Ahora puedes ver las alertas en el dashboard.")


if __name__ == "__main__":
    main()
