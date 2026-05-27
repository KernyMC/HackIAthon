# Score de Riesgo y Clasificación – Semáforo de Fraude

**doc_id:** DOC-FRAUD-SCORE-003  
**version:** v1.0  
**fuente:** hackIAthon – Reto Aseguradora del Sur, Sección 13  
**categoría:** Lógica de Clasificación

> El score genera una **alerta de revisión**, no una acusación de fraude. Toda decisión final es responsabilidad exclusiva del analista humano.

---

## Fórmula de cálculo

```
score_final = MIN(100, SUM(puntos_señal_i) para toda señal_i activada)
```

- Rango: **0 a 100 puntos**
- Se suman los puntos de todas las señales activas (SIG-001 a SIG-014)
- El resultado se limita a 100 aunque la suma supere ese valor
- Las reglas críticas (RF-01 a RF-07) aplican un **override** sobre el nivel, no sobre el número

---

## Tabla de clasificación – Semáforo

| Rango | Nivel | Acción |
|---|---|---|
| 0 – 40 | 🟢 VERDE – Bajo | Continuar flujo normal de tramitación |
| 41 – 75 | 🟡 AMARILLO – Medio | Escalar a Unidad Antifraude para revisión documental |
| 76 – 100 | 🔴 ROJO – Alto | Escalar a Unidad Antifraude para revisión especializada de campo |

---

## VERDE (0 – 40) – Riesgo Bajo

**keywords:** bajo, normal, sin alerta, flujo estándar, verde  
**condición SQL:** `WHERE score_final BETWEEN 0 AND 40`

**Descripción:** El siniestro no presenta señales de alerta significativas.

**Acción requerida:** Tramitar según proceso estándar. No requiere escalar.

**Justificación:** La ausencia de señales activas o la baja acumulación de puntos indica que el caso se encuentra dentro del comportamiento esperado para el ramo y cobertura.

---

## AMARILLO (41 – 75) – Riesgo Medio

**keywords:** medio, amarillo, revisión documental, antifraude, alerta moderada  
**condición SQL:** `WHERE score_final BETWEEN 41 AND 75`

**Descripción:** Existen señales de alerta que requieren verificación documental antes de proceder al pago.

**Acción requerida:** Escalar a Unidad Antifraude para revisión documental. El analista debe verificar la documentación del siniestro y cruzar variables antes de aprobar cualquier pago.

**Justificación:** La acumulación moderada de puntos indica anomalías que no son concluyentes por sí solas pero que requieren revisión especializada para descartar irregularidades.

---

## ROJO (76 – 100) – Riesgo Alto

**keywords:** alto, rojo, revisión campo, especializada, investigación, suspender  
**condición SQL:** `WHERE score_final BETWEEN 76 AND 100`

**Descripción:** El siniestro presenta múltiples señales de riesgo graves.

**Acción requerida:** Escalar a Unidad Antifraude para revisión especializada de campo. Requiere investigación física antes de cualquier pago.

**Justificación:** La alta acumulación de puntos indica convergencia de múltiples señales de riesgo. Estadísticamente este rango concentra los casos con mayor probabilidad de irregularidad.

---

## Override por reglas de negocio críticas

Las reglas RF-01 a RF-07 modifican el nivel de clasificación independientemente del score numérico:

| Reglas | Override | Condición |
|---|---|---|
| RF-01, RF-02, RF-03, RF-04 | **ROJO automático** | Sin importar el score numérico |
| RF-05, RF-06, RF-07 | **AMARILLO mínimo** | Si score numérico < 41, se eleva a AMARILLO |

**Lógica de aplicación:**
```python
if regla_critica_roja_activa:      # RF-01 a RF-04
    nivel_final = "ROJO"
elif regla_critica_amarilla_activa: # RF-05 a RF-07
    nivel_final = max("AMARILLO", nivel_por_score)
else:
    nivel_final = nivel_por_score   # Verde / Amarillo / Rojo según tabla
```

---

## Puntuación máxima posible por categoría

| Categoría | Señales | Pts máx. |
|---|---|---|
| Documentación | SIG-008, SIG-011 | 14 |
| Red de actores | SIG-007 | 10 |
| Frecuencia asegurado/conductor | SIG-003, SIG-005 | 16 |
| Temporalidad | SIG-001, SIG-002, SIG-012 | 21 |
| Vehículo | SIG-004, SIG-006 | 12 |
| NLP / Narrativa | SIG-013 | 8 |
| Evidencia / Dinámica | SIG-009, SIG-010 | 12 |
| Montos | SIG-014 | 5 |
| **Total acumulable** | | **≥ 98 → techo 100** |
