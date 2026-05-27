-- 003_indexes.sql
-- Create performance indexes for the FraudIA Claims Assistant system.
-- Run after 002_schema.sql.

-- ---------------------------------------------------------------------------
-- claims.siniestros - primary query patterns
-- ---------------------------------------------------------------------------

-- Score-based ordering (dashboard top-N queries)
CREATE INDEX IF NOT EXISTS idx_siniestros_score_final
    ON claims.siniestros (score_final DESC);

-- Risk level filtering (semaphore views)
CREATE INDEX IF NOT EXISTS idx_siniestros_nivel_riesgo
    ON claims.siniestros (nivel_riesgo);

-- Provider lookups (provider risk aggregation)
CREATE INDEX IF NOT EXISTS idx_siniestros_proveedor
    ON claims.siniestros (id_proveedor);

-- Insured party lookups
CREATE INDEX IF NOT EXISTS idx_siniestros_asegurado
    ON claims.siniestros (id_asegurado);

-- Date range filtering
CREATE INDEX IF NOT EXISTS idx_siniestros_fecha_ocurrencia
    ON claims.siniestros (fecha_ocurrencia);

CREATE INDEX IF NOT EXISTS idx_siniestros_fecha_reporte
    ON claims.siniestros (fecha_reporte);

-- Early-in-policy fraud signal
CREATE INDEX IF NOT EXISTS idx_siniestros_dias_inicio
    ON claims.siniestros (dias_desde_inicio_poliza);

-- Combined risk + score for paginated table queries
CREATE INDEX IF NOT EXISTS idx_siniestros_riesgo_score
    ON claims.siniestros (nivel_riesgo, score_final DESC);

-- Ramo / cobertura filtering
CREATE INDEX IF NOT EXISTS idx_siniestros_ramo
    ON claims.siniestros (ramo);

-- Narrative cluster lookups (similar narratives tool)
CREATE INDEX IF NOT EXISTS idx_siniestros_narrativa_cluster
    ON claims.siniestros (narrativa_cluster_id);

-- GIN index for JSONB alert arrays (containment queries)
CREATE INDEX IF NOT EXISTS idx_siniestros_alertas_gin
    ON claims.siniestros USING gin (alertas_activadas);

CREATE INDEX IF NOT EXISTS idx_siniestros_reglas_criticas_gin
    ON claims.siniestros USING gin (reglas_criticas_activadas);

-- Trigram index for free-text search on descripcion
CREATE INDEX IF NOT EXISTS idx_siniestros_descripcion_trgm
    ON claims.siniestros USING gin (descripcion gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- claims.documentos - document completeness queries
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_documentos_siniestro
    ON claims.documentos (id_siniestro);

CREATE INDEX IF NOT EXISTS idx_documentos_tipo
    ON claims.documentos (tipo_documento);

CREATE INDEX IF NOT EXISTS idx_documentos_inconsistencia
    ON claims.documentos (inconsistencia_detectada)
    WHERE inconsistencia_detectada = TRUE;

CREATE INDEX IF NOT EXISTS idx_documentos_entregado
    ON claims.documentos (entregado)
    WHERE entregado = FALSE;

-- ---------------------------------------------------------------------------
-- claims.narrativas_similares - cluster & similarity lookups
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_narrativas_siniestro_a
    ON claims.narrativas_similares (id_siniestro_a);

CREATE INDEX IF NOT EXISTS idx_narrativas_siniestro_b
    ON claims.narrativas_similares (id_siniestro_b);

CREATE INDEX IF NOT EXISTS idx_narrativas_cluster
    ON claims.narrativas_similares (cluster_narrativa);

CREATE INDEX IF NOT EXISTS idx_narrativas_similitud
    ON claims.narrativas_similares (similitud_coseno_simulada DESC);

-- ---------------------------------------------------------------------------
-- claims.proveedores - restrictive list lookups
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_proveedores_lista_restrictiva
    ON claims.proveedores (en_lista_restrictiva)
    WHERE en_lista_restrictiva = TRUE;

-- ---------------------------------------------------------------------------
-- rag.business_chunks - semantic search
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_business_chunks_doc_type
    ON rag.business_chunks (doc_type);

CREATE INDEX IF NOT EXISTS idx_business_chunks_document_id
    ON rag.business_chunks (document_id);

-- Trigram index for keyword fallback search on chunk text
CREATE INDEX IF NOT EXISTS idx_business_chunks_text_trgm
    ON rag.business_chunks USING gin (chunk_text gin_trgm_ops);

-- ScaNN approximate vector index (AlloyDB specific).
-- Requires at least ~1000 rows to build; comment out if you have fewer chunks
-- during development. The exact vector search (ORDER BY embedding <=> query)
-- will work without this index and is the safe fallback for a hackathon demo.
--
-- CREATE INDEX IF NOT EXISTS idx_business_chunks_scann
--     ON rag.business_chunks
--     USING scann (embedding cosine)
--     WITH (num_leaves = 10);

-- ---------------------------------------------------------------------------
-- app.chat_messages - session history retrieval
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_chat_messages_session
    ON app.chat_messages (session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_agent_tool_calls_session
    ON app.agent_tool_calls (session_id, created_at);
