# Limitaciones y Consideraciones Éticas — FraudSweep

## Limitaciones técnicas del prototipo

| Limitación | Impacto | Mitigación propuesta |
|-----------|---------|---------------------|
| `score_modelo_simulado` fijo (50.0) para nuevos ingresos | Componente ML no varía según el caso real | Reemplazar con XGBoost entrenado con historial real de fraudes confirmados |
| Dataset sintético de 1.027 siniestros | Posibles sesgos introducidos por la generación artificial | Validar y calibrar con datos reales anonimizados de la aseguradora |
| Embeddings en español genérico | El RAG puede no capturar jerga técnica aseguradora específica | Fine-tuning del modelo de embeddings con documentos internos |
| Sin módulo de red de relaciones | No detecta conexiones entre asegurados y proveedores a nivel de grafo | Añadir graph analytics (AlloyDB Graph o Neo4j) |
| Sin feedback loop del analista | El sistema no aprende de las revisiones humanas | Implementar ciclo: analista califica alerta → modelo se actualiza |
| Falsos positivos no monitoreados en producción | Riesgo de alarma fatiga | Monitorear tasa por regla y ajustar umbrales dinámicamente |
| Similitud NLP precalculada | No evalúa nuevos siniestros contra el corpus en tiempo real | Calcular embeddings al ingresar cada nuevo siniestro y comparar en tiempo real |
| Sin módulo de auditoría de cambios | No hay log de quién cambió el estado de revisión | Añadir tabla de auditoría con usuario, timestamp y acción |

## Limitaciones éticas y legales

### Lo que el sistema NO hace

- ❌ **No acusa.** El sistema nunca emite una conclusión de fraude. Genera señales de riesgo para revisión.
- ❌ **No rechaza.** Ninguna alerta ni combinación de alertas produce un rechazo automático del siniestro.
- ❌ **No decide.** Las decisiones de pago, retención o escalamiento son exclusivamente humanas.
- ❌ **No usa datos personales reales.** Todo el dataset es sintético. Ningún registro corresponde a personas reales.
- ❌ **No emite conclusiones legales.** Las alertas son operativas, no tienen valor jurídico.

### Riesgos y mitigaciones

| Riesgo | Mitigación implementada |
|--------|------------------------|
| Confundir alerta con acusación | Lenguaje UI: "posible riesgo", "revisar", nunca "fraude confirmado" |
| Sesgo por ciudad o ramo | Variables de ramo documentadas; umbrales ajustables por ramo |
| Falsos positivos | Revisión humana obligatoria antes de cualquier acción |
| Uso fuera del alcance declarado | README y documentación especifican explícitamente el alcance |
| Dependencia de APIs externas (Gemini) | Sistema funciona sin agente para scoring básico; agente es complementario |

## Alcance declarado

**Incluye:**
- Análisis de siniestros individuales con score explicable
- Priorización de casos para revisión humana
- Consultas en lenguaje natural sobre el portafolio
- Flujo de revisión humana con asignación por especialidad

**No incluye:**
- Decisiones automáticas de pago o rechazo
- Acusaciones formales o conclusiones legales
- Procesamiento de datos personales reales
- Reemplazo del criterio del analista especializado

## Métricas de evaluación del modelo (dataset sintético)

Comparando la clasificación del sistema contra `etiqueta_fraude_simulada`:

| Métrica | Valor estimado |
|---------|---------------|
| Precision | ~0.78 |
| Recall | ~0.71 |
| F1-score | ~0.74 |
| Tasa de falsos positivos | ~22% |

> Estas métricas son orientativas sobre datos sintéticos. Un modelo productivo requiere validación con datos reales y monitoreo continuo de drift.
