# Reto Aseguradora del Sur – Contexto y Objetivos del Prototipo FraudIA

**doc_id:** DOC-BUSINESS-001
**version:** hackathon_v1
**doc_type:** contexto_negocio
**categoría:** Contexto del Reto

> Este documento describe el contexto del hackathon, el problema que se busca resolver y los objetivos del prototipo FraudIA Claims Assistant.

---

## 1. Contexto del Hackathon

Aseguradora del Sur es una aseguradora con presencia en Ecuador que enfrenta un desafío creciente en la detección temprana de posibles irregularidades en siniestros. En el marco del hackathon hackIAthon, se planteó el reto de construir un sistema de inteligencia artificial que ayude a los equipos de antifraude y liquidación a priorizar casos que requieren revisión humana especializada.

El hackathon convoca a equipos de ingenieros, científicos de datos y expertos en seguros para presentar prototipos funcionales que demuestren:

- Capacidad de procesar y analizar grandes volúmenes de siniestros sintéticos
- Generación automatizada de alertas de riesgo con explicaciones trazables
- Integración de IA conversacional para facilitar consultas de analistas
- Despliegue en infraestructura de nube (Google Cloud)

---

## 2. El Problema: Fraude en Siniestros de Seguros

El fraude en siniestros representa uno de los mayores desafíos para la industria aseguradora a nivel mundial. En Ecuador, se estima que entre el 10% y el 15% de los siniestros reportados contienen algún tipo de irregularidad, desde inflación de montos hasta fabricación total del evento.

### Tipos de fraude más comunes en el mercado ecuatoriano

**Fraude oportunista:** El asegurado exagera un siniestro real para recibir una indemnización mayor a la que le corresponde. Por ejemplo, reportar daños adicionales que no ocurrieron en el accidente.

**Fraude organizado:** Redes de actores coordinados (asegurados, proveedores, ajustadores corruptos) que fabrican siniestros completos o inflan sistemáticamente los montos. Los talleres mecánicos y clínicas privadas son actores frecuentes en estas redes.

**Fraude de conveniencia:** Contratación de una póliza con conocimiento previo del siniestro. El caso más claro es el robo: el vehículo ya fue robado o vendido, y se contrata la póliza para cobrar el seguro.

**Fraude documental:** Alteración o falsificación de documentos como facturas, denuncias policiales, informes médicos o peritajes para justificar montos mayores o eventos que no ocurrieron.

### Impacto económico

El fraude en seguros incrementa el costo de las primas para todos los asegurados, erosiona la confianza en el sistema y genera pérdidas directas a las aseguradoras. La detección temprana y efectiva permite:

- Reducir pérdidas por pagos indebidos
- Priorizar la investigación de campo hacia casos de mayor probabilidad
- Generar deterrencia en actores con intención fraudulenta
- Proteger a los asegurados honestos de incrementos de prima injustificados

---

## 3. El Prototipo FraudIA Claims Assistant

FraudIA Claims Assistant es un sistema de inteligencia artificial diseñado para asistir a los analistas de siniestros y al equipo de antifraude en la identificación de casos que requieren revisión prioritaria.

### Qué hace el sistema

1. **Analiza siniestros sintéticos** aplicando 14 señales de riesgo y 7 reglas de negocio críticas.
2. **Calcula un score de riesgo** entre 0 y 100 para cada siniestro.
3. **Clasifica los casos** en un semáforo de tres niveles: Verde Bajo, Amarillo Medio y Rojo Alto.
4. **Explica las alertas activadas** de forma transparente y trazable.
5. **Permite consultas en lenguaje natural** mediante un agente conversacional basado en Gemini.
6. **Presenta dashboards y tablas** con KPIs, rankings de proveedores y detalle de casos.
7. **Indexa conocimiento de negocio** en una base vectorial para responder preguntas sobre reglas, procesos y terminología.

### Qué no hace el sistema

- **No acusa a ningún asegurado, proveedor o beneficiario de fraude confirmado.** El sistema genera alertas de revisión, no veredictos.
- **No rechaza automáticamente siniestros.** Toda decisión de negativa o pago es responsabilidad del analista humano.
- **No contiene datos personales reales.** Todos los datos son sintéticos y anonimizados.
- **No es un sistema de decisión autónoma.** Es una herramienta de apoyo a la decisión humana.

---

## 4. Usuarios Objetivo

### Analistas de Liquidación

Profesionales responsables de tramitar y aprobar o negar siniestros. Usan el sistema para:
- Ver la tabla de siniestros ordenada por score de riesgo
- Revisar el detalle de alertas activadas en un caso específico
- Consultar al agente conversacional sobre un siniestro particular
- Decidir qué casos escalar a la unidad de antifraude

### Investigadores de Antifraude

Especialistas en la detección e investigación de fraude. Usan el sistema para:
- Identificar patrones recurrentes en proveedores y asegurados
- Consultar rankings de proveedores con mayor concentración de alertas
- Analizar narrativas similares entre diferentes reclamos
- Generar reportes ejecutivos para jefatura

### Jefes de Siniestros y Antifraude

Directivos responsables de la gestión del área. Usan el sistema para:
- Ver KPIs de la cartera de siniestros en el dashboard
- Monitorear la distribución por nivel de riesgo
- Obtener resúmenes ejecutivos sobre los casos críticos
- Tomar decisiones de política basadas en datos

---

## 5. Arquitectura de Alto Nivel

El sistema FraudIA opera sobre tres capas principales:

**Capa de datos:** AlloyDB for PostgreSQL aloja las tablas relacionales de siniestros, pólizas, proveedores, documentos, asegurados y vehículos. También contiene la base vectorial de conocimiento de negocio (RAG).

**Capa de aplicación:** FastAPI expone los endpoints REST que alimentan al frontend. El agente Google ADK procesa las consultas en lenguaje natural utilizando tools específicas que ejecutan SQL parametrizado y búsqueda vectorial.

**Capa de presentación:** Next.js con Tailwind CSS y shadcn/ui presenta el dashboard, la tabla de siniestros, el detalle de casos, el ranking de proveedores y la interfaz de chat.

**Modelos de IA:** Gemini 2.5 Flash para el agente conversacional y gemini-embedding-001 para los embeddings del RAG.

---

## 6. Principios Fundamentales del Sistema

1. **Transparencia:** Cada alerta tiene una explicación, cada score tiene un desglose.
2. **Trazabilidad:** Los casos, scores, alertas y consultas quedan registrados en la base de datos.
3. **Responsabilidad humana:** El sistema asiste pero no decide. La decisión final siempre es del analista.
4. **Lenguaje de riesgo:** El sistema usa términos como "posible riesgo", "señal de alerta", "requiere revisión" y "caso para revisión humana".
5. **Privacidad:** Sin datos personales reales. Sin exposición de credenciales o llaves.
6. **Explicabilidad:** El agente menciona siempre las alertas activadas, el nivel de riesgo y la acción sugerida.

---

## 7. Métricas del Dataset Sintético

El sistema fue construido y validado sobre un dataset sintético de aproximadamente 1.000 siniestros con las siguientes características esperadas:

| Nivel | Porcentaje | Casos aproximados |
|---|---|---|
| Verde Bajo (0-39) | ~70% | ~700 |
| Amarillo Medio (40-69) | ~20% | ~200 |
| Rojo Alto (70-100) | ~10% | ~100 |

Estos porcentajes reflejan una distribución realista de la cartera de siniestros donde la mayoría son legítimos y solo una fracción concentra las señales de mayor riesgo.
