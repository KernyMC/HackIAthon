# Índice Maestro – Sistema de Detección de Posible Fraude

**proyecto:** hackIAthon – Reto Aseguradora del Sur  
**versión:** v1.0  
**principio:** La solución genera alertas de revisión, no acusaciones automáticas de fraude

---

## Documentos disponibles

| Archivo | doc_id | Contenido |
|---|---|---|
| `01_senales_fraude.md` | DOC-FRAUD-SIGNALS-001 | 14 señales de riesgo con scoring detallado |
| `02_reglas_negocio_criticas.md` | DOC-FRAUD-RULES-002 | 7 reglas determinísticas ROJO/AMARILLO |
| `03_score_riesgo_clasificacion.md` | DOC-FRAUD-SCORE-003 | Fórmula del score, semáforo y overrides |
| `04_modelo_datos.md` | DOC-FRAUD-DATA-004 | 5 tablas con campos y relaciones |

---

## Guía de consulta rápida para RAG

**¿Cuántos puntos suma X señal?** → `01_senales_fraude.md`  
**¿Qué hace que un caso sea ROJO automático?** → `02_reglas_negocio_criticas.md`  
**¿Cuándo se escala a Antifraude?** → `02_reglas_negocio_criticas.md` + `03_score_riesgo_clasificacion.md`  
**¿Cómo se calcula el score final?** → `03_score_riesgo_clasificacion.md`  
**¿Qué campos tiene la tabla de siniestros?** → `04_modelo_datos.md`  
**¿Qué es la Lista Restrictiva?** → `02_reglas_negocio_criticas.md` (RF-03) + `04_modelo_datos.md` (TBL-003, TBL-004)  
**¿Cómo detectar narrativas clonadas?** → `01_senales_fraude.md` (SIG-013) + `02_reglas_negocio_criticas.md` (RF-07)  

---

## Niveles de riesgo – referencia rápida

| Score | Nivel | Acción |
|---|---|---|
| 0–40 | 🟢 VERDE | Flujo normal |
| 41–75 | 🟡 AMARILLO | Revisión documental en Unidad Antifraude |
| 76–100 | 🔴 ROJO | Revisión especializada de campo |
| RF-01 a RF-04 activa | 🔴 ROJO | Override automático sin importar score |
| RF-05 a RF-07 activa | 🟡 AMARILLO mínimo | Override si score < 41 |
