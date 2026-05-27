# Script de Demo para el Jurado – FraudIA Claims Assistant

**doc_id:** DOC-BUSINESS-009
**version:** hackathon_v1
**doc_type:** script_demo
**categoría:** Presentación al Jurado

> Este documento es el guión oficial para la demostración del sistema FraudIA ante el jurado del hackathon. Incluye el flujo de navegación, las preguntas de demo y los puntos clave de la argumentación técnica y de negocio.

---

## 1. Presentación Inicial (2 minutos)

### Gancho de apertura

"Aseguradora del Sur procesa miles de siniestros al mes. Sin herramientas de apoyo, un analista revisa cada caso de forma manual, sin visibilidad sobre cuáles son los más urgentes. El resultado: casos de alto riesgo se procesan junto con casos normales, y los fraudes organizados pasan desapercibidos hasta que el daño ya está hecho."

"FraudIA Claims Assistant es nuestra respuesta: un sistema de detección de posibles irregularidades que prioriza los casos de mayor riesgo, explica cada alerta y permite consultas en lenguaje natural. En los próximos minutos les vamos a mostrar cómo funciona."

### Principio fundamental que debe quedar claro desde el inicio

"Antes de comenzar, un principio que es no negociable en nuestro sistema: FraudIA nunca acusa a nadie de fraude. Nunca rechaza un siniestro automáticamente. El sistema genera alertas de revisión. La decisión final siempre es humana."

---

## 2. Recorrido por el Dashboard (3 minutos)

### Navegar a /dashboard

**Lo que mostrar:**
- Panel de KPIs: total de siniestros, distribución por semáforo, montos
- Gráfico de distribución verde/amarillo/rojo
- Top 5 proveedores con más alertas rojas
- Top 10 siniestros por score

**Lo que decir:**
"Este es el dashboard ejecutivo. De un vistazo, el jefe de antifraude puede ver cuántos casos requieren atención inmediata, cuánto monto hay en riesgo y qué proveedores concentran las mayores alertas."

"Vemos que aproximadamente el 10% de los siniestros son Rojo Alto. Eso no significa que todos sean fraude. Significa que todos requieren revisión especializada antes de que se procese el pago."

**Puntos a destacar:**
- El score promedio de la cartera
- El monto reclamado en casos Rojo versus el total
- Los proveedores del top 5 (señalar si alguno está en Lista Restrictiva)

---

## 3. Exploración de la Tabla de Siniestros (2 minutos)

### Navegar a /siniestros

**Lo que mostrar:**
- Tabla ordenada por score descendente
- Aplicar filtro "Rojo Alto"
- Mostrar las alertas principales de los primeros 3 casos

**Lo que decir:**
"Esta es la cola de trabajo del analista. Empieza con los casos más urgentes. Cada fila muestra las alertas principales que activaron el nivel Rojo: en este caso, vemos que el primer siniestro tiene cobertura PTxRB, alta frecuencia del asegurado y proveedor en Lista Restrictiva."

"El analista no necesita recordar las reglas de memoria. El sistema las aplica automáticamente y las explica en términos de negocio."

---

## 4. Detalle de un Caso Rojo (3 minutos)

### Abrir el siniestro de mayor score

**Lo que mostrar:**
- El score final y su desglose (score de reglas + score del modelo)
- Las alertas activadas con sus puntos
- Las reglas críticas activas
- El estado de los documentos
- La acción sugerida

**Lo que decir:**
"Aquí está el caso más crítico de la cartera. Veamos por qué."

"La primera alerta es RF-01: la cobertura es PTxRB, Pérdida Total por Robo. Esta regla sola ya clasifica el caso como Rojo automáticamente, independientemente del score numérico."

"Además tiene SIG-003 activo: el asegurado tiene múltiples siniestros en los últimos 18 meses. Y SIG-002: la denuncia se presentó varios días después del robo, cuando normalmente se denuncia en las primeras 24 horas."

"En documentos, vemos que falta la verificación del peritaje. Con toda esta información, el sistema sugiere: Escalar inmediatamente a Unidad Antifraude."

**Importante decir:** "Esto no significa que el caso sea fraude. Significa que antes de pagar, un investigador especializado debe revisar el caso en campo."

### Hacer clic en "Explicar con IA"

Esto abre el chat con la pregunta preconfigurada sobre el siniestro.

---

## 5. Demo del Chat FraudIA (5-6 minutos)

### Navegar a /chat

"Aquí está el componente más innovador: el agente conversacional. Cualquier analista puede hacer preguntas en español sobre los casos, las reglas y los proveedores, y el agente responde usando datos reales de la base de datos."

### Pregunta 1: Los 10 siniestros con mayor riesgo

**Ingresar en el chat:**
"¿Cuáles son los 10 siniestros con mayor riesgo?"

**Lo que esperar:** El agente llama a la tool `listar_siniestros_mayor_riesgo`, obtiene los datos y presenta la lista con scores, niveles y alertas principales.

**Lo que decir:** "El agente decidió usar su herramienta SQL para consultar la base de datos. Pueden ver que muestra las herramientas usadas y las fuentes. No hay alucinación: todo viene de datos reales."

---

### Pregunta 2: Explicación de un siniestro específico

**Ingresar en el chat:**
"¿Por qué el siniestro [ID del caso rojo] fue marcado como Rojo?"

**Lo que esperar:** El agente llama a `explicar_siniestro` (SQL) y luego a `buscar_conocimiento_negocio` (RAG) para complementar con las reglas de negocio.

**Lo que decir:** "Aquí el agente usa dos herramientas: primero consulta la base de datos para obtener el detalle del caso, y luego busca en el conocimiento de negocio la explicación de cada regla. Es una combinación de SQL y RAG."

---

### Pregunta 3: Proveedores con más alertas

**Ingresar en el chat:**
"¿Qué proveedores concentran más alertas rojas?"

**Lo que esperar:** El agente llama a `analizar_proveedores_alertas` y devuelve el ranking con casos rojos, amarillos y monto total.

**Lo que decir:** "Esta pregunta es clave para identificar redes de fraude. Si un proveedor tiene el 60% de sus casos en Rojo, eso es una señal seria que justifica una auditoría de ese proveedor."

---

### Pregunta 4: Documentos faltantes en casos críticos

**Ingresar en el chat:**
"¿Qué documentos faltan en los casos críticos?"

**Lo que esperar:** El agente llama a `listar_documentos_faltantes_casos_criticos` y lista los documentos pendientes en casos Rojo.

**Lo que decir:** "El analista puede ver de inmediato qué solicitar a cada asegurado para avanzar en los casos críticos. Esto reduce el tiempo de tramitación."

---

### Pregunta 5: Siniestros cerca del inicio de póliza

**Ingresar en el chat:**
"¿Qué siniestros ocurrieron cerca del inicio de la póliza?"

**Lo que esperar:** El agente llama a `listar_casos_cerca_inicio_poliza` y devuelve los casos con `dias_desde_inicio_poliza` menor a 30.

**Lo que decir:** "Este es el patrón clásico de fraude de conveniencia: contratar la póliza sabiendo que ya hay un siniestro. El sistema identifica automáticamente estos casos."

---

### Pregunta 6: Qué significa riesgo Amarillo (RAG puro)

**Ingresar en el chat:**
"¿Qué significa riesgo Amarillo?"

**Lo que esperar:** El agente usa `buscar_conocimiento_negocio` (RAG) para buscar en los documentos de negocio y explica el nivel Amarillo con la rúbrica del score.

**Lo que decir:** "Esta es una pregunta de negocio, no de datos. El agente busca en la base de conocimiento en lugar de en la base de datos. Ve las fuentes: viene del documento de rúbrica del score."

---

### Pregunta 7: Limitaciones éticas del sistema

**Ingresar en el chat:**
"¿Qué limitaciones éticas tiene el modelo?"

**Lo que esperar:** El agente busca en RAG y devuelve los principios éticos del sistema.

**Lo que decir:** "Esta es una pregunta que creemos que el jurado va a hacer. Y tenemos la respuesta lista: el sistema tiene sus limitaciones documentadas y el agente las conoce."

---

### Pregunta 8: Resumen ejecutivo

**Ingresar en el chat:**
"Genera un resumen ejecutivo de los casos críticos."

**Lo que esperar:** El agente llama a `generar_resumen_ejecutivo` que combina KPIs, top proveedores y hallazgos principales.

**Lo que decir:** "El jefe de antifraude puede pedir este resumen al final del día sin necesidad de construir un reporte manualmente. El agente lo genera en segundos."

---

### Pregunta 9: Detección de narrativas similares

**Ingresar en el chat:**
"¿Cómo detectan narrativas similares entre reclamos?"

**Lo que esperar:** El agente explica el método TF-IDF coseno usando el conocimiento de negocio del RAG.

**Lo que decir:** "Esta es la pregunta técnica clásica del jurado. El sistema usa NLP para detectar descripciones copiadas entre reclamos de distintos asegurados. Es una señal de fraude organizado."

---

### Pregunta 10: Diferencia entre score de reglas y score del modelo

**Ingresar en el chat:**
"¿Cuál es la diferencia entre el score de reglas y el score del modelo?"

**Lo que esperar:** El agente explica la fórmula: 60% reglas determinísticas + 40% modelo simulado.

**Lo que decir:** "El componente de reglas es 100% explicable: se puede decir exactamente qué señal sumó cuántos puntos. El modelo complementa con patrones más complejos. La combinación da mejor cobertura que cualquiera de los dos por separado."

---

### Pregunta 11: Recomendación de casos para revisar primero

**Ingresar en el chat:**
"Recomienda qué casos debería revisar primero el analista."

**Lo que esperar:** El agente combina SQL (top casos por score) con RAG (criterios de priorización) para dar una recomendación fundamentada.

---

### Pregunta 12: Patrones en reclamos sospechosos

**Ingresar en el chat:**
"¿Qué patrones se repiten en los reclamos con mayor score de riesgo?"

**Lo que esperar:** El agente analiza los datos y describe los patrones más frecuentes: coberturas, proveedores recurrentes, temporalidad.

---

## 6. Vista de Proveedores (1 minuto)

### Navegar a /proveedores

**Lo que mostrar:**
- Tabla de proveedores ordenada por número de casos Rojo
- Proveedor con más alertas en primer lugar
- Columnas: nombre, tipo, ciudad, total casos, casos rojos, score promedio, monto total

**Lo que decir:**
"Esta vista permite identificar rápidamente qué proveedores concentran irregularidades. Un proveedor con 60% de sus casos en Rojo merece una auditoría independiente, más allá de los siniestros individuales."

---

## 7. Explicación de la Arquitectura (2 minutos)

### Navegar a /arquitectura

"La arquitectura está diseñada sobre Google Cloud con componentes completamente gestionados."

**Puntos clave a mencionar:**

**AlloyDB for PostgreSQL:**
- Base de datos relacional con extensión vector para búsqueda semántica
- Tres esquemas: claims (siniestros), rag (conocimiento), app (sesiones)
- Índices especializados: GIN para JSONB y trigram para texto

**Gemini en Vertex AI:**
- gemini-2.5-flash para el agente conversacional
- gemini-embedding-001 con dimensión 768 para embeddings RAG
- Sin modelos propios: usamos la IA de Google directamente

**Google ADK:**
- El agente tiene 7 tools especializadas
- Decide autónomamente entre SQL, RAG o combinación
- El razonamiento es trazable: se puede ver qué herramientas usó y por qué

**Cloud Run:**
- API FastAPI desplegada como servicio fraudia-api
- Frontend Next.js desplegado como servicio fraudia-web
- Direct VPC Egress para conectividad privada con AlloyDB

---

## 8. Cierre y Diferenciadores Clave

### Los 5 diferenciadores de FraudIA

1. **Explicabilidad total del score:** Cada punto está justificado. El analista sabe exactamente por qué un caso es Rojo.

2. **Agente conversacional en español:** No es un dashboard estático. El analista puede preguntar en lenguaje natural y obtener respuestas contextualizadas.

3. **RAG sobre conocimiento de negocio:** El agente conoce las reglas, el glosario, el proceso y las limitaciones éticas del sistema. Responde preguntas de negocio, no solo de datos.

4. **Ética integrada:** El sistema nunca acusa. Genera alertas de revisión. Esta es una decisión de diseño, no un parche de último momento.

5. **Infraestructura de producción real:** No es un prototipo en Jupyter. Es una API en FastAPI, un frontend en Next.js y una base de datos AlloyDB, todo en Google Cloud Run. Se puede desplegar hoy.

### Frase de cierre

"FraudIA no reemplaza al analista. Le da superpoderes: visibilidad sobre toda la cartera, priorización automática de los casos más urgentes y un asistente que conoce las reglas de negocio tan bien como el mejor analista del equipo. Y todo con un principio inquebrantable: la decisión final siempre es humana."

---

## 9. Preguntas Frecuentes del Jurado y Respuestas Preparadas

**"¿Cómo miden la precisión del modelo?"**
El sistema tiene una etiqueta sintética `etiqueta_fraude_simulada` en el dataset que permite calcular métricas de clasificación (precision, recall, F1). En producción, la precisión se mediría con los resultados de las investigaciones de campo realizadas por la Unidad Antifraude.

**"¿Qué pasa si el analista no confía en el score?"**
El score es una recomendación, no una orden. El analista puede elevar o bajar manualmente el nivel de un caso y documentar el motivo. El sistema registra ambas decisiones para auditoría.

**"¿Cómo protegen los datos de los asegurados?"**
En la demo usamos datos 100% sintéticos. En producción, los identificadores serían hacheados, el acceso sería controlado con roles y el sistema cumpliría la LOPDP de Ecuador.

**"¿El agente puede alucinar?"**
El agente usa tools que ejecutan SQL parametrizado y búsqueda vectorial. Para preguntas de datos, no puede inventar resultados: los datos vienen de AlloyDB. Para preguntas de conocimiento, usa el RAG sobre documentos controlados. Las alucinaciones son muy improbables en el dominio definido, pero advertimos que el usuario siempre debe verificar datos críticos.

**"¿Escala a millones de siniestros?"**
AlloyDB escala horizontalmente. Cloud Run escala automáticamente según la demanda. La arquitectura está diseñada para producción, no solo para el hackathon.

**"¿Cuánto cuesta operar el sistema?"**
Para el volumen del hackathon (1.000 siniestros), el costo de infraestructura es mínimo. Para una cartera de 100.000 siniestros al año con consultas frecuentes de chat, el costo estimado es de $500-$2.000 USD al mes en Google Cloud, dependiendo del uso de Vertex AI.

**"¿Por qué AlloyDB y no Cloud SQL o BigQuery?"**
AlloyDB soporta natively la extensión `vector` para búsqueda semántica con pgvector, y la extensión `alloydb_scann` para índices vectoriales de alta velocidad. También tiene integración nativa con Vertex AI mediante `google_ml_integration` para calcular embeddings dentro de la base de datos. Esta combinación es única en el ecosistema de Google Cloud para este tipo de caso de uso.

---

## 10. Estadísticas Clave para Mencionar en la Demo

Tener estos números disponibles en el dashboard durante la presentación:

| Estadística | Valor |
|---|---|
| Total de siniestros en el dataset | ~1.000 |
| Casos Rojo Alto | ~10% (~100 casos) |
| Casos Amarillo Medio | ~20% (~200 casos) |
| Casos Verde Bajo | ~70% (~700 casos) |
| Documentos de negocio indexados en RAG | 9 |
| Señales de riesgo del sistema | 14 (SIG-001 a SIG-014) |
| Reglas críticas | 7 (RF-01 a RF-07) |
| Tools del agente | 7 |
| Peso del score de reglas | 60% |
| Peso del score del modelo | 40% |
| Score mínimo para Rojo (por score) | 70 puntos |
| Score mínimo para Amarillo (por score) | 40 puntos |

---

## 11. Checklist de Preparación Pre-Demo

Verificar antes de la presentación al jurado:

- La API responde en /health con status 200
- El dashboard muestra KPIs (no ceros ni errores)
- La tabla de siniestros carga con datos reales
- El filtro Rojo Alto muestra casos con score alto
- El detalle de al menos un caso Rojo muestra alertas completas
- El chat responde correctamente a "¿Cuáles son los 10 siniestros con mayor riesgo?"
- El chat responde a "¿Qué significa riesgo Amarillo?" usando RAG
- La vista de proveedores muestra el ranking correctamente
- El resumen ejecutivo se genera sin errores
- La página de arquitectura carga correctamente
