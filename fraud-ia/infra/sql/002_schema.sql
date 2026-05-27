-- 002_schema.sql
-- Create all tables for the FraudIA Claims Assistant system.
-- Schemas: claims (business data), rag (vector knowledge base), app (sessions & tracing).
-- Run after 001_extensions.sql.

-- ---------------------------------------------------------------------------
-- SCHEMA: claims
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS claims.polizas (
    id_poliza           TEXT PRIMARY KEY,
    id_asegurado        TEXT,
    ramo                TEXT,
    fecha_inicio        DATE,
    fecha_fin           DATE,
    prima               NUMERIC(14,2),
    suma_asegurada      NUMERIC(14,2),
    deducible           NUMERIC(14,2),
    canal_venta         TEXT,
    ciudad              TEXT,
    estado_poliza       TEXT,
    plan_producto       TEXT                             -- extra column present in real CSV
);

CREATE TABLE IF NOT EXISTS claims.asegurados (
    id_asegurado                TEXT PRIMARY KEY,
    segmento                    TEXT,
    antiguedad_meses            INTEGER,
    ciudad                      TEXT,
    numero_polizas              INTEGER,
    reclamos_ultimos_12_meses   INTEGER,
    mora_actual                 BOOLEAN,
    score_cliente_simulado      NUMERIC(6,2)
);

CREATE TABLE IF NOT EXISTS claims.vehiculos (
    id_vehiculo     TEXT PRIMARY KEY,
    placa_hash      TEXT,
    marca           TEXT,
    modelo          TEXT,
    anio            INTEGER,
    chasis_hash     TEXT,
    motor_hash      TEXT,
    ciudad          TEXT,
    uso             TEXT                                 -- extra column present in real CSV
);

CREATE TABLE IF NOT EXISTS claims.conductores (
    id_conductor                TEXT PRIMARY KEY,
    rango_edad                  TEXT,                   -- real CSV uses rango_edad (text band), not edad integer
    antiguedad_licencia_anios   INTEGER,                -- real CSV uses years, not months
    ciudad                      TEXT,
    relacion_asegurado          TEXT                    -- real CSV includes relationship field
);

CREATE TABLE IF NOT EXISTS claims.proveedores (
    id_proveedor                        TEXT PRIMARY KEY,
    nombre_proveedor                    TEXT,
    tipo                                TEXT,
    ciudad                              TEXT,
    reclamos_asociados                  INTEGER,
    monto_promedio_reclamado            NUMERIC(14,2),
    porcentaje_casos_observados         NUMERIC(6,2),
    en_lista_restrictiva                BOOLEAN,
    antiguedad_meses                    INTEGER
);

CREATE TABLE IF NOT EXISTS claims.siniestros (
    -- identifiers
    id_siniestro            TEXT PRIMARY KEY,
    id_poliza               TEXT,
    id_asegurado            TEXT,
    id_vehiculo             TEXT,
    id_conductor            TEXT,
    id_proveedor            TEXT,

    -- classification
    ramo                    TEXT,
    cobertura               TEXT,
    ciudad                  TEXT,
    sucursal                TEXT,
    estado                  TEXT,

    -- dates
    fecha_ocurrencia        DATE,
    fecha_reporte           DATE,

    -- amounts
    monto_reclamado         NUMERIC(14,2),
    monto_estimado          NUMERIC(14,2),
    monto_pagado            NUMERIC(14,2),
    suma_asegurada          NUMERIC(14,2),
    deducible               NUMERIC(14,2),

    -- narrative
    descripcion             TEXT,
    beneficiario            TEXT,

    -- policy timing features
    dias_desde_inicio_poliza            INTEGER,
    dias_desde_fin_poliza               INTEGER,
    dias_entre_ocurrencia_reporte       INTEGER,

    -- history features
    historial_siniestros_asegurado      INTEGER,
    historial_siniestros_vehiculo       INTEGER,
    historial_siniestros_conductor      INTEGER,
    historial_solo_rc_asegurado         INTEGER,

    -- event context features (real CSV columns)
    tipo_impacto            TEXT,
    hora_evento             TEXT,
    tercero_identificado    BOOLEAN,
    evidencia_camaras       BOOLEAN,
    tipo_via                TEXT,
    clima                   TEXT,

    -- document & consistency flags
    documentos_completos        BOOLEAN,
    documento_inconsistente     BOOLEAN,
    relato_ilogico              BOOLEAN,

    -- narrative clustering (real CSV columns)
    narrativa_cluster_id        INTEGER,
    similitud_narrativa_max     NUMERIC(6,4),

    -- label & generation metadata
    etiqueta_fraude_simulada    INTEGER,
    perfil_riesgo_generacion    TEXT,

    -- policy commercial fields (denormalized for convenience)
    canal_venta                 TEXT,

    -- provider risk fields (denormalized for convenience)
    proveedor_en_lista_restrictiva              BOOLEAN,
    proveedor_casos_observados_ultimo_anio      INTEGER,

    -- derived ratio
    ratio_monto_suma_asegurada  NUMERIC(8,4),

    -- scoring
    score_reglas            NUMERIC(5,2),
    score_modelo_simulado   NUMERIC(5,2),
    score_final             NUMERIC(5,2),
    nivel_riesgo            TEXT,

    -- alerts & decisions (stored as JSONB arrays)
    alertas_activadas           JSONB DEFAULT '[]'::jsonb,
    reglas_criticas_activadas   JSONB DEFAULT '[]'::jsonb,
    accion_sugerida             TEXT,

    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claims.documentos (
    id_documento                TEXT PRIMARY KEY,
    id_siniestro                TEXT,
    tipo_documento              TEXT,
    entregado                   BOOLEAN,
    legible                     BOOLEAN,
    fecha_emision               DATE,
    inconsistencia_detectada    BOOLEAN,
    observacion                 TEXT
);

CREATE TABLE IF NOT EXISTS claims.narrativas_similares (
    id_par                      BIGSERIAL PRIMARY KEY,  -- real CSV uses id_par
    id_siniestro_a              TEXT,
    id_siniestro_b              TEXT,
    cluster_narrativa           INTEGER,                -- real CSV column
    similitud_coseno_simulada   NUMERIC(6,4),           -- real CSV column (replaces similitud)
    descripcion_a               TEXT,                   -- real CSV column
    descripcion_b               TEXT,                   -- real CSV column
    metodo                      TEXT DEFAULT 'tfidf_cosine'
);

-- ---------------------------------------------------------------------------
-- SCHEMA: rag
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rag.business_documents (
    id          BIGSERIAL PRIMARY KEY,
    source_name TEXT NOT NULL,
    title       TEXT NOT NULL,
    doc_type    TEXT NOT NULL,
    version     TEXT DEFAULT 'hackathon_v1',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rag.business_chunks (
    id              BIGSERIAL PRIMARY KEY,
    document_id     BIGINT REFERENCES rag.business_documents(id),
    source_name     TEXT NOT NULL,
    title           TEXT,
    section         TEXT,
    doc_type        TEXT,
    chunk_index     INTEGER,
    chunk_text      TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}'::jsonb,
    embedding       vector(768),                        -- gemini-embedding-001 at 768 dims
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- SCHEMA: app
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app.chat_sessions (
    id          BIGSERIAL PRIMARY KEY,
    session_id  TEXT UNIQUE NOT NULL,
    user_label  TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app.chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    session_id  TEXT NOT NULL,
    role        TEXT NOT NULL,           -- 'user' | 'assistant'
    content     TEXT NOT NULL,
    tools_used  JSONB DEFAULT '[]'::jsonb,
    citations   JSONB DEFAULT '[]'::jsonb,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app.agent_tool_calls (
    id              BIGSERIAL PRIMARY KEY,
    session_id      TEXT,
    tool_name       TEXT NOT NULL,
    input_payload   JSONB,
    output_summary  JSONB,
    latency_ms      INTEGER,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
