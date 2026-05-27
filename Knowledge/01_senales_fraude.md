# Señales de Posible Fraude – Sistema de Scoring

**doc_id:** DOC-FRAUD-SIGNALS-001  
**version:** v1.0  
**fuente:** hackIAthon – Reto Aseguradora del Sur, Sección 7  
**categoría:** Scoring de Riesgo

> Las señales generan **alertas de revisión**, no acusaciones de fraude. Toda decisión final es responsabilidad del analista humano.

---

## Resumen de señales

| Señal | Pts máx. |
|---|---|
| SIG-001 – Reclamo borde de vigencia | 8 |
| SIG-002 – Demora denuncia por robo | 8 |
| SIG-003 – Alta frecuencia asegurado | 8 |
| SIG-004 – Alta frecuencia conductor | 8 |
| SIG-005 – Narrativas similares | 8 |
| SIG-006 – Alta frecuencia vehículo | 6 |
| SIG-007 – Alta frecuencia RC | 6 |
| SIG-008 – Dinámica sospechosa | 6 |
| SIG-009 – Evento sin tercero | 6 |
| SIG-010 – Documentos inconsistentes | 10 |
| SIG-011 – Beneficiario recurrente | 10 |
| SIG-012 – Reporte tardío | 5 |
| SIG-013 – Monto cercano a suma asegurada | 5 |
| SIG-014 – Documentos incompletos | 4 |

---

## SIG-001 – Reclamo Cercano al Borde de Vigencia

**categoría:** Temporalidad de Póliza  
**keywords:** vigencia, borde, inicio póliza, fin póliza, días, contratación  
**puntuación máxima:** 8

**Descripción:** Se activa cuando un siniestro ocurre pocos días después de contratar la póliza o antes del fin de vigencia. Indica posible contratación con conocimiento previo del siniestro.

**Scoring:**

| Condición | Puntos |
|---|---|
| ≤ 10 días del inicio o fin de vigencia | 8 pts |
| 11 a 30 días | 4 pts |
| > 30 días | 0 pts |

**Ejemplo:** Póliza contratada el 01/01/2025 y siniestro reportado el 05/01/2025 (4 días) → 8 puntos.

**Campo clave:** `dias_desde_inicio_poliza`, `dias_desde_fin_poliza`

---

## SIG-002 – Demora en Denuncia por Robo

**categoría:** Temporalidad de Denuncia  
**keywords:** robo, denuncia, demora, horas, ocurrencia, reporte, PTxRB  
**puntuación máxima:** 8

**Descripción:** Aplica exclusivamente a siniestros de tipo Robo. Mide el tiempo entre la ocurrencia del robo y la presentación de la denuncia formal.

**Scoring:**

| Condición | Puntos |
|---|---|
| > 48 horas desde la ocurrencia | 8 pts |
| 24 a 48 horas | 4 pts |
| < 24 horas | 0 pts |

**Ejemplo:** Robo el lunes a las 10:00, denuncia el jueves → 72 horas → 8 puntos.

**Campo clave:** `dias_entre_ocurrencia_reporte`, `cobertura = 'Robo'`

---

## SIG-003 – Alta Frecuencia de Reclamos – Asegurado

**categoría:** Frecuencia – Asegurado  
**keywords:** frecuencia, asegurado, historial, múltiples siniestros, 18 meses  
**puntuación máxima:** 8

**Descripción:** Evalúa el número de siniestros previos del asegurado en una ventana temporal de 18 meses. Alta frecuencia puede indicar comportamiento oportunista.

**Scoring:**

| Condición | Puntos |
|---|---|
| ≥ 3 siniestros en 18 meses | 8 pts |
| 2 siniestros en 18 meses | 4 pts |
| 0–1 siniestros | 0 pts |

**Ejemplo:** Asegurado A123 con siniestros en mar-24, ago-24 y ene-25 → 8 puntos.

**Campo clave:** `historial_siniestros_asegurado`, `id_asegurado`

---

## SIG-004 – Alta Frecuencia de Reclamos – Vehículo

**categoría:** Frecuencia – Vehículo  
**keywords:** vehículo, placa, chasis, motor, frecuencia, 18 meses  
**puntuación máxima:** 6

**Descripción:** Evalúa cuántos siniestros ha registrado el mismo vehículo (identificado por placa, chasis o motor) en los últimos 18 meses.

**Scoring:**

| Condición | Puntos |
|---|---|
| ≥ 3 siniestros en 18 meses | 6 pts |
| 2 siniestros en 18 meses | 3 pts |
| 0–1 siniestros | 0 pts |

**Ejemplo:** Vehículo placa ABC-1234 con 3 siniestros en el último año → 6 puntos.

**Campo clave:** `placa`, `chasis`, `motor`

---

## SIG-005 – Alta Frecuencia de Conductor en Vehículo

**categoría:** Frecuencia – Conductor  
**keywords:** conductor, frecuencia, múltiples vehículos, 18 meses  
**puntuación máxima:** 8

**Descripción:** Identifica si el mismo conductor aparece en múltiples siniestros en ≤18 meses, independientemente del vehículo.

**Scoring:**

| Condición | Puntos |
|---|---|
| ≥ 3 siniestros en 18 meses | 8 pts |
| 2 siniestros en 18 meses | 4 pts |
| 0–1 siniestros | 0 pts |

**Ejemplo:** Conductor Juan Pérez presente en siniestros de 3 vehículos distintos → 8 puntos.

**Campo clave:** `conductor`, agrupación por nombre/cédula anónima

---

## SIG-006 – Alta Frecuencia – Solo Responsabilidad Civil (RC)

**categoría:** Frecuencia – Cobertura RC  
**keywords:** RC, responsabilidad civil, solo RC, cobertura, frecuencia  
**puntuación máxima:** 6

**Descripción:** Frecuencia atípica de siniestros donde únicamente se afecta la cobertura de RC, sin daño al vehículo propio. Puede indicar simulación de accidentes.

**Scoring:**

| Condición | Puntos |
|---|---|
| > 2 eventos previos de solo RC | 6 pts |
| 1 evento previo de solo RC | 3 pts |
| 0 eventos previos | 0 pts |

**Ejemplo:** Asegurado con 3 siniestros de RC puro en el año → 6 puntos.

**Campo clave:** `cobertura = 'RC'`, sin daño a vehículo propio

---

## SIG-007 – Beneficiario o Proveedor Recurrente Sospechoso

**categoría:** Red de Actores – Proveedor  
**keywords:** proveedor, taller, clínica, lista restrictiva, beneficiario, recurrente  
**puntuación máxima:** 10

**Descripción:** Se activa cuando el proveedor, taller, clínica o beneficiario asociado al reclamo aparece en la Lista Restrictiva interna o está vinculado a múltiples casos observados.

**Scoring:**

| Condición | Puntos |
|---|---|
| Proveedor en Lista Restrictiva | 10 pts |
| Proveedor en > 2 casos observados en el año | 5 pts |
| Sin antecedentes | 0 pts |

**Ejemplo:** Taller Mecánico XYZ en lista restrictiva → 10 puntos automáticos.

**Campo clave:** `proveedores.en_lista_restrictiva`, `proveedores.pct_casos_observados`

---

## SIG-008 – Documentos Incompletos

**categoría:** Documentación  
**keywords:** documentos, incompletos, denuncia, factura, peritaje, informe  
**puntuación máxima:** 4

**Descripción:** Se activa cuando faltan documentos legalmente obligatorios para la tramitación del siniestro.

**Scoring:**

| Condición | Puntos |
|---|---|
| Falta ≥ 1 documento legal obligatorio | 4 pts |
| Documentos completos | 0 pts |

**Ejemplo:** Siniestro de choque sin denuncia policial adjunta → 4 puntos.

**Campo clave:** `documentos_completos = FALSE`, `documentos.entregado = FALSE`

---

## SIG-009 – Dinámica Sospechosa del Accidente

**categoría:** Dinámica del Accidente  
**keywords:** dinámica, accidente, frontal, posterior, volcadura, múltiple, madrugada, relato  
**puntuación máxima:** 6

**Descripción:** Evalúa si el tipo de accidente reportado (Frontal, Posterior, Volcadura, Múltiple) es consistente con el relato y los daños. También considera accidentes múltiples en horario nocturno.

**Scoring:**

| Condición | Puntos |
|---|---|
| Relato ilógico vs tipo de impacto | 6 pts |
| Accidente múltiple de madrugada | 3 pts |
| Dinámica coherente con daños | 0 pts |

**Ejemplo:** Volcadura reportada pero daños solo en un costado → relato ilógico → 6 puntos.

**Campo clave:** `descripcion` (NLP), `tipo_siniestro`, `hora_ocurrencia`

---

## SIG-010 – Evento sin Tercero Identificado

**categoría:** Evidencia del Evento  
**keywords:** tercero, fuga, cámaras, testigos, sin evidencia, impacto  
**puntuación máxima:** 6

**Descripción:** Aplica cuando el vehículo asegurado resulta afectado por la acción de un tercero, pero dicho tercero no existe, huyó o no hay evidencia de su presencia.

**Scoring:**

| Condición | Puntos |
|---|---|
| Daño severo sin rastro del tercero ni cámaras | 5 pts |
| Evidencia parcial del tercero | 0 pts |

**Ejemplo:** Choque severo por "impacto de tercero" en zona con cámaras, sin registro → 5 puntos.

**Campo clave:** `tercero_identificado = FALSE`, análisis de `descripcion`

---

## SIG-011 – Documentos Inconsistentes o Alterados

**categoría:** Documentación – Inconsistencias  
**keywords:** alteración, factura, fechas, inconsistencia, ilegible, adulteración  
**puntuación máxima:** 10

**Descripción:** Se activa ante evidencia de alteración documental: fechas que no coinciden, valores diferentes entre documentos, facturas con fecha anterior al evento o documentos ilegibles.

**Scoring:**

| Condición | Puntos |
|---|---|
| Alteración confirmada o factura previa al evento | 10 pts |
| Inconsistencia menor sin alteración evidente | 5 pts |
| Documentos consistentes | 0 pts |

**Ejemplo:** Factura de reparación fechada 3 días antes del accidente → 10 puntos.

**Campo clave:** `documentos.inconsistencia_detectada`, `documentos.fecha_emision < siniestros.fecha_ocurrencia`

---

## SIG-012 – Reporte Tardío del Siniestro

**categoría:** Temporalidad de Reporte  
**keywords:** reporte tardío, días, ocurrencia, notificación, retraso  
**puntuación máxima:** 5

**Descripción:** Mide los días entre la fecha de ocurrencia y la fecha de reporte. Un reporte muy tardío puede indicar fabricación posterior del evento.

**Scoring:**

| Condición | Puntos |
|---|---|
| > 7 días entre ocurrencia y reporte | 5 pts |
| 4 a 7 días | 3 pts |
| ≤ 3 días | 0 pts |

**Ejemplo:** Accidente el 01/01/2025, reportado el 15/01/2025 (14 días) → 5 puntos.

**Campo clave:** `dias_entre_ocurrencia_reporte`

---

## SIG-013 – Narrativas Similares entre Reclamos

**categoría:** NLP – Similitud Textual  
**keywords:** narrativa, similitud, texto, NLP, clonado, descripción, reclamo  
**puntuación máxima:** 8

**Descripción:** Utiliza análisis de similitud textual (NLP) para detectar descripciones de siniestros copiadas o casi idénticas entre diferentes reclamos, lo que puede indicar fraude organizado.

**Scoring:**

| Condición | Puntos |
|---|---|
| > 85% de similitud textual con otro reclamo | 8 pts |
| 70%–84% de similitud | 4 pts |
| < 70% de similitud | 0 pts |

**Ejemplo:** Dos reclamos distintos con 92% de similitud en descripción del evento → 8 puntos.

**Campo clave:** `descripcion` (comparación NLP con corpus de reclamos)

---

## SIG-014 – Monto Cercano o Superior a Suma Asegurada

**categoría:** Montos – Anomalía  
**keywords:** monto, suma asegurada, promedio, reparación, valor, alto  
**puntuación máxima:** 5

**Descripción:** Se activa cuando el monto reclamado representa una proporción muy alta de la cobertura contratada o supera significativamente el promedio de reparación del tipo de siniestro.

**Scoring:**

| Condición | Puntos |
|---|---|
| Reclamo > 95% de la suma asegurada o +50% del promedio | 4 pts |
| Monto dentro de rangos esperados | 0 pts |

**Ejemplo:** Suma asegurada $20.000, reclamo de $19.500 (97.5%) → 4 puntos.

**Campo clave:** `monto_reclamado / polizas.suma_asegurada`, comparación con promedio del ramo
