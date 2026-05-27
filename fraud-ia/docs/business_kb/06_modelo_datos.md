# Modelo de Datos – Tablas, Campos y Relaciones del Sistema FraudIA

**doc_id:** DOC-BUSINESS-006
**version:** hackathon_v1
**doc_type:** modelo_datos
**categoría:** Arquitectura de Datos
**fuente:** DOC-FRAUD-DATA-004

> Todos los datos en el sistema FraudIA son **sintéticos o anonimizados**. Ningún campo contiene información personal identificable real. Los identificadores son códigos generados aleatoriamente.

---

## 1. Arquitectura de Esquemas en AlloyDB

El sistema FraudIA usa tres esquemas en AlloyDB for PostgreSQL:

| Esquema | Propósito |
|---|---|
| `claims` | Datos de siniestros, pólizas, asegurados, vehículos, conductores, proveedores y documentos |
| `rag` | Base documental de conocimiento de negocio con embeddings vectoriales |
| `app` | Sesiones de chat, mensajes del agente y trazabilidad de tool calls |

---

## 2. Esquema claims – Tablas de Siniestros

### claims.siniestros – Tabla Principal

**descripción:** Tabla central del modelo. Un registro por siniestro reportado. Es la fuente principal de datos para el scoring y las alertas.
**keywords:** siniestro, tabla principal, ramo, cobertura, monto, fecha, estado, score, alerta, nivel de riesgo

| Campo | Tipo | Descripción |
|---|---|---|
| `id_siniestro` | TEXT (PK) | Identificador único del siniestro (ej: SIN-000123) |
| `id_poliza` | TEXT (FK) | Referencia a la póliza asociada |
| `id_asegurado` | TEXT (FK) | Referencia al asegurado (anónimo) |
| `id_vehiculo` | TEXT (FK) | Referencia al vehículo asegurado |
| `id_conductor` | TEXT (FK) | Referencia al conductor al momento del siniestro |
| `id_proveedor` | TEXT (FK) | Referencia al proveedor o beneficiario del pago |
| `ramo` | TEXT | Categoría del seguro: Vehículos, Salud, Vida, Generales, Hogar |
| `cobertura` | TEXT | Tipo de cobertura: Choque, Robo, PTxRB, RC, Volcadura, etc. |
| `ciudad` | TEXT | Ciudad donde ocurrió el siniestro |
| `sucursal` | TEXT | Sucursal de la aseguradora que tramita el caso |
| `estado` | TEXT | Estado del siniestro: Reserva, Pago Total, Pago Parcial, Negativa, Cierre |
| `fecha_ocurrencia` | DATE | Fecha en que ocurrió el evento asegurado |
| `fecha_reporte` | DATE | Fecha en que el asegurado notificó a la aseguradora |
| `monto_reclamado` | NUMERIC(14,2) | Monto solicitado por el asegurado o proveedor |
| `monto_estimado` | NUMERIC(14,2) | Monto estimado por la aseguradora en el peritaje |
| `monto_pagado` | NUMERIC(14,2) | Monto efectivamente desembolsado |
| `suma_asegurada` | NUMERIC(14,2) | Valor máximo cubierto por la póliza |
| `descripcion` | TEXT | Narrativa libre del siniestro. Usada en análisis NLP |
| `documentos_completos` | BOOLEAN | Indica si se entregaron todos los documentos obligatorios |
| `dias_desde_inicio_poliza` | INTEGER | Días entre inicio de vigencia y fecha de ocurrencia (campo derivado) |
| `dias_desde_fin_poliza` | INTEGER | Días entre fecha de ocurrencia y fin de vigencia (campo derivado) |
| `dias_entre_ocurrencia_reporte` | INTEGER | Días entre ocurrencia y reporte (campo derivado) |
| `historial_siniestros_asegurado` | INTEGER | Número de siniestros del asegurado en los últimos 18 meses |
| `historial_siniestros_vehiculo` | INTEGER | Número de siniestros del vehículo en los últimos 18 meses |
| `historial_siniestros_conductor` | INTEGER | Número de siniestros del conductor en los últimos 18 meses |
| `score_reglas` | NUMERIC(5,2) | Score calculado por las señales de riesgo (0-100) |
| `score_modelo_simulado` | NUMERIC(5,2) | Score del modelo de ML simulado (0-100) |
| `score_final` | NUMERIC(5,2) | Score final combinado: 0.6×reglas + 0.4×modelo (0-100) |
| `nivel_riesgo` | TEXT | Verde Bajo / Amarillo Medio / Rojo Alto |
| `alertas_activadas` | JSONB | Lista de alertas activas con código, descripción y puntos |
| `reglas_criticas_activadas` | JSONB | Lista de reglas críticas activas (RF-01 a RF-07) |
| `accion_sugerida` | TEXT | Acción recomendada según el nivel de riesgo |
| `etiqueta_fraude_simulada` | INTEGER | 0/1 para entrenamiento supervisado (solo en dataset sintético) |
| `created_at` | TIMESTAMP | Fecha de registro en el sistema |

**Índices clave:**
- `idx_siniestros_score_final` en `score_final DESC` (para ordenar por riesgo)
- `idx_siniestros_nivel_riesgo` en `nivel_riesgo`
- `idx_siniestros_proveedor` en `id_proveedor`
- `idx_siniestros_asegurado` en `id_asegurado`
- `idx_siniestros_alertas_gin` usando GIN en `alertas_activadas` (búsqueda en JSON)
- `idx_siniestros_descripcion_trgm` usando GIN trigram en `descripcion` (búsqueda de texto)

---

### claims.polizas – Pólizas

**descripción:** Información de las pólizas contratadas. Permite cruzar vigencia y condiciones con los siniestros.
**keywords:** póliza, vigencia, prima, suma asegurada, deducible, inicio, fin, canal

| Campo | Tipo | Descripción |
|---|---|---|
| `id_poliza` | TEXT (PK) | Identificador único de la póliza |
| `id_asegurado` | TEXT (FK) | Referencia al asegurado |
| `ramo` | TEXT | Ramo del seguro |
| `fecha_inicio` | DATE | Inicio de la vigencia de la póliza |
| `fecha_fin` | DATE | Fin de la vigencia de la póliza |
| `prima` | NUMERIC(14,2) | Prima anual o periódica |
| `suma_asegurada` | NUMERIC(14,2) | Valor máximo cubierto |
| `deducible` | NUMERIC(14,2) | Monto deducible aplicable |
| `canal_venta` | TEXT | Canal de venta: Directo, Agente, Broker, Digital |
| `ciudad` | TEXT | Ciudad de emisión de la póliza |
| `estado_poliza` | TEXT | Activa, Vencida, Cancelada, Suspendida |

---

### claims.proveedores – Proveedores y Beneficiarios

**descripción:** Talleres mecánicos, clínicas, peritos y otros prestadores asociados a siniestros. Clave para detectar redes de fraude organizado.
**keywords:** proveedor, taller, clínica, perito, lista restrictiva, monto promedio, alertas, red, concentración

| Campo | Tipo | Descripción |
|---|---|---|
| `id_proveedor` | TEXT (PK) | Identificador único del proveedor |
| `nombre_proveedor` | TEXT | Nombre del proveedor (sintético) |
| `tipo` | TEXT | Tipo: Taller, Clínica, Perito, Otro |
| `ciudad` | TEXT | Ciudad de operación |
| `reclamos_asociados` | INTEGER | Total de siniestros donde apareció |
| `monto_promedio_reclamado` | NUMERIC(14,2) | Monto promedio reclamado en sus casos |
| `porcentaje_casos_observados` | NUMERIC(6,2) | Porcentaje de sus casos con alertas activas |
| `en_lista_restrictiva` | BOOLEAN | Aparece en la Lista Restrictiva |
| `antiguedad_meses` | INTEGER | Meses en el registro de la aseguradora |

---

### claims.documentos – Documentos del Siniestro

**descripción:** Registro de documentos asociados a cada siniestro. Incluye indicadores de calidad e inconsistencias para detección de adulteración documental.
**keywords:** documento, denuncia, factura, informe, inconsistencia, legible, fecha, alteración

| Campo | Tipo | Descripción |
|---|---|---|
| `id_documento` | TEXT (PK) | Identificador único del documento |
| `id_siniestro` | TEXT (FK) | Referencia al siniestro asociado |
| `tipo_documento` | TEXT | Denuncia, Factura, Informe, Fotografía, Otro |
| `entregado` | BOOLEAN | Si fue entregado por el asegurado |
| `legible` | BOOLEAN | Si el documento es legible |
| `fecha_emision` | DATE | Fecha del documento (clave para detectar alteración) |
| `inconsistencia_detectada` | BOOLEAN | Marcado por sistema o analista |
| `observacion` | TEXT | Texto libre con la observación del analista |

**Señal de alerta clave:** Si `fecha_emision < siniestros.fecha_ocurrencia`, puede indicar que el documento fue preparado antes del evento (fraude documental).

---

### claims.asegurados – Perfiles de Asegurados

**descripción:** Perfiles sintéticos y anonimizados de asegurados. Sin datos personales reales. Permite análisis de comportamiento histórico.
**keywords:** asegurado, perfil sintético, segmento, antigüedad, reclamos, lista restrictiva, mora

| Campo | Tipo | Descripción |
|---|---|---|
| `id_asegurado` | TEXT (PK) | Identificador anónimo |
| `segmento` | TEXT | Natural o Jurídico |
| `antiguedad_meses` | INTEGER | Meses como cliente de la aseguradora |
| `ciudad` | TEXT | Ciudad de residencia |
| `numero_polizas` | INTEGER | Número de pólizas activas |
| `reclamos_ultimos_12_meses` | INTEGER | Siniestros reportados en los últimos 12 meses |
| `mora_actual` | BOOLEAN | Si tiene mora en el pago de primas |
| `score_cliente_simulado` | NUMERIC(6,2) | Score interno del cliente (sintético) |

---

### claims.vehiculos – Vehículos Asegurados

**descripción:** Información de los vehículos asegurados. Los datos de identificación están hacheados para proteger la privacidad.
**keywords:** vehículo, placa, chasis, motor, marca, modelo, año

| Campo | Tipo | Descripción |
|---|---|---|
| `id_vehiculo` | TEXT (PK) | Identificador único del vehículo |
| `placa_hash` | TEXT | Placa del vehículo (hacheada) |
| `marca` | TEXT | Marca del vehículo |
| `modelo` | TEXT | Modelo del vehículo |
| `anio` | INTEGER | Año de fabricación |
| `chasis_hash` | TEXT | Número de chasis (hacheado) |
| `motor_hash` | TEXT | Número de motor (hacheado) |
| `ciudad` | TEXT | Ciudad de registro |

---

### claims.conductores – Conductores

**descripción:** Conductores asociados a los siniestros. Sin datos de identificación real.
**keywords:** conductor, edad, antigüedad licencia, historial, siniestros

| Campo | Tipo | Descripción |
|---|---|---|
| `id_conductor` | TEXT (PK) | Identificador anónimo |
| `edad` | INTEGER | Edad del conductor |
| `genero_simulado` | TEXT | Género (sintético, para análisis estadístico) |
| `ciudad` | TEXT | Ciudad de residencia |
| `siniestros_ultimos_18_meses` | INTEGER | Siniestros en los últimos 18 meses |
| `antiguedad_licencia_meses` | INTEGER | Meses con licencia de conducir |

---

### claims.narrativas_similares – Similitudes entre Narrativas

**descripción:** Tabla de similitud textual entre pares de siniestros. Calculada con TF-IDF y similitud coseno.
**keywords:** narrativa, similitud, NLP, texto, clonado, fraude organizado

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | BIGSERIAL (PK) | Identificador interno |
| `id_siniestro_a` | TEXT | Primer siniestro del par |
| `id_siniestro_b` | TEXT | Segundo siniestro del par |
| `similitud` | NUMERIC(6,4) | Similitud coseno (0.0 a 1.0) |
| `metodo` | TEXT | Método usado: tfidf_cosine |

---

## 3. Esquema rag – Base de Conocimiento Vectorial

### rag.business_documents – Documentos de Negocio

**descripción:** Registro de los documentos de conocimiento de negocio indexados para RAG.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | BIGSERIAL (PK) | Identificador interno |
| `source_name` | TEXT | Nombre del archivo fuente |
| `title` | TEXT | Título del documento |
| `doc_type` | TEXT | Tipo: reglas_negocio, glosario, proceso, etc. |
| `version` | TEXT | Versión del documento |
| `created_at` | TIMESTAMP | Fecha de indexación |

### rag.business_chunks – Fragmentos con Embeddings

**descripción:** Fragmentos de texto de los documentos de negocio, con sus embeddings vectoriales para búsqueda semántica.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | BIGSERIAL (PK) | Identificador interno |
| `document_id` | BIGINT (FK) | Referencia al documento padre |
| `source_name` | TEXT | Nombre del archivo fuente |
| `title` | TEXT | Título del documento |
| `section` | TEXT | Sección o subtítulo del fragmento |
| `doc_type` | TEXT | Tipo de documento |
| `chunk_index` | INTEGER | Índice del fragmento dentro del documento |
| `chunk_text` | TEXT | Texto del fragmento (900-1200 caracteres) |
| `metadata` | JSONB | Metadatos adicionales |
| `embedding` | vector(768) | Embedding generado por gemini-embedding-001 |
| `created_at` | TIMESTAMP | Fecha de generación del embedding |

**Búsqueda vectorial:**
```sql
SELECT source_name, title, section, chunk_text,
       embedding <=> :query_embedding AS distance
FROM rag.business_chunks
WHERE embedding IS NOT NULL
ORDER BY embedding <=> :query_embedding
LIMIT :top_k;
```

---

## 4. Esquema app – Sesiones y Trazabilidad

### app.chat_sessions – Sesiones de Chat

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | BIGSERIAL (PK) | Identificador interno |
| `session_id` | TEXT (UNIQUE) | Identificador de la sesión (ej: demo-001) |
| `user_label` | TEXT | Etiqueta del usuario (opcional) |
| `created_at` | TIMESTAMP | Inicio de la sesión |

### app.chat_messages – Mensajes del Agente

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | BIGSERIAL (PK) | Identificador interno |
| `session_id` | TEXT | Referencia a la sesión |
| `role` | TEXT | user o assistant |
| `content` | TEXT | Contenido del mensaje |
| `tools_used` | JSONB | Lista de tools llamadas en ese turno |
| `citations` | JSONB | Fuentes consultadas (SQL views, RAG chunks) |
| `created_at` | TIMESTAMP | Fecha y hora del mensaje |

### app.agent_tool_calls – Trazabilidad de Tools

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | BIGSERIAL (PK) | Identificador interno |
| `session_id` | TEXT | Referencia a la sesión |
| `tool_name` | TEXT | Nombre de la tool llamada |
| `input_payload` | JSONB | Parámetros de entrada de la tool |
| `output_summary` | JSONB | Resumen del resultado de la tool |
| `latency_ms` | INTEGER | Tiempo de ejecución en milisegundos |
| `created_at` | TIMESTAMP | Fecha y hora del tool call |

---

## 5. Relaciones entre Tablas

```
claims.siniestros ──── id_poliza ────────→ claims.polizas
claims.siniestros ──── id_asegurado ─────→ claims.asegurados
claims.siniestros ──── id_vehiculo ──────→ claims.vehiculos
claims.siniestros ──── id_conductor ─────→ claims.conductores
claims.siniestros ──── id_proveedor ─────→ claims.proveedores
claims.siniestros ──── id_siniestro ─────→ claims.documentos (1:N)
claims.polizas    ──── id_asegurado ─────→ claims.asegurados
rag.business_chunks ── document_id ──────→ rag.business_documents
```

---

## 6. Vistas Materializadas

### claims.v_kpis

Devuelve los KPIs de la cartera de siniestros: totales por nivel, montos y score promedio.

### claims.v_provider_risk

Devuelve el ranking de proveedores con mayor concentración de alertas rojas, incluyendo número de casos por nivel y monto total reclamado.

### claims.v_siniestros_enriched

Devuelve la tabla de siniestros enriquecida con datos de proveedor y póliza, para facilitar las consultas del frontend y el agente.

---

## 7. Campos Derivados Clave para el Scoring

| Campo derivado | Fórmula | Señales que activa |
|---|---|---|
| `dias_desde_inicio_poliza` | `fecha_ocurrencia - polizas.fecha_inicio` | SIG-001, RF-05 |
| `dias_desde_fin_poliza` | `polizas.fecha_fin - fecha_ocurrencia` | SIG-001, RF-05 |
| `dias_entre_ocurrencia_reporte` | `fecha_reporte - fecha_ocurrencia` | SIG-002, SIG-012, RF-06 |
| `historial_siniestros_asegurado` | COUNT siniestros del mismo asegurado en 18 meses | SIG-003 |
| `historial_siniestros_vehiculo` | COUNT siniestros del mismo vehículo en 18 meses | SIG-006 |
| `historial_siniestros_conductor` | COUNT siniestros del mismo conductor en 18 meses | SIG-004 |
| `similitud_narrativa` | cosine_similarity(descripcion, corpus) | SIG-005, RF-07 |
