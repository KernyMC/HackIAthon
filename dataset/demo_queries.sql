-- Queries for MVP demo

-- 1. Top 10 highest risk claims
SELECT id_siniestro, ramo, cobertura, ciudad, monto_reclamado, score_final, nivel_riesgo, alertas_activadas
FROM siniestros_scored
ORDER BY score_final DESC
LIMIT 10;

-- 2. Providers with more red alerts
SELECT p.id_proveedor, p.nombre_proveedor, p.tipo, p.ciudad,
       COUNT(*) AS total_siniestros,
       SUM(CASE WHEN s.nivel_riesgo = 'Rojo Alto' THEN 1 ELSE 0 END) AS alertas_rojas,
       ROUND(AVG(s.score_final), 1) AS score_promedio
FROM siniestros_scored s
JOIN proveedores p ON p.id_proveedor = s.id_proveedor
GROUP BY p.id_proveedor, p.nombre_proveedor, p.tipo, p.ciudad
ORDER BY alertas_rojas DESC, score_promedio DESC
LIMIT 10;

-- 3. Claims near policy start
SELECT id_siniestro, id_poliza, cobertura, dias_desde_inicio_poliza, score_final, nivel_riesgo
FROM siniestros_scored
WHERE dias_desde_inicio_poliza <= 30
ORDER BY dias_desde_inicio_poliza ASC, score_final DESC;

-- 4. Missing or inconsistent documents in red cases
SELECT s.id_siniestro, s.score_final, s.nivel_riesgo, d.tipo_documento, d.entregado, d.legible, d.inconsistencia_detectada, d.observacion
FROM siniestros_scored s
JOIN documentos d ON d.id_siniestro = s.id_siniestro
WHERE s.nivel_riesgo = 'Rojo Alto'
  AND (d.entregado = 'No' OR d.legible = 'No' OR d.inconsistencia_detectada = 'Si')
ORDER BY s.score_final DESC;

-- 5. Risk concentration by branch and city
SELECT ciudad, sucursal, nivel_riesgo, COUNT(*) AS casos, ROUND(SUM(monto_reclamado), 2) AS monto_reclamado_total
FROM siniestros_scored
GROUP BY ciudad, sucursal, nivel_riesgo
ORDER BY ciudad, sucursal, nivel_riesgo;
