# Uso de Inteligencia Artificial — FraudSweep

## Enfoque híbrido

FraudSweep combina cuatro técnicas de IA complementarias:

| Capa | Técnica | Implementación |
|------|---------|---------------|
| 1 | Reglas de negocio (rule-based) | Python determinista — `apps/api/app/intake/scoring.py` |
| 2 | Modelo ML supervisado | Score pre-calculado con etiqueta simulada — `siniestros_scored.csv` |
| 3 | NLP — similitud textual | TF-IDF coseno — `claims.narrativas_similares` |
| 4 | Agente conversacional | Google ADK + Gemini 2.5 Flash — `apps/api/app/agent/` |

## Capa 1 — Reglas de negocio

Condiciones deterministas evaluadas en tiempo real sobre las variables del siniestro. Cada regla activada suma puntos al `score_reglas` y genera un mensaje explicativo. Ver `docs/reglas_negocio.md`.

## Capa 2 — Modelo ML simulado

`score_modelo_simulado` incluido en el dataset sintético simula el output de un clasificador XGBoost/LightGBM entrenado con `etiqueta_fraude_simulada`. En producción se reemplazaría con un modelo real entrenado sobre historial confirmado de fraudes.

Fórmula: `score_final = 0.6 × score_reglas + 0.4 × score_modelo_simulado`

## Capa 3 — NLP: similitud de narrativas

**Técnica:** TF-IDF vectorizado + similitud coseno entre pares de `descripcion` (texto libre).

**Umbrales:** > 85% → alerta RF-07 Narrativa Clonada · 70–84% → alerta moderada

**Resultado en dataset:** 53 pares con similitud > 85%, agrupados en clusters que revelan posibles anillos de fraude coordinado.

## Capa 4 — Agente IA conversacional

**Motor:** Google Agent Development Kit (ADK)  
**Modelo:** Gemini 2.5 Flash (Vertex AI, `us-central1`)  
**RAG:** gemini-embedding-001 (768d) sobre AlloyDB pgvector

### Herramientas del agente (8)

| Herramienta | Tipo | Descripción |
|-------------|------|-------------|
| `buscar_conocimiento_negocio` | RAG | Consulta semántica sobre reglas, glosario y políticas |
| `listar_siniestros_mayor_riesgo` | SQL | Top N por score_final DESC |
| `explicar_siniestro(id)` | SQL | Detalle completo de un caso específico |
| `analizar_proveedores_alertas` | SQL view | Ranking por concentración de alertas |
| `listar_documentos_faltantes_casos_criticos` | SQL | Docs incompletos en casos Rojo Alto |
| `listar_casos_cerca_inicio_poliza` | SQL | Siniestros en primeros 90 días de vigencia |
| `listar_narrativas_similares` | SQL | Pares con similitud textual alta |
| `generar_resumen_ejecutivo` | SQL multi | KPIs + hallazgos + recomendaciones |

### Ingesta de documentos PDF

```
PDF subido → Gemini multimodal (extracción texto)
           → chunking 800 palabras / 100 overlap
           → gemini-embedding-001 (768d)
           → rag.business_chunks (source_name = peritaje_XXXX)
           → consultable con leer_documento_peritaje(doc_id)
```

### Preguntas que el agente puede responder

- ¿Cuáles son los 10 siniestros con mayor riesgo de fraude?
- ¿Por qué el siniestro SIN-XXXXX fue marcado como Rojo Alto?
- ¿Qué proveedores concentran más alertas?
- ¿Qué documentos faltan en los casos críticos?
- ¿Qué siniestros ocurrieron cerca del inicio de la póliza?
- ¿Hay narrativas similares que indiquen fraude coordinado?
- Genera un resumen ejecutivo del portafolio.
- Analiza el peritaje_XXXXXXXX (PDF indexado).
