# Proceso de Revisión de Siniestros y Escalamiento de Alertas

**doc_id:** DOC-BUSINESS-005
**version:** hackathon_v1
**doc_type:** proceso
**categoría:** Proceso Operativo

> Este documento describe el proceso de revisión de siniestros con soporte del sistema FraudIA, los criterios de escalamiento y las responsabilidades de cada actor en el flujo.

---

## 1. Visión General del Proceso

El proceso de revisión de siniestros con FraudIA tiene tres etapas principales:

1. **Recepción y scoring automático:** El siniestro es registrado en el sistema y FraudIA calcula automáticamente el score de riesgo y nivel de alerta.
2. **Revisión por el analista de liquidación:** El analista revisa el caso según su nivel de riesgo y decide si tramitar, escalar o solicitar documentación adicional.
3. **Investigación especializada (si aplica):** Los casos Rojo Alto son investigados por la Unidad Antifraude antes de cualquier pago.

---

## 2. Etapa 1: Recepción y Scoring Automático

### Actores involucrados
- Sistema FraudIA (automatizado)
- No requiere intervención humana en esta etapa

### Pasos

**Paso 1.1 – Registro del siniestro**
El siniestro es recibido por cualquier canal (web, app, call center, agente) y se crea un registro en la tabla `claims.siniestros` con todos los campos disponibles.

**Paso 1.2 – Carga de datos relacionados**
El sistema recupera automáticamente los datos de la póliza, el asegurado, el vehículo, el conductor y el proveedor asociado al siniestro.

**Paso 1.3 – Evaluación de señales de riesgo**
El sistema evalúa las 14 señales de riesgo (SIG-001 a SIG-014) y acumula los puntos correspondientes.

**Paso 1.4 – Evaluación de reglas críticas**
El sistema verifica las 7 reglas críticas (RF-01 a RF-07) y aplica overrides si corresponde.

**Paso 1.5 – Cálculo del score final**
```
score_final = 0.6 × score_reglas + 0.4 × score_modelo_simulado
```

**Paso 1.6 – Clasificación y registro de alertas**
El sistema asigna el nivel de riesgo (Verde Bajo / Amarillo Medio / Rojo Alto) y registra todas las alertas activadas en el campo `alertas_activadas` (JSON).

**Salida de esta etapa:**
- `score_final` calculado
- `nivel_riesgo` asignado
- `alertas_activadas` registradas
- `accion_sugerida` generada

---

## 3. Etapa 2: Revisión por el Analista de Liquidación

### Actores involucrados
- Analista de Liquidación (revisión principal)
- Supervisor de Liquidación (para casos Amarillo Medio)

### Tiempos esperados

| Nivel | Tiempo máximo de revisión |
|---|---|
| Verde Bajo | 2 días hábiles |
| Amarillo Medio | 5 días hábiles |
| Rojo Alto | Inmediato → escalar a Antifraude |

### Flujo por nivel de riesgo

#### Para casos Verde Bajo (score 0-39, sin reglas críticas)

1. El analista revisa el siniestro en la tabla de casos.
2. Verifica que la documentación esté completa.
3. Confirma que la cobertura aplica para el tipo de evento.
4. Procede a la liquidación según el proceso estándar.
5. No requiere escalar a la Unidad Antifraude.

**Excepción:** Si el analista detecta irregularidades no capturadas por el sistema, puede elevar manualmente el caso a Amarillo o Rojo y documentar el motivo.

#### Para casos Amarillo Medio (score 40-69 o reglas RF-05, RF-06, RF-07)

1. El analista identifica el caso en la cola de revisión prioritaria.
2. Consulta el detalle del caso en FraudIA para ver las alertas activas.
3. Puede usar el chat de FraudIA para preguntar: "Explícame por qué este siniestro es Amarillo".
4. Solicita documentación adicional si hay documentos faltantes o inconsistentes.
5. Verifica con el proveedor la factura y los daños reportados.
6. Cruza el historial del asegurado y del conductor.
7. Eleva a Rojo si encuentra evidencia adicional de irregularidades.
8. Aprueba o niega el pago con evidencia documental suficiente.
9. Registra la decisión y los motivos en el sistema.

**Si no puede resolver en 5 días hábiles:** Escala automáticamente al Supervisor de Liquidación.

#### Para casos Rojo Alto (score 70-100 o reglas RF-01, RF-02, RF-03, RF-04)

1. El analista identifica el caso como Rojo.
2. **No procede al pago.** Suspende la tramitación.
3. Escala inmediatamente a la Unidad Antifraude con el reporte de alertas de FraudIA.
4. La decisión de pago queda en manos de la Unidad Antifraude.

---

## 4. Etapa 3: Investigación Especializada por Unidad Antifraude

### Actores involucrados
- Investigador de Antifraude (investigación de campo)
- Jefe de Antifraude (decisión final en casos complejos)
- Departamento Legal (si hay implicaciones legales)

### Proceso de investigación

**Paso 3.1 – Revisión del reporte de FraudIA**
El investigador revisa el detalle del caso en FraudIA:
- Score final y desglose
- Alertas activadas y su justificación
- Reglas críticas activas
- Historial del asegurado, conductor y proveedor

**Paso 3.2 – Consulta al agente FraudIA**
El investigador puede preguntar al agente:
- "¿Qué documentos faltan en el siniestro SIN-XXXX?"
- "¿Qué otros siniestros tiene el asegurado ASG-XXXX?"
- "¿Tiene el proveedor PRV-XXXX antecedentes de alertas?"
- "¿Hay narrativas similares a la de este siniestro?"

**Paso 3.3 – Verificación documental**
- Verificar autenticidad de la denuncia policial con la autoridad competente
- Verificar facturas con el proveedor directamente
- Revisar coherencia de fechas y montos en todos los documentos
- Confirmar que la póliza estaba vigente en la fecha del siniestro

**Paso 3.4 – Investigación de campo** (si aplica)
- Inspección física del vehículo o bien asegurado
- Entrevista con el asegurado y el conductor
- Visita al proveedor para verificar los servicios prestados
- Verificación en base de vehículos robados (para PTxRB)
- Consulta a registros de tránsito y cámaras (si están disponibles)

**Paso 3.5 – Análisis de red**
- Identificar si el asegurado, conductor o proveedor aparece en otros casos
- Buscar patrones de fraude organizado (múltiples asegurados, mismo proveedor)
- Cruzar con la Lista Restrictiva
- Revisar narrativas similares en otros siniestros

**Paso 3.6 – Decisión y reporte**
- El investigador emite un reporte de hallazgos con evidencia.
- El Jefe de Antifraude aprueba la decisión: pago, pago parcial, negativa o denuncia.
- Los casos con evidencia de fraude confirmado pueden derivarse al departamento legal.
- Los actores confirmados como fraudulentos se agregan a la Lista Restrictiva.

---

## 5. Checklist de Documentación para Siniestros de Vehículos

### Documentos obligatorios

| Documento | Aplica a |
|---|---|
| Denuncia policial | Robo, PTxRB, accidentes con terceros |
| Informe de peritaje de daños | Choque, volcadura, incendio |
| Factura de reparación | Todos los siniestros con daño material |
| Fotografías del daño | Todos los siniestros con daño material |
| Copia de la licencia de conducir | Todos |
| Copia de la matrícula del vehículo | Todos |
| Copia del título de propiedad | PTxRB, robo total |

### Documentos complementarios (según el caso)

| Documento | Aplica a |
|---|---|
| Declaración jurada del asegurado | Casos Amarillo y Rojo |
| Informe de reconstrucción del accidente | Casos con dinámica cuestionada |
| Historial de mantenimiento del vehículo | PTxRB y robo |
| Registro de cámaras de tránsito | Casos sin testigos |
| Informe de la empresa de rastreo GPS | PTxRB (si el vehículo tenía rastreo) |

---

## 6. Criterios de Escalamiento

### Cuándo escalar de Verde a Amarillo

- El analista detecta inconsistencias adicionales no capturadas por el sistema
- El proveedor no puede justificar la factura presentada
- El asegurado no puede proporcionar evidencia coherente del evento
- El monto solicitado supera significativamente el peritaje

### Cuándo escalar de Amarillo a Rojo

- Se confirma adulteración de documentos
- El asegurado o proveedor aparece en la Lista Restrictiva (actualización posterior al scoring)
- Se detecta narrativa similar a otro caso en investigación
- La denuncia policial no puede verificarse

### Cuándo derivar al departamento legal

- Evidencia confirmada de falsificación documental
- Asegurado o proveedor identificado en red de fraude organizado
- Monto del fraude supera un umbral definido por la jefatura
- El caso tiene implicaciones penales evidentes

---

## 7. Métricas de Eficiencia del Proceso

La Unidad Antifraude monitorea las siguientes métricas para evaluar la eficiencia del proceso:

| Métrica | Descripción |
|---|---|
| Tasa de detección | % de casos pagados que resultaron irregulares |
| Tasa de falsos positivos | % de casos Rojo que resultaron legítimos |
| Tiempo promedio de investigación | Días desde escalamiento hasta decisión |
| Monto recuperado | Monto evitado de pagar por detección de fraude |
| Casos derivados a legal | Número de casos con denuncia formal |

FraudIA permite calcular estas métricas a través del dashboard y el agente conversacional con preguntas como: "Genera un resumen ejecutivo de los casos críticos del mes".
