# FraudIA Claims Assistant — Pitch Outline

## Slide 1: Problema
- Aseguradoras pierden 5-10% de primas por fraude en siniestros
- Analistas procesan 100+ casos/semana manualmente
- Patrones de fraude son sutiles y requieren cruzar múltiples fuentes
- El rechazo incorrecto daña la relación con el cliente

## Slide 2: Solución
FraudIA: sistema de apoyo a la decisión, no de acusación automática
- Score de riesgo explicable (verde / amarillo / rojo)
- Agente conversacional en lenguaje natural
- Base de conocimiento de reglas de negocio con RAG
- Dashboard ejecutivo en tiempo real

## Slide 3: Arquitectura
[Ver docs/arquitectura.md]

## Slide 4: Demo
1. Dashboard KPIs → mostrar distribución de casos
2. Tabla de siniestros → filtrar por Rojo Alto
3. Detalle de caso SIN-00003 → score + alertas + documentos
4. Chat: "¿Cuáles son los 10 siniestros con mayor riesgo?"
5. Chat: "¿Por qué SIN-00003 fue marcado como rojo?"
6. Chat: "Genera un resumen ejecutivo"

## Slide 5: Impacto esperado
- Priorización: analista atiende primero los casos de mayor riesgo
- Cobertura: 100% de siniestros son evaluados con el mismo criterio
- Trazabilidad: cada alerta es explicable y auditable
- Ética: sin acusaciones automáticas, sin rechazos sin revisión humana

## Slide 6: Google Cloud
- AlloyDB: PostgreSQL enterprise con búsqueda vectorial nativa
- Vertex AI: Gemini 2.5 Flash + embeddings gemini-embedding-001
- Cloud Run: despliegue serverless, escala a cero
- Google ADK: orquestación de herramientas del agente
- Secret Manager: gestión segura de credenciales

## Slide 7: Limitaciones y próximos pasos
- Datos sintéticos — requiere datos reales para validación
- Score necesita calibración con feedback del equipo antifraude
- Próximo: modelo ML real entrenado con etiquetas históricas
- Próximo: integración con sistema core de siniestros
