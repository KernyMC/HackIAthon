# Rúbrica de Score de Riesgo y Clasificación por Semáforo

**doc_id:** DOC-BUSINESS-004
**version:** hackathon_v1
**doc_type:** rubrica_score
**categoría:** Lógica de Clasificación
**fuente:** DOC-FRAUD-SCORE-003

> El score de riesgo genera una **alerta de revisión**, no una acusación de fraude. Toda decisión final es responsabilidad exclusiva del analista humano. El sistema nunca rechaza automáticamente un siniestro.

---

## 1. Fórmula de Cálculo del Score Final

El score final de cada siniestro se calcula combinando dos componentes:

```
score_final = 0.6 × score_reglas + 0.4 × score_modelo_simulado
```

**score_reglas:** Puntaje acumulado de las señales de riesgo activas (SIG-001 a SIG-014). Se obtiene sumando los puntos de cada señal que se activa para el siniestro. El rango es 0 a 100 (techo).

**score_modelo_simulado:** Puntaje generado por un modelo de machine learning que captura patrones no lineales en los datos. En el MVP del hackathon, este componente es una estimación simulada que complementa el score de reglas.

**Pesos:** El componente de reglas tiene mayor peso (60%) porque es transparente y explicable. El componente del modelo (40%) aporta capacidad de detección de patrones más complejos.

### Cálculo del score de reglas

```
score_reglas = MIN(100, SUM(puntos_señal_i)) para toda señal_i activada
```

El resultado se limita a 100 aunque la suma de todas las señales supere ese valor. Las reglas críticas (RF-01 a RF-07) no suman puntos al score numérico, sino que aplican un **override** sobre el nivel de clasificación.

### Puntuación máxima por categoría de señales

| Categoría | Señales involucradas | Puntos máximos |
|---|---|---|
| Documentación | SIG-010, SIG-014 | 14 |
| Red de actores / Proveedor | SIG-011 | 10 |
| Frecuencia asegurado y conductor | SIG-003, SIG-004 | 16 |
| Temporalidad | SIG-001, SIG-002, SIG-012 | 21 |
| Vehículo | SIG-006, SIG-007 | 12 |
| NLP / Narrativa | SIG-005 | 8 |
| Evidencia y dinámica | SIG-008, SIG-009 | 12 |
| Montos | SIG-013 | 5 |
| **Total acumulable** | | **más de 98 → techo 100** |

---

## 2. Clasificación por Semáforo de Riesgo

### Verde Bajo – Score 0 a 39

**keywords:** bajo, normal, sin alerta, flujo estándar, verde, Verde Bajo
**condición SQL:** `WHERE nivel_riesgo = 'Verde Bajo'`

**Descripción:** El siniestro no presenta señales de alerta significativas. La ausencia de señales activas o la baja acumulación de puntos indica que el caso se encuentra dentro del comportamiento esperado para el ramo y cobertura.

**Acción requerida:** Tramitar según el proceso estándar de liquidación. No requiere escalar a la Unidad Antifraude.

**Ejemplo de caso verde:** Asegurado con primera póliza, siniestro reportado al día siguiente, documentos completos, proveedor sin antecedentes, monto dentro del promedio del ramo.

**Nota importante:** Que un caso sea Verde no significa que no tenga ningún riesgo. Significa que con la información disponible no se activaron señales de alerta significativas. El analista siempre puede elevar un caso si detecta irregularidades adicionales no capturadas por el sistema.

---

### Amarillo Medio – Score 40 a 69

**keywords:** medio, amarillo, revisión documental, antifraude, alerta moderada, Amarillo Medio
**condición SQL:** `WHERE nivel_riesgo = 'Amarillo Medio'`

**Descripción:** Existen señales de alerta que requieren verificación documental antes de proceder al pago. La acumulación moderada de puntos indica anomalías que no son concluyentes por sí solas pero que requieren revisión especializada.

**Acción requerida:** Escalar a la Unidad Antifraude para revisión documental. El analista debe verificar la documentación del siniestro y cruzar variables antes de aprobar cualquier pago.

**Qué revisar en un caso amarillo:**
- Completitud y autenticidad de los documentos
- Coherencia del relato con los daños reportados
- Antecedentes del asegurado y el proveedor
- Monto reclamado versus promedio del ramo
- Vigencia y condiciones de la póliza

**Ejemplo de caso amarillo:** Asegurado con 2 siniestros en los últimos 18 meses (SIG-003: 4 pts) + siniestro reportado 5 días después de la ocurrencia (SIG-012: 3 pts) + monto cercano a la suma asegurada (SIG-013: 4 pts) = 11 pts en score de reglas → score_reglas = 11 → score_final aproximado = 30 con modelo. Si el modelo detecta anomalías adicionales, puede elevar el score a 45 y clasificar como Amarillo.

---

### Rojo Alto – Score 70 a 100

**keywords:** alto, rojo, revisión campo, especializada, investigación, suspender, Rojo Alto
**condición SQL:** `WHERE nivel_riesgo = 'Rojo Alto'`

**Descripción:** El siniestro presenta múltiples señales de riesgo graves o una sola señal de máxima gravedad. La alta acumulación de puntos indica convergencia de múltiples señales de riesgo.

**Acción requerida:** Escalar inmediatamente a la Unidad Antifraude para revisión especializada de campo. Requiere investigación física antes de cualquier pago. Considerar suspensión preventiva de la tramitación.

**Qué revisar en un caso rojo:**
- Inspección física del vehículo o bien asegurado (si aplica)
- Verificación de la denuncia policial con la autoridad competente
- Entrevista con el asegurado y el conductor
- Análisis pericial independiente de los daños
- Cruce con registros de otros siniestros del asegurado, conductor y proveedor
- Verificación de la vigencia real de la póliza al momento del evento
- Análisis de la narrativa versus la evidencia física

**Ejemplo de caso rojo:** Siniestro PTxRB (RF-01 activa → Rojo automático) + asegurado con 3 siniestros en 18 meses (SIG-003: 8 pts) + denuncia presentada 3 días después del robo (SIG-002: 8 pts) + documentos incompletos (SIG-014: 4 pts) = score_reglas muy alto + RF-01 clasifica como Rojo automáticamente.

---

## 3. Override por Reglas de Negocio Críticas

Las reglas críticas RF-01 a RF-07 modifican el nivel de clasificación independientemente del score numérico. El score numérico no cambia; solo cambia el nivel asignado.

### Reglas que fuerzan Rojo Alto automático

RF-01 (PTxRB), RF-02 (adulteración documental), RF-03 (Lista Restrictiva), RF-04 (dinámica imposible):

Estas cuatro reglas, al activarse, clasifican el caso como **Rojo Alto sin importar el score numérico**. Un siniestro con score de 20 (que normalmente sería Verde) se clasifica como Rojo si el proveedor está en la Lista Restrictiva.

### Reglas que fuerzan Amarillo Medio mínimo

RF-05 (borde de 48 horas), RF-06 (demora >4 días en robo), RF-07 (narrativa clonada):

Estas tres reglas elevan el caso a **Amarillo Medio como mínimo**. Si el score numérico ya clasifica el caso en Amarillo o Rojo, el nivel no baja. Solo aplica el efecto elevador cuando el score daría Verde.

### Lógica de aplicación del override

```python
# Pseudocódigo del sistema de clasificación
if alguna_regla_RF01_a_RF04_activa:
    nivel_riesgo = "Rojo Alto"
elif alguna_regla_RF05_a_RF07_activa:
    nivel_por_score = clasificar_por_score(score_final)
    nivel_riesgo = max("Amarillo Medio", nivel_por_score)
else:
    nivel_riesgo = clasificar_por_score(score_final)

# Función auxiliar
def clasificar_por_score(score):
    if score <= 39:
        return "Verde Bajo"
    elif score <= 69:
        return "Amarillo Medio"
    else:
        return "Rojo Alto"
```

---

## 4. Campos del Sistema Relacionados con el Score

| Campo | Tabla | Descripción |
|---|---|---|
| `score_reglas` | `claims.siniestros` | Puntaje de señales activas (0-100) |
| `score_modelo_simulado` | `claims.siniestros` | Puntaje del modelo ML simulado (0-100) |
| `score_final` | `claims.siniestros` | Score combinado final (0-100) |
| `nivel_riesgo` | `claims.siniestros` | Verde Bajo / Amarillo Medio / Rojo Alto |
| `alertas_activadas` | `claims.siniestros` | JSON con lista de alertas activas y sus puntos |
| `reglas_criticas_activadas` | `claims.siniestros` | JSON con reglas RF activas |
| `accion_sugerida` | `claims.siniestros` | Texto con la acción recomendada |

---

## 5. Interpretación Correcta del Score

### Lo que el score sí indica

- Cuántas señales de riesgo están activas y cuál es su peso acumulado
- Qué tan prioritario es revisar este caso en comparación con otros
- Qué señales específicas activaron la alerta
- Qué acción se sugiere según las reglas de negocio

### Lo que el score NO indica

- Que el siniestro sea fraudulento con certeza
- Que deba negarse automáticamente
- Que el asegurado sea una persona deshonesta
- Que el proveedor haya actuado de mala fe

### Ejemplo de interpretación correcta

"El siniestro SIN-000123 tiene un score final de 78 (Rojo Alto). Las principales señales activadas son: proveedor en Lista Restrictiva (10 pts), documentos inconsistentes (10 pts) y alta frecuencia del asegurado (8 pts). Este caso requiere revisión especializada de campo por parte de la Unidad Antifraude antes de cualquier pago."

### Ejemplo de interpretación incorrecta (NO usar)

"El siniestro SIN-000123 tiene un score de 78, por lo tanto es fraude y debe rechazarse."

---

## 6. Distribución Esperada de la Cartera

En una cartera de siniestros de vehículos con comportamiento mixto (legítimos y sospechosos), se espera aproximadamente:

| Nivel | Rango score | Porcentaje esperado |
|---|---|---|
| Verde Bajo | 0-39 | 65%-75% |
| Amarillo Medio | 40-69 | 15%-25% |
| Rojo Alto | 70-100 | 5%-15% |

Esta distribución puede variar según el perfil de la cartera, la región y el período analizado. La Unidad Antifraude concentra sus recursos en los casos Rojo y los Amarillo con alertas críticas activas.
