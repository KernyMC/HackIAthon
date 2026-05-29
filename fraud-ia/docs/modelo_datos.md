# Modelo de Datos — FraudSweep

## Diagrama de relaciones

```
claims.polizas ──────────┐
                         │ id_poliza
claims.asegurados ───────┤
                         │ id_asegurado
claims.vehiculos ────────┤
                         │ id_vehiculo          claims.documentos
claims.conductores ──────┤                      id_documento
                         │ id_conductor         id_siniestro (FK)
claims.proveedores ──────┼──► claims.siniestros ◄────────────────
                           id_proveedor         tipo_documento
                                │               entregado / legible
                                │               inconsistencia
                                ▼
                    claims.narrativas_similares
                    id_siniestro_a / id_siniestro_b
                    similitud_coseno_simulada

app.revisores ──────────────────────────────────────────────────
  id_revisor ◄── claims.siniestros.id_revisor_asignado
```

---

## Tablas por esquema

### Esquema `claims`

#### `claims.siniestros` (tabla principal — 51 columnas)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_siniestro` | VARCHAR PK | Identificador único (ej. `SIN-00001`, `SIN-EVAL-A1B2C3`) |
| `id_poliza` | VARCHAR FK | Referencia a `claims.polizas` |
| `id_asegurado` | VARCHAR FK | Referencia a `claims.asegurados` |
| `id_vehiculo` | VARCHAR FK | Referencia a `claims.vehiculos` |
| `id_conductor` | VARCHAR FK | Referencia a `claims.conductores` |
| `id_proveedor` | VARCHAR FK | Referencia a `claims.proveedores` |
| `ramo` | VARCHAR | Vehículos, Salud, Vida, Hogar, RC, Robo |
| `cobertura` | VARCHAR | Tipo de cobertura (choque, robo, atención médica…) |
| `ciudad` | VARCHAR | Ciudad del siniestro |
| `sucursal` | VARCHAR | Sucursal que gestiona el caso |
| `estado` | VARCHAR | Reserva, Pago Total, Pago Parcial, Negativa… |
| `fecha_ocurrencia` | DATE | Fecha del evento |
| `fecha_reporte` | DATE | Fecha de notificación a la aseguradora |
| `monto_reclamado` | NUMERIC | Monto solicitado (USD) |
| `monto_estimado` | NUMERIC | Valor estimado por la aseguradora |
| `monto_pagado` | NUMERIC | Valor pagado (si aplica) |
| `suma_asegurada` | NUMERIC | Cobertura máxima de la póliza |
| `descripcion` | TEXT | Texto libre del relato del siniestro |
| `documentos_completos` | BOOLEAN | Si el expediente está completo |
| `dias_desde_inicio_poliza` | INTEGER | Antigüedad de póliza al momento del siniestro |
| `dias_desde_fin_poliza` | INTEGER | Días hasta fin de vigencia |
| `dias_entre_ocurrencia_reporte` | INTEGER | Demora en denuncia |
| `historial_siniestros_asegurado` | INTEGER | Siniestros previos del asegurado (18 meses) |
| `historial_siniestros_vehiculo` | INTEGER | Siniestros previos del vehículo (18 meses) |
| `historial_siniestros_conductor` | INTEGER | Siniestros previos del conductor (18 meses) |
| `proveedor_en_lista_restrictiva` | BOOLEAN | Si el proveedor está en lista de observados |
| `score_reglas` | NUMERIC | Score calculado por reglas de negocio (0–100) |
| `score_modelo_simulado` | NUMERIC | Score del clasificador ML (0–100) |
| `score_final` | NUMERIC | `0.6 × score_reglas + 0.4 × score_modelo` |
| `nivel_riesgo` | VARCHAR | Verde Bajo / Amarillo Medio / Rojo Alto |
| `alertas_activadas` | JSONB | Array de textos de alertas generadas |
| `reglas_criticas_activadas` | JSONB | Array de códigos RF-XX activados |
| `accion_sugerida` | TEXT | Texto de la acción recomendada |
| `etiqueta_fraude_simulada` | INTEGER | 0/1 — para entrenamiento y evaluación |
| `estado_revision` | VARCHAR | Pendiente / En revisión / Aprobado / Rechazado |
| `id_revisor_asignado` | VARCHAR FK | Referencia a `app.revisores` |
| `fecha_asignacion` | TIMESTAMP | Cuándo fue asignado a revisión humana |
| `perfil_riesgo_generacion` | VARCHAR | Cómo se generó el caso (ingreso_manual, dataset…) |
| `created_at` | TIMESTAMP | Fecha de creación del registro |

#### `claims.polizas`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_poliza` | VARCHAR PK | Identificador de la póliza |
| `id_asegurado` | VARCHAR FK | Titular |
| `ramo` | VARCHAR | Ramo asegurado |
| `fecha_inicio` | DATE | Inicio de vigencia |
| `fecha_fin` | DATE | Fin de vigencia |
| `prima` | NUMERIC | Prima anual (USD) |
| `suma_asegurada` | NUMERIC | Monto máximo de cobertura |
| `deducible` | NUMERIC | Franquicia del asegurado |
| `canal_venta` | VARCHAR | Agente, corredor, directo… |
| `ciudad` | VARCHAR | Ciudad de la póliza |
| `estado_poliza` | VARCHAR | Vigente, Vencida, Cancelada |
| `plan_producto` | VARCHAR | Plan específico del producto |

#### `claims.asegurados`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_asegurado` | VARCHAR PK | Identificador anónimo |
| `cedula` | VARCHAR | Cédula ecuatoriana válida (sintética) |
| `nombre` | VARCHAR | Nombre ficticio ecuatoriano |
| `segmento` | VARCHAR | Segmento de cliente |
| `antiguedad_meses` | INTEGER | Meses como cliente |
| `ciudad` | VARCHAR | Ciudad de residencia |
| `num_polizas` | INTEGER | Pólizas activas |
| `reclamos_ultimos_12_meses` | INTEGER | Frecuencia reciente |
| `mora_actual` | BOOLEAN | Indicador de morosidad |
| `score_cliente_simulado` | NUMERIC | Score de perfil del cliente |

#### `claims.vehiculos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_vehiculo` | VARCHAR PK | Identificador del vehículo |
| `placa` | VARCHAR | Placa ecuatoriana |
| `chasis` | VARCHAR | Número de chasis |
| `motor` | VARCHAR | Número de motor |
| `marca` | VARCHAR | Marca del vehículo |
| `modelo` | VARCHAR | Modelo |
| `anio` | INTEGER | Año de fabricación |
| `uso` | VARCHAR | Particular, comercial, transporte |

#### `claims.conductores`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_conductor` | VARCHAR PK | Identificador del conductor |
| `rango_edad` | TEXT | Rango etario (18-25, 26-40…) |
| `antiguedad_licencia_anios` | INTEGER | Años con licencia |

#### `claims.proveedores`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_proveedor` | VARCHAR PK | Identificador del proveedor |
| `nombre_proveedor` | VARCHAR | Nombre del taller, clínica o perito |
| `tipo` | VARCHAR | Taller, Clínica, Perito, Abogado |
| `ciudad_proveedor` | VARCHAR | Ciudad donde opera |
| `reclamos_asociados` | INTEGER | Total de reclamos asociados |
| `monto_promedio_reclamado` | NUMERIC | Ticket promedio (USD) |
| `porcentaje_casos_observados` | NUMERIC | % de casos con alertas |
| `antiguedad_meses` | INTEGER | Meses activo como proveedor |
| `en_lista_restrictiva` | BOOLEAN | Si está en lista de observados |

#### `claims.documentos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_documento` | VARCHAR PK | Identificador del documento |
| `id_siniestro` | VARCHAR FK | Siniestro al que pertenece |
| `tipo_documento` | VARCHAR | Denuncia, Factura, Informe médico, Fotos… |
| `entregado` | BOOLEAN | Si fue presentado |
| `legible` | BOOLEAN | Si es legible y procesable |
| `fecha_emision` | DATE | Fecha del documento |
| `inconsistencia_detectada` | BOOLEAN | Si hay discrepancia con otros datos |
| `observacion` | TEXT | Detalle de la inconsistencia |

#### `claims.narrativas_similares`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_par` | SERIAL PK | Identificador del par |
| `id_siniestro_a` | VARCHAR FK | Primer siniestro del par |
| `id_siniestro_b` | VARCHAR FK | Segundo siniestro del par |
| `cluster_narrativa` | INTEGER | Grupo de narrativas similares |
| `similitud_coseno_simulada` | NUMERIC | Score de similitud (0–1) |
| `descripcion_a` | TEXT | Texto del siniestro A |
| `descripcion_b` | TEXT | Texto del siniestro B |
| `metodo` | VARCHAR | Método usado (tfidf_cosine) |

---

### Esquema `rag`

#### `rag.business_chunks`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador del chunk |
| `source_name` | VARCHAR | Nombre del documento origen (ej. `manual_revision.md`, `peritaje_abc123`) |
| `section` | VARCHAR | Sección dentro del documento |
| `chunk_text` | TEXT | Texto del fragmento (≤ 800 palabras) |
| `embedding` | VECTOR(768) | Embedding generado con gemini-embedding-001 |
| `created_at` | TIMESTAMP | Fecha de ingesta |

---

### Esquema `app`

#### `app.revisores`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_revisor` | VARCHAR PK | REV-001 a REV-005 |
| `nombre` | VARCHAR | Nombre del analista |
| `especialidad` | VARCHAR | Ramo de especialización |
| `email` | VARCHAR | Email institucional |
| `casos_activos` | INTEGER | Casos actualmente en revisión (contador dinámico) |

**Asignación por ramo:**

| Ramo | Revisor |
|------|---------|
| Vehículos / Automóvil | REV-001 · Ana Morales |
| Salud / Accidentes Personales | REV-002 · Carlos Jiménez |
| Hogar / Robo | REV-003 · María Suárez |
| Vida | REV-004 · Diego Paredes |
| Generales / RC | REV-005 · Lucía Vásquez |

---

## Vistas SQL

| Vista | Descripción |
|-------|-------------|
| `claims.v_kpis` | KPIs consolidados del portafolio (total, rojos, amarillos, verdes, montos, score promedio) |
| `claims.v_provider_risk` | Ranking de proveedores por concentración de alertas y score promedio |

---

## Dataset sintético

| Archivo CSV | Filas | Descripción |
|------------|-------|-------------|
| `siniestros_scored.csv` | 1.000 | Siniestros con scores pre-calculados |
| `polizas.csv` | 1.000 | Pólizas asociadas |
| `asegurados.csv` | 500 | Asegurados únicos |
| `vehiculos.csv` | 800 | Vehículos asegurados |
| `conductores.csv` | 600 | Conductores |
| `proveedores.csv` | ~50 | Talleres y clínicas |
| `documentos.csv` | 3.496 | Expediente documental |
| `narrativas_similares.csv` | 500+ | Pares de similitud TF-IDF |
| **Total filas** | **~7.500** | Datos sintéticos Ecuador |
