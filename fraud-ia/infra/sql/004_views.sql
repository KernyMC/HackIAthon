-- 004_views.sql
-- Create analytical views for the FraudIA Claims Assistant system.
-- Run after 002_schema.sql.

-- ---------------------------------------------------------------------------
-- claims.v_kpis
-- Top-level KPI summary consumed by GET /api/kpis
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW claims.v_kpis AS
SELECT
    COUNT(*)                                                            AS total_siniestros,
    COUNT(*) FILTER (WHERE nivel_riesgo = 'Verde Bajo')                 AS casos_verdes,
    COUNT(*) FILTER (WHERE nivel_riesgo = 'Amarillo Medio')             AS casos_amarillos,
    COUNT(*) FILTER (WHERE nivel_riesgo = 'Rojo Alto')                  AS casos_rojos,
    COALESCE(SUM(monto_reclamado), 0)                                   AS monto_total_reclamado,
    COALESCE(SUM(monto_reclamado) FILTER (
        WHERE nivel_riesgo = 'Rojo Alto'), 0)                           AS monto_rojo_reclamado,
    COALESCE(SUM(monto_reclamado) FILTER (
        WHERE nivel_riesgo = 'Amarillo Medio'), 0)                      AS monto_amarillo_reclamado,
    COALESCE(AVG(score_final), 0)                                       AS score_promedio,
    COALESCE(AVG(score_final) FILTER (
        WHERE nivel_riesgo = 'Rojo Alto'), 0)                           AS score_promedio_rojos,
    COUNT(*) FILTER (WHERE documentos_completos = FALSE)                AS casos_docs_incompletos,
    COUNT(*) FILTER (WHERE proveedor_en_lista_restrictiva = TRUE)       AS casos_proveedor_restrictivo,
    COUNT(*) FILTER (WHERE dias_desde_inicio_poliza <= 30)              AS casos_inicio_temprano_poliza
FROM claims.siniestros;

-- ---------------------------------------------------------------------------
-- claims.v_provider_risk
-- Per-provider aggregated risk stats joined with provider master data.
-- Consumed by GET /api/proveedores/riesgo
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW claims.v_provider_risk AS
SELECT
    s.id_proveedor,
    p.nombre_proveedor,
    p.tipo,
    p.ciudad                                        AS ciudad_proveedor,
    p.en_lista_restrictiva,
    p.antiguedad_meses,
    COUNT(*)                                        AS total_siniestros,
    COUNT(*) FILTER (WHERE s.nivel_riesgo = 'Rojo Alto')        AS casos_rojos,
    COUNT(*) FILTER (WHERE s.nivel_riesgo = 'Amarillo Medio')   AS casos_amarillos,
    COUNT(*) FILTER (WHERE s.nivel_riesgo = 'Verde Bajo')       AS casos_verdes,
    ROUND(AVG(s.score_final)::NUMERIC, 2)           AS score_promedio,
    COALESCE(SUM(s.monto_reclamado), 0)             AS monto_total_reclamado,
    COALESCE(AVG(s.monto_reclamado), 0)             AS monto_promedio_reclamado,
    -- Percentage of cases flagged red out of provider total
    ROUND(
        (COUNT(*) FILTER (WHERE s.nivel_riesgo = 'Rojo Alto')::NUMERIC
         / NULLIF(COUNT(*), 0)) * 100,
    2)                                              AS pct_casos_rojos,
    -- Combined alert rate (red + yellow)
    ROUND(
        (COUNT(*) FILTER (WHERE s.nivel_riesgo IN ('Rojo Alto', 'Amarillo Medio'))::NUMERIC
         / NULLIF(COUNT(*), 0)) * 100,
    2)                                              AS pct_casos_alerta
FROM claims.siniestros s
LEFT JOIN claims.proveedores p
    ON p.id_proveedor = s.id_proveedor
GROUP BY
    s.id_proveedor,
    p.nombre_proveedor,
    p.tipo,
    p.ciudad,
    p.en_lista_restrictiva,
    p.antiguedad_meses;

-- ---------------------------------------------------------------------------
-- claims.v_siniestros_enriched
-- Full siniestro row enriched with provider and policy data.
-- Consumed by the siniestros table endpoint and the detail endpoint.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW claims.v_siniestros_enriched AS
SELECT
    -- Core siniestro fields
    s.id_siniestro,
    s.id_poliza,
    s.id_asegurado,
    s.id_vehiculo,
    s.id_conductor,
    s.id_proveedor,
    s.ramo,
    s.cobertura,
    s.ciudad,
    s.sucursal,
    s.estado,
    s.fecha_ocurrencia,
    s.fecha_reporte,
    s.monto_reclamado,
    s.monto_estimado,
    s.monto_pagado,
    s.suma_asegurada,
    s.deducible,
    s.descripcion,
    s.beneficiario,
    s.dias_desde_inicio_poliza,
    s.dias_desde_fin_poliza,
    s.dias_entre_ocurrencia_reporte,
    s.historial_siniestros_asegurado,
    s.historial_siniestros_vehiculo,
    s.historial_siniestros_conductor,
    s.historial_solo_rc_asegurado,
    s.tipo_impacto,
    s.hora_evento,
    s.tercero_identificado,
    s.evidencia_camaras,
    s.tipo_via,
    s.clima,
    s.documentos_completos,
    s.documento_inconsistente,
    s.relato_ilogico,
    s.narrativa_cluster_id,
    s.similitud_narrativa_max,
    s.etiqueta_fraude_simulada,
    s.perfil_riesgo_generacion,
    s.canal_venta,
    s.proveedor_en_lista_restrictiva,
    s.proveedor_casos_observados_ultimo_anio,
    s.ratio_monto_suma_asegurada,
    s.score_reglas,
    s.score_modelo_simulado,
    s.score_final,
    s.nivel_riesgo,
    s.alertas_activadas,
    s.reglas_criticas_activadas,
    s.accion_sugerida,
    s.created_at,

    -- Provider master data
    p.nombre_proveedor,
    p.tipo                          AS tipo_proveedor,
    p.ciudad                        AS ciudad_proveedor,
    p.monto_promedio_reclamado      AS proveedor_monto_promedio,
    p.porcentaje_casos_observados   AS proveedor_pct_observados,

    -- Policy master data
    pol.fecha_inicio                AS poliza_fecha_inicio,
    pol.fecha_fin                   AS poliza_fecha_fin,
    pol.estado_poliza,
    pol.plan_producto,
    pol.prima

FROM claims.siniestros s
LEFT JOIN claims.proveedores p
    ON p.id_proveedor = s.id_proveedor
LEFT JOIN claims.polizas pol
    ON pol.id_poliza = s.id_poliza;
