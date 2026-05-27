# Reglas de Negocio Críticas – Clasificación Automática de Alertas

**doc_id:** DOC-FRAUD-RULES-002  
**version:** v1.0  
**fuente:** hackIAthon – Reto Aseguradora del Sur, Sección 8  
**categoría:** Reglas Determinísticas

> Las reglas críticas asignan nivel ROJO o AMARILLO de forma determinística, con **prioridad sobre el score numérico**. Son condiciones suficientes por sí solas para escalar el caso.

---

## Resumen de reglas

| Código | Regla | Nivel |
|---|---|---|
| RF-01 | Cobertura Pérdida Total por Robo (PTxRB) | 🔴 ROJO |
| RF-02 | Evidencia de Falsificación o Adulteración Documental Evidente | 🔴 ROJO |
| RF-03 | Asegurado, Beneficiario o APS en Lista Restrictiva | 🔴 ROJO |
| RF-04 | Dinámica del Accidente Físicamente Imposible | 🔴 ROJO |
| RF-05 | Siniestro Extremo al Borde de Vigencia (< 48 hrs) | 🟡 AMARILLO |
| RF-06 | Demora Atípica en Denuncia de Robo (> 4 días) | 🟡 AMARILLO |
| RF-07 | Narrativa Idéntica / Clonada | 🟡 AMARILLO |

---

## RF-01 – Cobertura Pérdida Total por Robo (PTxRB)

**nivel:** ROJO  
**categoría:** Cobertura – Robo  
**keywords:** PTxRB, pérdida total, robo, cobertura, vehículo robado  
**override:** Clasifica como ROJO independientemente del score numérico

**Condición de activación:** El siniestro corresponde a una cobertura de Pérdida Total por Robo.

**Acción requerida:** Escalar de forma inmediata a la Unidad Antifraude para revisión especializada de campo. Requiere verificación de denuncia policial, inspección física y cruce con base de vehículos robados.

**Justificación:** Los siniestros de PTxRB representan el mayor monto promedio de pago y son el tipo de fraude más frecuente en el ramo de vehículos. La totalidad de estos casos debe ser revisada por un analista.

**Lógica:**
```sql
WHERE cobertura = 'PTxRB'
   OR cobertura LIKE '%Pérdida Total%Robo%'
```

---

## RF-02 – Falsificación o Adulteración Documental Evidente

**nivel:** ROJO  
**categoría:** Documentación – Fraude Evidente  
**keywords:** adulteración, falsificación, documentos, factura, fecha, alteración  
**override:** Clasifica como ROJO independientemente del score numérico

**Condición de activación:** El sistema o el analista detecta evidencia de adulteración en documentos: fechas alteradas, firmas inconsistentes, facturas con fecha anterior al evento o documentos ilegibles con inconsistencias confirmadas.

**Acción requerida:** Suspender tramitación del siniestro. Escalar a Unidad Antifraude y al departamento legal para evaluación de implicaciones.

**Justificación:** La adulteración de documentos constituye un indicador directo de intención fraudulenta y tiene implicaciones legales. Requiere tratamiento prioritario independientemente del monto.

**Lógica:**
```sql
WHERE documentos.inconsistencia_detectada = TRUE
   OR documentos.fecha_emision < siniestros.fecha_ocurrencia
```

---

## RF-03 – Coincidencia con Lista Restrictiva

**nivel:** ROJO  
**categoría:** Lista Restrictiva – Actores  
**keywords:** lista restrictiva, asegurado, proveedor, APS, beneficiario, antecedentes  
**override:** Clasifica como ROJO independientemente del score numérico

**Condición de activación:** El asegurado, beneficiario, APS (Auxiliar de Producción de Seguros) o proveedor coincide exactamente con un registro en la Lista Restrictiva interna.

**Acción requerida:** Bloquear tramitación automática. Escalar a Unidad Antifraude con prioridad máxima. No realizar pagos parciales hasta completar la investigación.

**Justificación:** La Lista Restrictiva contiene actores con antecedentes comprobados de fraude. Cualquier coincidencia exacta debe tratarse como caso de alto riesgo.

**Lógica:**
```sql
WHERE proveedores.en_lista_restrictiva = TRUE
   OR asegurados.en_lista_restrictiva = TRUE
```

---

## RF-04 – Dinámica del Accidente Físicamente Imposible

**nivel:** ROJO  
**categoría:** Dinámica – Imposibilidad Física  
**keywords:** físicamente imposible, dinámica, accidente, peritaje, incoherente, fabricado  
**override:** Clasifica como ROJO independientemente del score numérico

**Condición de activación:** El análisis de la narrativa y los daños reportados indica una dinámica de accidente físicamente imposible o completamente incoherente entre el relato y los daños documentados.

**Acción requerida:** Suspender tramitación. Solicitar inspección técnica independiente y análisis pericial de los daños.

**Justificación:** Un accidente físicamente imposible indica fabricación intencional del siniestro. Requiere análisis pericial antes de cualquier decisión.

**Lógica:**
```
Análisis NLP de campo: descripcion
Cruce con: tipo_siniestro, daños_reportados
Requiere evaluación pericial para confirmar
```

---

## RF-05 – Siniestro Extremo al Borde de Vigencia (< 48 horas)

**nivel:** AMARILLO  
**categoría:** Temporalidad – Borde de Vigencia  
**keywords:** 48 horas, inicio póliza, fin póliza, borde vigencia, contratación  
**override:** Eleva a AMARILLO mínimo si score numérico < 41

**Condición de activación:** El siniestro ocurre dentro de las primeras 48 horas de vigencia de la póliza o en las últimas 48 horas antes de su vencimiento.

**Acción requerida:** Escalar a Unidad Antifraude para revisión documental prioritaria. No rechazar automáticamente.

**Justificación:** Un siniestro en las primeras o últimas 48 horas de vigencia puede indicar contratación con conocimiento previo del evento. Requiere revisión documental exhaustiva.

**Lógica:**
```sql
WHERE dias_desde_inicio_poliza <= 2
   OR dias_desde_fin_poliza <= 2
```

---

## RF-06 – Demora Atípica en Denuncia de Robo (> 4 días)

**nivel:** AMARILLO  
**categoría:** Robo – Demora en Denuncia  
**keywords:** robo, denuncia tardía, 4 días, demora, ocurrencia, reporte  
**override:** Eleva a AMARILLO mínimo si score numérico < 41

**Condición de activación:** En siniestros de robo, la denuncia formal se presenta más de 4 días después de la ocurrencia.

**Acción requerida:** Escalar a Unidad Antifraude. Solicitar justificación documentada de la demora.

**Justificación:** Una demora de más de 4 días en denunciar un robo es inusual y puede indicar que el vehículo fue ocultado por el propio asegurado o que el evento no ocurrió en la fecha declarada.

**Lógica:**
```sql
WHERE ramo = 'Vehículos'
  AND cobertura LIKE '%Robo%'
  AND dias_entre_ocurrencia_reporte > 4
```

---

## RF-07 – Narrativa Idéntica / Clonada

**nivel:** AMARILLO  
**categoría:** NLP – Narrativa Clonada  
**keywords:** narrativa, idéntica, clonada, similitud, 85%, texto, NLP, reclamo  
**override:** Eleva a AMARILLO mínimo si score numérico < 41

**Condición de activación:** La similitud textual entre la descripción del siniestro y otro reclamo existente es superior al 85%.

**Acción requerida:** Escalar a Unidad Antifraude. Identificar todos los siniestros relacionados para análisis conjunto.

**Justificación:** Narrativas idénticas sugieren un patrón de fraude organizado donde se reutiliza el mismo relato para múltiples reclamos. Puede involucrar una red de actores coordinados.

**Lógica:**
```
similitud_coseno(descripcion_A, descripcion_B) > 0.85
Campo: descripcion (comparación NLP contra corpus de reclamos)
```
