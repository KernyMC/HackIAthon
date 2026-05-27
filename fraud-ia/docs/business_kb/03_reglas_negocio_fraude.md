# Reglas de Negocio para Detección de Posible Fraude

**doc_id:** DOC-BUSINESS-003
**version:** hackathon_v1
**doc_type:** reglas_negocio
**categoría:** Señales y Reglas de Riesgo
**fuentes:** DOC-FRAUD-SIGNALS-001, DOC-FRAUD-RULES-002

> Las reglas y señales generan **alertas de revisión**, no acusaciones de fraude. Toda decisión final es responsabilidad exclusiva del analista humano. El sistema nunca rechaza automáticamente un siniestro ni afirma que ocurrió fraude.

---

## Parte 1: Las 14 Señales de Riesgo (SIG-001 a SIG-014)

Las señales de riesgo son condiciones que, al detectarse en un siniestro, suman puntos al score de riesgo. Pueden activarse varias señales simultáneamente. El score total se limita a 100 puntos.

### Resumen de señales y puntuación

| Código | Señal | Puntos máx. |
|---|---|---|
| SIG-001 | Reclamo cercano al borde de vigencia de póliza | 8 |
| SIG-002 | Demora en denuncia por robo | 8 |
| SIG-003 | Alta frecuencia de reclamos del asegurado | 8 |
| SIG-004 | Alta frecuencia de reclamos del conductor | 8 |
| SIG-005 | Narrativas similares entre reclamos | 8 |
| SIG-006 | Alta frecuencia de reclamos del vehículo | 6 |
| SIG-007 | Alta frecuencia de siniestros solo RC | 6 |
| SIG-008 | Dinámica sospechosa del accidente | 6 |
| SIG-009 | Evento sin tercero identificado | 6 |
| SIG-010 | Documentos inconsistentes o alterados | 10 |
| SIG-011 | Proveedor o beneficiario recurrente sospechoso | 10 |
| SIG-012 | Reporte tardío del siniestro | 5 |
| SIG-013 | Monto cercano o superior a suma asegurada | 5 |
| SIG-014 | Documentos incompletos | 4 |

---

### SIG-001 – Reclamo Cercano al Borde de Vigencia

**categoría:** Temporalidad de Póliza
**keywords:** vigencia, borde, inicio póliza, fin póliza, días, contratación
**puntuación máxima:** 8 puntos

**Descripción:** Se activa cuando un siniestro ocurre muy pocos días después de contratar la póliza o justo antes del fin de vigencia. Indica posible contratación con conocimiento previo del siniestro o intento de aprovechar la vigencia antes de que expire.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| 10 días o menos del inicio o fin de vigencia | 8 pts |
| Entre 11 y 30 días | 4 pts |
| Más de 30 días | 0 pts |

**Ejemplo de activación:** Póliza contratada el 01/01/2025. Siniestro reportado el 05/01/2025 (4 días desde inicio) → 8 puntos activados.

**Campos clave:** `dias_desde_inicio_poliza`, `dias_desde_fin_poliza`

---

### SIG-002 – Demora en Denuncia por Robo

**categoría:** Temporalidad de Denuncia
**keywords:** robo, denuncia, demora, horas, ocurrencia, reporte, PTxRB
**puntuación máxima:** 8 puntos

**Descripción:** Aplica exclusivamente a siniestros de tipo Robo. Mide el tiempo entre la ocurrencia del robo y la presentación de la denuncia formal. Una persona cuyo vehículo fue robado normalmente lo denuncia de inmediato. Una demora significativa es una señal de alerta.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| Más de 48 horas desde la ocurrencia | 8 pts |
| Entre 24 y 48 horas | 4 pts |
| Menos de 24 horas | 0 pts |

**Ejemplo de activación:** Robo el lunes a las 10:00, denuncia presentada el jueves → 72 horas de diferencia → 8 puntos.

**Campos clave:** `dias_entre_ocurrencia_reporte`, `cobertura = 'Robo'`

---

### SIG-003 – Alta Frecuencia de Reclamos del Asegurado

**categoría:** Frecuencia – Asegurado
**keywords:** frecuencia, asegurado, historial, múltiples siniestros, 18 meses
**puntuación máxima:** 8 puntos

**Descripción:** Evalúa cuántos siniestros previos tiene el asegurado en los últimos 18 meses. Alta frecuencia puede indicar comportamiento oportunista o participación en fraude organizado.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| 3 o más siniestros en 18 meses | 8 pts |
| 2 siniestros en 18 meses | 4 pts |
| 0 o 1 siniestros | 0 pts |

**Ejemplo de activación:** Asegurado A-123 con siniestros en marzo de 2024, agosto de 2024 y enero de 2025 → 3 en 18 meses → 8 puntos.

**Campos clave:** `historial_siniestros_asegurado`, `id_asegurado`

---

### SIG-004 – Alta Frecuencia de Reclamos del Conductor

**categoría:** Frecuencia – Conductor
**keywords:** conductor, frecuencia, múltiples vehículos, 18 meses
**puntuación máxima:** 8 puntos

**Descripción:** Identifica si el mismo conductor aparece en múltiples siniestros en los últimos 18 meses, independientemente del vehículo. Un conductor que aparece frecuentemente en siniestros con distintos vehículos puede ser parte de una red de fraude.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| 3 o más siniestros en 18 meses | 8 pts |
| 2 siniestros en 18 meses | 4 pts |
| 0 o 1 siniestros | 0 pts |

**Ejemplo de activación:** Conductor registrado en siniestros de 3 vehículos distintos en el último año → 8 puntos.

**Campos clave:** `historial_siniestros_conductor`, `id_conductor`

---

### SIG-005 – Narrativas Similares entre Reclamos

**categoría:** NLP – Similitud Textual
**keywords:** narrativa, similitud, texto, NLP, clonado, descripción, reclamo
**puntuación máxima:** 8 puntos

**Descripción:** Utiliza análisis de similitud textual (NLP con TF-IDF y similitud coseno) para detectar descripciones de siniestros copiadas o casi idénticas entre diferentes reclamos. Las narrativas clonadas indican fraude organizado donde se reutiliza el mismo relato para múltiples reclamos con asegurados distintos.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| Más del 85% de similitud textual con otro reclamo | 8 pts |
| Entre 70% y 84% de similitud | 4 pts |
| Menos del 70% de similitud | 0 pts |

**Ejemplo de activación:** Dos reclamos distintos con 92% de similitud en la descripción del evento → 8 puntos en ambos.

**Campos clave:** `descripcion` (comparación NLP con corpus de reclamos), tabla `claims.narrativas_similares`

---

### SIG-006 – Alta Frecuencia de Reclamos del Vehículo

**categoría:** Frecuencia – Vehículo
**keywords:** vehículo, placa, chasis, motor, frecuencia, 18 meses
**puntuación máxima:** 6 puntos

**Descripción:** Evalúa cuántos siniestros ha registrado el mismo vehículo (identificado por placa, chasis o motor) en los últimos 18 meses. Un vehículo con múltiples siniestros puede indicar fraude oportunista recurrente.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| 3 o más siniestros en 18 meses | 6 pts |
| 2 siniestros en 18 meses | 3 pts |
| 0 o 1 siniestros | 0 pts |

**Ejemplo de activación:** Vehículo placa ABC-1234 con 3 siniestros en el último año → 6 puntos.

**Campos clave:** `historial_siniestros_vehiculo`, `id_vehiculo`, `placa_hash`, `chasis_hash`

---

### SIG-007 – Alta Frecuencia de Siniestros Solo RC

**categoría:** Frecuencia – Cobertura RC
**keywords:** RC, responsabilidad civil, solo RC, cobertura, frecuencia
**puntuación máxima:** 6 puntos

**Descripción:** Frecuencia atípica de siniestros donde únicamente se afecta la cobertura de Responsabilidad Civil (RC), sin daño al vehículo propio. Puede indicar simulación de accidentes donde se fabrican daños a terceros sin daño real al vehículo propio.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| Más de 2 eventos previos de solo RC | 6 pts |
| 1 evento previo de solo RC | 3 pts |
| Sin eventos previos | 0 pts |

**Ejemplo de activación:** Asegurado con 3 siniestros de RC puro (sin daño a vehículo propio) en el año → 6 puntos.

**Campos clave:** `cobertura = 'RC'`, historial de coberturas del asegurado

---

### SIG-008 – Dinámica Sospechosa del Accidente

**categoría:** Dinámica del Accidente
**keywords:** dinámica, accidente, frontal, posterior, volcadura, múltiple, madrugada, relato
**puntuación máxima:** 6 puntos

**Descripción:** Evalúa si el tipo de accidente reportado (Frontal, Posterior, Volcadura, Múltiple) es consistente con el relato narrativo y los daños documentados. También considera accidentes múltiples en horario nocturno sin testigos.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| Relato ilógico vs. tipo de impacto y daños | 6 pts |
| Accidente múltiple de madrugada sin testigos | 3 pts |
| Dinámica coherente con daños | 0 pts |

**Ejemplo de activación:** Volcadura reportada pero daños solo en un costado lateral → inconsistencia física → 6 puntos.

**Campos clave:** `descripcion` (análisis NLP), tipo de siniestro, daños reportados

---

### SIG-009 – Evento sin Tercero Identificado

**categoría:** Evidencia del Evento
**keywords:** tercero, fuga, cámaras, testigos, sin evidencia, impacto
**puntuación máxima:** 6 puntos

**Descripción:** Aplica cuando el vehículo asegurado resulta afectado por la acción de un tercero (choque, impacto), pero dicho tercero no existe, huyó sin dejar rastro, o no hay evidencia de su presencia en una zona con cámaras o testigos.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| Daño severo sin rastro del tercero en zona con cámaras | 5 pts |
| Evidencia parcial del tercero | 0 pts |

**Ejemplo de activación:** Choque severo por "impacto de tercero" en avenida principal con cámaras de tránsito, sin registro del tercero → 5 puntos.

**Campos clave:** análisis de `descripcion`, zona geográfica, tipo de siniestro

---

### SIG-010 – Documentos Inconsistentes o Alterados

**categoría:** Documentación – Inconsistencias
**keywords:** alteración, factura, fechas, inconsistencia, ilegible, adulteración
**puntuación máxima:** 10 puntos

**Descripción:** Se activa ante evidencia de alteración documental: fechas que no coinciden, valores diferentes entre documentos, facturas con fecha anterior al evento o documentos ilegibles con inconsistencias confirmadas.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| Alteración confirmada o factura previa al evento | 10 pts |
| Inconsistencia menor sin alteración evidente | 5 pts |
| Documentos consistentes | 0 pts |

**Ejemplo de activación:** Factura de reparación fechada 3 días antes del accidente → 10 puntos. Activa también la Regla Crítica RF-02 (Rojo automático).

**Campos clave:** `documentos.inconsistencia_detectada`, `documentos.fecha_emision < siniestros.fecha_ocurrencia`

---

### SIG-011 – Proveedor o Beneficiario Recurrente Sospechoso

**categoría:** Red de Actores – Proveedor
**keywords:** proveedor, taller, clínica, lista restrictiva, beneficiario, recurrente
**puntuación máxima:** 10 puntos

**Descripción:** Se activa cuando el proveedor (taller, clínica, perito) asociado al reclamo aparece en la Lista Restrictiva interna o tiene un porcentaje elevado de casos con alertas activas, lo que sugiere participación en una red de fraude.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| Proveedor en Lista Restrictiva | 10 pts |
| Proveedor con más de 2 casos observados en el año | 5 pts |
| Sin antecedentes | 0 pts |

**Ejemplo de activación:** Taller Mecánico XYZ aparece en Lista Restrictiva → 10 puntos automáticos. Activa también la Regla RF-03 (Rojo automático).

**Campos clave:** `proveedores.en_lista_restrictiva`, `proveedores.porcentaje_casos_observados`

---

### SIG-012 – Reporte Tardío del Siniestro

**categoría:** Temporalidad de Reporte
**keywords:** reporte tardío, días, ocurrencia, notificación, retraso
**puntuación máxima:** 5 puntos

**Descripción:** Mide los días entre la fecha de ocurrencia y la fecha de reporte a la aseguradora. Un reporte muy tardío puede indicar fabricación posterior del evento, búsqueda de proveedor cómplice o intento de alterar la escena.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| Más de 7 días entre ocurrencia y reporte | 5 pts |
| Entre 4 y 7 días | 3 pts |
| 3 días o menos | 0 pts |

**Ejemplo de activación:** Accidente el 01/01/2025, reportado a la aseguradora el 15/01/2025 (14 días) → 5 puntos.

**Campos clave:** `dias_entre_ocurrencia_reporte`

---

### SIG-013 – Monto Cercano o Superior a Suma Asegurada

**categoría:** Montos – Anomalía
**keywords:** monto, suma asegurada, promedio, reparación, valor, alto
**puntuación máxima:** 5 puntos

**Descripción:** Se activa cuando el monto reclamado representa una proporción muy alta de la cobertura contratada o supera significativamente el promedio histórico de reparación del tipo de siniestro. Puede indicar inflación intencional del reclamo.

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| Reclamo mayor al 95% de la suma asegurada o 50% sobre el promedio del ramo | 4 pts |
| Monto dentro de rangos esperados | 0 pts |

**Ejemplo de activación:** Suma asegurada $20.000, reclamo de $19.500 (97.5% de la suma) → 4 puntos.

**Campos clave:** `monto_reclamado / polizas.suma_asegurada`, comparación con promedio del ramo

---

### SIG-014 – Documentos Incompletos

**categoría:** Documentación
**keywords:** documentos, incompletos, denuncia, factura, peritaje, informe
**puntuación máxima:** 4 puntos

**Descripción:** Se activa cuando faltan documentos legalmente obligatorios para la tramitación del siniestro (denuncia policial, factura de reparación, informe de peritaje).

**Tabla de puntos:**

| Condición | Puntos |
|---|---|
| Falta 1 o más documentos obligatorios | 4 pts |
| Documentos completos | 0 pts |

**Ejemplo de activación:** Siniestro de choque sin denuncia policial adjunta → 4 puntos.

**Campos clave:** `documentos_completos = FALSE`, `documentos.entregado = FALSE`

---

## Parte 2: Las 7 Reglas de Negocio Críticas (RF-01 a RF-07)

Las reglas críticas son condiciones determinísticas que clasifican automáticamente el caso en un nivel de riesgo, **con prioridad absoluta sobre el score numérico**. Son condiciones suficientes por sí solas para escalar el caso.

### Resumen de reglas críticas

| Código | Regla | Nivel asignado |
|---|---|---|
| RF-01 | Cobertura Pérdida Total por Robo (PTxRB) | Rojo Alto (automático) |
| RF-02 | Evidencia de Falsificación o Adulteración Documental | Rojo Alto (automático) |
| RF-03 | Asegurado, Beneficiario o Proveedor en Lista Restrictiva | Rojo Alto (automático) |
| RF-04 | Dinámica del Accidente Físicamente Imposible | Rojo Alto (automático) |
| RF-05 | Siniestro Extremo al Borde de Vigencia (menos de 48 horas) | Amarillo Medio mínimo |
| RF-06 | Demora Atípica en Denuncia de Robo (más de 4 días) | Amarillo Medio mínimo |
| RF-07 | Narrativa Idéntica o Clonada (más del 85% de similitud) | Amarillo Medio mínimo |

---

### RF-01 – Cobertura Pérdida Total por Robo

**nivel:** Rojo Alto automático
**keywords:** PTxRB, pérdida total, robo, cobertura, vehículo robado, override

**Condición:** El siniestro corresponde a una cobertura de Pérdida Total por Robo (PTxRB).

**Acción requerida:** Escalar de forma inmediata a la Unidad Antifraude para revisión especializada de campo. Requiere verificación de denuncia policial, inspección física y cruce con base de vehículos robados.

**Justificación:** Los siniestros de PTxRB representan el mayor monto promedio de pago y la mayor incidencia de fraude en el ramo de vehículos. La totalidad de estos casos debe ser revisada por un analista especializado.

---

### RF-02 – Falsificación o Adulteración Documental

**nivel:** Rojo Alto automático
**keywords:** adulteración, falsificación, documentos, factura, fecha, alteración

**Condición:** Se detecta evidencia de adulteración en documentos: fechas alteradas, facturas con fecha anterior al evento, firmas inconsistentes o documentos ilegibles con inconsistencias confirmadas.

**Acción requerida:** Suspender tramitación. Escalar a Unidad Antifraude y departamento legal para evaluación de implicaciones.

**Justificación:** La adulteración de documentos indica intención fraudulenta y tiene implicaciones legales. Requiere tratamiento prioritario independientemente del monto.

---

### RF-03 – Coincidencia con Lista Restrictiva

**nivel:** Rojo Alto automático
**keywords:** lista restrictiva, asegurado, proveedor, APS, beneficiario, antecedentes

**Condición:** El asegurado, beneficiario, APS o proveedor coincide con un registro en la Lista Restrictiva interna.

**Acción requerida:** Bloquear tramitación automática. Escalar a Unidad Antifraude con prioridad máxima. No realizar pagos parciales hasta completar la investigación.

**Justificación:** La Lista Restrictiva contiene actores con antecedentes comprobados de fraude o bajo investigación. Cualquier coincidencia debe tratarse como caso de alto riesgo.

---

### RF-04 – Dinámica del Accidente Físicamente Imposible

**nivel:** Rojo Alto automático
**keywords:** físicamente imposible, dinámica, accidente, peritaje, incoherente, fabricado

**Condición:** El análisis de la narrativa y los daños reportados indica una dinámica físicamente imposible o completamente incoherente entre el relato y los daños documentados.

**Acción requerida:** Suspender tramitación. Solicitar inspección técnica independiente y análisis pericial de los daños.

**Justificación:** Un accidente físicamente imposible indica fabricación intencional del siniestro. Requiere análisis pericial antes de cualquier decisión.

---

### RF-05 – Siniestro Extremo al Borde de Vigencia (menos de 48 horas)

**nivel:** Amarillo Medio mínimo
**keywords:** 48 horas, inicio póliza, fin póliza, borde vigencia, contratación

**Condición:** El siniestro ocurre dentro de las primeras 48 horas de vigencia de la póliza o en las últimas 48 horas antes de su vencimiento.

**Acción requerida:** Escalar a Unidad Antifraude para revisión documental prioritaria. No rechazar automáticamente.

**Justificación:** Un siniestro en las primeras o últimas 48 horas puede indicar contratación con conocimiento previo del evento. Requiere revisión documental exhaustiva.

---

### RF-06 – Demora Atípica en Denuncia de Robo

**nivel:** Amarillo Medio mínimo
**keywords:** robo, denuncia tardía, 4 días, demora, ocurrencia, reporte

**Condición:** En siniestros de robo, la denuncia formal se presenta más de 4 días después de la ocurrencia.

**Acción requerida:** Escalar a Unidad Antifraude. Solicitar justificación documentada de la demora.

**Justificación:** Una demora de más de 4 días en denunciar un robo es inusual y puede indicar que el vehículo fue ocultado por el propio asegurado o que el evento no ocurrió en la fecha declarada.

---

### RF-07 – Narrativa Idéntica o Clonada

**nivel:** Amarillo Medio mínimo
**keywords:** narrativa, idéntica, clonada, similitud, 85%, texto, NLP, reclamo

**Condición:** La similitud textual entre la descripción del siniestro y otro reclamo existente es superior al 85%.

**Acción requerida:** Escalar a Unidad Antifraude. Identificar todos los siniestros relacionados para análisis conjunto.

**Justificación:** Narrativas idénticas sugieren fraude organizado donde se reutiliza el mismo relato para múltiples reclamos. Puede involucrar una red de actores coordinados.

---

## Parte 3: Combinaciones Frecuentes de Alertas

Las siguientes combinaciones de señales son especialmente significativas y deben tratarse como casos de alto riesgo:

**Combinación A – Fraude de robo planificado:**
SIG-001 (borde de vigencia) + RF-01 (PTxRB) + SIG-002 (demora en denuncia) → Score alto garantizado + Rojo automático por RF-01.

**Combinación B – Red de fraude con proveedor:**
SIG-011 (proveedor recurrente) + SIG-010 (documentos inconsistentes) + SIG-003 (asegurado frecuente) → Tres señales de peso alto simultáneas, muy probablemente Rojo.

**Combinación C – Fraude organizado con narrativa clonada:**
SIG-005 (narrativas similares) + RF-07 (narrativa clonada) + SIG-003 (asegurado frecuente) → Patrón típico de fraude en red.

**Combinación D – Inflación de monto:**
SIG-013 (monto cercano a suma asegurada) + SIG-010 (documentos inconsistentes) + SIG-014 (documentos incompletos) → Posible inflación del reclamo con documentación deficiente.
