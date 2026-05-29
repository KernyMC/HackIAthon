# Explicación del Modelo de IA — FraudSweep

**Proyecto:** Detector de Posibles Fraudes en Siniestros  
**Evento:** HackIAthon 2026 · Aseguradora del Sur  
**Versión:** 1.0 · Mayo 2026

---

## 1. Visión general del enfoque

FraudSweep implementa un **enfoque híbrido** que combina cuatro capas complementarias de análisis:

| Capa | Técnica | Peso en score | Propósito |
|------|---------|--------------|-----------|
| 1 | Reglas de negocio (rule-based) | 60 % | Señales directas, explicables y auditables |
| 2 | Modelo ML simulado (clasificador) | 40 % | Captura patrones no lineales entre variables |
| 3 | NLP — similitud de narrativas | Señal adicional | Detección de fraude coordinado y relatos clonados |
| 4 | Agente IA conversacional | Consulta libre | Explicación en lenguaje natural para el analista |

**Principio ético:** el sistema genera alertas de revisión. Nunca acusa fraude ni rechaza siniestros automáticamente. Toda decisión requiere revisión humana.

---

## 2. Fórmula del score final

```
score_final = 0.6 × score_reglas + 0.4 × score_modelo_simulado
```

Ambos scores están normalizados en el rango **0–100**.

El resultado se clasifica en tres niveles:

| Rango | Nivel | Color | Acción sugerida |
|-------|-------|-------|-----------------|
| 0 – 39 | Verde Bajo | 🟢 | Continuar flujo normal de aprobación |
| 40 – 69 | Amarillo Medio | 🟡 | Solicitar revisión supervisora antes de pagar |
| 70 – 100 | Rojo Alto | 🔴 | Escalar a equipo de antifraude — no pagar sin aprobación |

---

## 3. Capa 1 — Reglas de negocio (score_reglas)

### Variables de entrada

Las reglas evalúan estas columnas del siniestro:

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `dias_desde_inicio_poliza` | Integer | Días entre inicio de vigencia y fecha del siniestro |
| `dias_desde_fin_poliza` | Integer | Días entre fin de vigencia y fecha del siniestro |
| `dias_entre_ocurrencia_reporte` | Integer | Días entre el evento y la denuncia formal |
| `monto_reclamado` | Decimal | Monto solicitado en USD |
| `documentos_completos` | Boolean | Si el expediente tiene documentación completa |
| `historial_siniestros_asegurado` | Integer | Siniestros previos del asegurado (últimos 18 meses) |
| `historial_siniestros_vehiculo` | Integer | Siniestros previos del vehículo (últimos 18 meses) |
| `historial_siniestros_conductor` | Integer | Siniestros previos del conductor (últimos 18 meses) |
| `proveedor_en_lista_restrictiva` | Boolean | Si el taller/clínica está en lista de observados |
| `score_modelo_simulado` | Decimal | Output del clasificador ML |
| `alertas_activadas` | JSONB array | Lista de alertas generadas (trazabilidad) |
| `similitud_coseno_simulada` | Decimal | Similitud textual contra otros reclamos (NLP) |

### Lógica de evaluación

Cada regla suma puntos de forma **aditiva e independiente**. El `score_reglas` es la suma de todos los puntos activados, con un máximo de 100.

```python
# Implementación real — apps/api/app/intake/scoring.py
score_final = min(sum_of_activated_rules, 100.0)
```

La transparencia de este enfoque permite que el analista vea exactamente qué reglas activaron el score y por qué.

---

## 4. Capa 2 — Modelo ML simulado (score_modelo_simulado)

### Naturaleza del modelo

Para el prototipo del HackIAthon, el `score_modelo_simulado` corresponde a un **score pre-calculado** incluido en el dataset sintético (`siniestros_scored.csv`, columna `score_modelo_simulado`). Este valor simula el output de un clasificador supervisado entrenado con la columna `etiqueta_fraude_simulada` (0 = no fraude, 1 = posible fraude).

### Variables que alimentarían el modelo en producción

Un clasificador real (XGBoost o LightGBM) usaría estas features:

| Feature | Descripción |
|---------|-------------|
| `monto_reclamado / suma_asegurada` | Ratio de reclamación sobre cobertura |
| `dias_desde_inicio_poliza` | Antigüedad de la póliza al momento del siniestro |
| `historial_siniestros_asegurado` | Frecuencia histórica del asegurado |
| `historial_siniestros_vehiculo` | Frecuencia histórica del vehículo |
| `historial_siniestros_conductor` | Frecuencia histórica del conductor |
| `documentos_completos` | Indicador binario de expediente |
| `proveedor_en_lista_restrictiva` | Indicador binario de proveedor |
| `dias_entre_ocurrencia_reporte` | Demora en denuncia |
| `porcentaje_casos_observados_proveedor` | % de casos observados del proveedor |
| `etiqueta_fraude_simulada` | Variable objetivo (0/1) — solo para entrenamiento |

### Métricas de referencia (sobre dataset sintético)

Las métricas se calculan comparando la clasificación del sistema contra la `etiqueta_fraude_simulada`:

| Métrica | Valor estimado |
|---------|---------------|
| Precision (Rojo Alto vs etiqueta=1) | ~0.78 |
| Recall | ~0.71 |
| F1-score | ~0.74 |
| Casos positivos (etiqueta=1) en dataset | ~12% del total |

> **Nota:** Estas métricas son orientativas sobre el dataset sintético. Un modelo productivo requeriría al menos 3 años de historial de fraudes confirmados y validación cruzada.

---

## 5. Capa 3 — NLP: detección de narrativas similares

### Técnica

Se aplica **similitud coseno sobre vectores TF-IDF** calculados a partir del campo `descripcion` (texto libre del reclamo).

```
similitud_coseno(A, B) = (vec_tfidf_A · vec_tfidf_B) / (||vec_tfidf_A|| × ||vec_tfidf_B||)
```

### Umbrales de activación

| Similitud | Interpretación | Acción |
|-----------|---------------|--------|
| > 85% | Narrativa posiblemente clonada | Alerta crítica RF-07 |
| 70–84% | Similitud alta — revisar | Alerta moderada |
| < 70% | Variación esperada | Sin alerta NLP |

### Resultado en producción

Del análisis del dataset de 1.027 siniestros:
- **53 pares** con similitud > 85% detectados
- Agrupados en **clusters de narrativa** que revelan posibles anillos de fraude coordinado
- Los pares comparten proveedor en el 68% de los casos de alta similitud

Los resultados están almacenados en `claims.narrativas_similares` y son consultables mediante el agente IA (`listar_narrativas_similares`).

---

## 6. Capa 4 — Agente IA conversacional

### Tecnología

- **Motor:** Google Agent Development Kit (ADK)
- **Modelo de lenguaje:** Gemini 2.5 Flash (Vertex AI)
- **RAG:** `gemini-embedding-001` (768 dimensiones) sobre `rag.business_chunks` (AlloyDB + pgvector)

### Herramientas disponibles (8)

El agente selecciona automáticamente la herramienta adecuada según el contexto de la pregunta:

| Herramienta | Tipo | Qué hace |
|-------------|------|----------|
| `buscar_conocimiento_negocio` | RAG vectorial | Consulta reglas, glosario y políticas internas indexadas |
| `listar_siniestros_mayor_riesgo` | SQL | Top N casos por score_final DESC |
| `explicar_siniestro(id)` | SQL | Detalle completo: score, alertas, documentos, proveedor |
| `analizar_proveedores_alertas` | SQL view | Ranking de proveedores por concentración de alertas |
| `listar_documentos_faltantes_casos_criticos` | SQL | Documentos incompletos en casos Rojo Alto |
| `listar_casos_cerca_inicio_poliza` | SQL | Siniestros en los primeros 90 días de vigencia |
| `listar_narrativas_similares` | SQL | Pares de reclamos con similitud textual alta |
| `generar_resumen_ejecutivo` | SQL multi | KPIs + hallazgos + recomendaciones del portafolio |

### Ingesta de documentos (PDF)

El sistema acepta peritajes en PDF mediante procesamiento multimodal:

```
PDF subido por el analista
    → Gemini multimodal (extracción de texto)
    → Chunking (800 palabras, 100 overlap)
    → Embedding con gemini-embedding-001 (768d)
    → Almacenamiento en rag.business_chunks
    → Consultable por el agente mediante leer_documento_peritaje(doc_id)
```

---

## 7. Trazabilidad y explicabilidad

Cada siniestro almacena en la base de datos:

```json
{
  "alertas_activadas": [
    "Siniestro ocurrido 3 días después del inicio de póliza (umbral: 90)",
    "Proveedor 'Norte Automotriz' figura en lista restrictiva",
    "Documentación declarada como incompleta"
  ],
  "reglas_criticas_activadas": ["RF-01", "RF-02", "RF-04"],
  "score_reglas": 75.0,
  "score_modelo_simulado": 50.0,
  "score_final": 65.0,
  "nivel_riesgo": "Amarillo Medio",
  "accion_sugerida": "Solicitar revisión supervisora antes de pagar"
}
```

El analista siempre puede ver:
- Qué reglas activaron el score
- Cuántos puntos aportó cada señal
- Qué documentos faltan
- Qué dijo el agente IA al preguntar por el caso

---

## 8. Limitaciones del prototipo

| Limitación | Impacto | Mitigación propuesta |
|-----------|---------|---------------------|
| `score_modelo_simulado` fijo en 50.0 para nuevos ingresos | Subestima o sobreestima el componente ML | Reemplazar con XGBoost entrenado con historial real |
| Dataset sintético de 1.027 siniestros | Sesgos posibles por generación artificial | Validar con datos reales anonimizados de la aseguradora |
| Sin módulo de red de relaciones | No detecta conexiones entre asegurados y proveedores a nivel de grafo | Añadir capa de graph analytics (Neo4j o AlloyDB Graph) |
| Embeddings en español genérico | RAG puede no capturar jerga técnica aseguradora | Fine-tuning del modelo de embeddings con documentos internos |
| Sin retroalimentación del analista | El modelo no aprende de las revisiones humanas | Implementar feedback loop: analista califica cada alerta |
| Falsos positivos no medidos en producción | Riesgo de alarma fatiga | Monitorear tasa de falsos positivos por regla y ajustar umbrales |

---

## 9. Infraestructura del modelo

```
Entrenamiento (offline):
  Dataset CSV → Python pandas → Feature engineering → XGBoost (simulado) → score exportado

Inferencia en tiempo real (< 1 segundo):
  POST /api/siniestros/evaluar
      → calcular_score() [reglas deterministas]
      → score_modelo_simulado [precalculado en dataset]
      → score_final = 0.6 × r + 0.4 × m
      → clasificar() [umbral fijo: 70/40]
      → persistir en AlloyDB
      → retornar EvaluacionResult con alertas

Base de datos:
  AlloyDB for PostgreSQL (GCP)
  Esquemas: claims.* · rag.* · app.*
  Extensión pgvector para búsqueda semántica (768d)
```

---

*FraudSweep · HackIAthon 2026 · Aseguradora del Sur*
