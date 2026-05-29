# Rúbrica de Alertas — FraudSweep

**Proyecto:** Detector de Posibles Fraudes en Siniestros  
**Evento:** HackIAthon 2026 · Aseguradora del Sur  
**Versión:** 1.0 · Mayo 2026

---

## 1. Principio de funcionamiento

El sistema evalúa cada siniestro contra un conjunto de reglas predefinidas. Cuando una condición se cumple, se activa una **alerta** que:

1. Suma puntos al `score_reglas` (contribuye al score final)
2. Genera un mensaje explicativo en lenguaje natural almacenado en `alertas_activadas` (JSONB)
3. Es visible para el analista en el dashboard y en el detalle del siniestro

Las alertas son **aditivas**: múltiples señales se acumulan. Un siniestro puede tener varias alertas simultáneas.

---

## 2. Reglas críticas del dataset de producción (RF-01 a RF-07)

Estas reglas siguen exactamente la nomenclatura del reto del HackIAthon:

### RF-01 — Siniestro cercano al inicio de póliza

| Campo | Valor |
|-------|-------|
| **Código** | RF-01 |
| **Clasificación** | Rojo Alto (crítica) |
| **Variable evaluada** | `dias_desde_inicio_poliza` |
| **Condición** | `dias_desde_inicio_poliza <= 90` |
| **Puntos** | +30 pts |
| **Mensaje generado** | `"Siniestro ocurrido N días después del inicio de póliza (umbral: 90)"` |
| **Justificación** | Un siniestro en los primeros 90 días es una señal de posible fraude premeditado: el asegurado podría haber contratado la póliza con intención de reclamar. |
| **Frecuencia en dataset** | Activada en casos de alta similitud temporal con inicio de vigencia |

**Escala de puntos (referencia del reto):**
- `≤ 10 días desde inicio:` máximo riesgo
- `11–30 días:` riesgo alto
- `31–90 días:` riesgo moderado

---

### RF-02 — Proveedor en lista restrictiva

| Campo | Valor |
|-------|-------|
| **Código** | RF-02 |
| **Clasificación** | Rojo Alto (crítica) |
| **Variable evaluada** | `proveedor_en_lista_restrictiva` (join con `claims.proveedores`) |
| **Condición** | `en_lista_restrictiva = TRUE` |
| **Puntos** | +35 pts |
| **Mensaje generado** | `"Proveedor 'NOMBRE' figura en lista restrictiva"` |
| **Justificación** | Un proveedor (taller, clínica, perito) en lista de observados tiene historial de casos irregulares. Su presencia en el siniestro es la señal individual de mayor peso. |
| **Frecuencia en dataset** | 97 casos activados (9.4% del portafolio) |

---

### RF-03 — Monto elevado para el ramo

| Campo | Valor |
|-------|-------|
| **Código** | RF-03 |
| **Clasificación** | Rojo Alto (crítica) |
| **Variable evaluada** | `monto_reclamado` vs umbral por ramo |
| **Condición** | `monto_reclamado > umbral_ramo × 1.5` |
| **Puntos** | +20 pts |
| **Mensaje generado** | `"Monto $X supera 1.5× el umbral de RAMO ($UMBRAL)"` |
| **Justificación** | Un monto muy superior al promedio del ramo puede indicar sobrevaloración del daño, complicidad con el proveedor o sustitución de piezas. |
| **Frecuencia en dataset** | 61 casos activados |

**Umbrales por ramo (USD):**

| Ramo | Umbral base | Umbral de alerta (1.5×) |
|------|------------|------------------------|
| Automóvil | $50,000 | $75,000 |
| Salud | $80,000 | $120,000 |
| Vida | $200,000 | $300,000 |
| Hogar | $40,000 | $60,000 |
| Responsabilidad Civil | $100,000 | $150,000 |
| Robo | $30,000 | $45,000 |

---

### RF-04 — Documentación incompleta

| Campo | Valor |
|-------|-------|
| **Código** | RF-04 |
| **Clasificación** | Amarillo Medio |
| **Variable evaluada** | `documentos_completos` |
| **Condición** | `documentos_completos = FALSE` |
| **Puntos** | +10 pts |
| **Mensaje generado** | `"Documentación declarada como incompleta"` |
| **Justificación** | La falta de documentos requeridos (denuncia, factura, informe médico, fotos del daño) dificulta la verificación y puede ser intencional para evitar el cruce de información. |
| **Frecuencia en dataset** | 140 casos activados (13.6% del portafolio) |

---

### RF-05 — Reporte tardío

| Campo | Valor |
|-------|-------|
| **Código** | RF-05 |
| **Clasificación** | Amarillo Medio |
| **Variable evaluada** | `dias_entre_ocurrencia_reporte` |
| **Condición** | `dias_entre_ocurrencia_reporte > 15` |
| **Puntos** | +5 pts |
| **Mensaje generado** | `"Reporte tardío: N días después de la ocurrencia"` |
| **Justificación** | La demora prolongada entre el evento y la denuncia puede indicar fabricación o reacondicionamiento de evidencia. En robo, la demora > 48 horas es especialmente significativa. |
| **Frecuencia en dataset** | 53 casos (reporte > 7 días) + 209 casos (reporte 4–7 días) |

**Escala de puntos:**
- `> 7 días:` +5 pts (alerta Reporte tardío mayor a 7 días)
- `4–7 días:` alerta informativa (Reporte tardío entre 4 y 7 días)
- `≤ 3 días:` sin alerta

---

### RF-06 — Demora atípica en denuncia de robo

| Campo | Valor |
|-------|-------|
| **Código** | RF-06 |
| **Clasificación** | Amarillo Medio |
| **Variable evaluada** | `dias_entre_ocurrencia_reporte` en siniestros de ramo Robo |
| **Condición** | `dias_entre_ocurrencia_reporte > 2` AND `ramo = 'Robo'` |
| **Puntos** | +8 pts (> 48 horas) / +4 pts (24–48 horas) |
| **Mensaje generado** | `"Demora denuncia por robo mayor a 48 horas"` |
| **Justificación** | En robo, la denuncia inmediata es esperada (trámite policial). La demora sugiere preparación del relato o fabricación del evento. |
| **Frecuencia en dataset** | 84 casos (> 48h) + 64 casos (24–48h) = 148 casos |

---

### RF-07 — Narrativa similar a otro reclamo (Narrativa Clonada)

| Campo | Valor |
|-------|-------|
| **Código** | RF-07 |
| **Clasificación** | Rojo Alto (crítica) |
| **Variable evaluada** | `similitud_coseno_simulada` en `claims.narrativas_similares` |
| **Condición** | `similitud_coseno_simulada >= 0.85` |
| **Puntos** | +8 pts (> 85% similitud) / +4 pts (70–84%) |
| **Mensaje generado** | `"Narrativa con similitud mayor a 85% frente a otro reclamo"` |
| **Técnica** | TF-IDF vectorizado + similitud coseno entre pares de descripciones |
| **Justificación** | Relatos casi idénticos entre distintos asegurados y/o vehículos son una señal de fraude coordinado: anillos de fraude, talleres cómplices o reutilización de narrativas antiguas. |
| **Frecuencia en dataset** | 53 casos activados (similitud > 85%) |

---

## 3. Alertas adicionales del dataset de producción

Además de las 7 reglas críticas, el sistema detecta y registra estas señales en el dataset sintético:

| Alerta | Frecuencia | Descripción |
|--------|-----------|-------------|
| Alta frecuencia de reclamos del asegurado | 325 | Asegurado con ≥ 3 siniestros en 18 meses |
| Antecedente de reclamo solo RC | 232 | Historial previo exclusivamente en Responsabilidad Civil |
| Alta frecuencia de reclamos del vehículo | 231 | Vehículo con ≥ 3 siniestros en 18 meses |
| Proveedor recurrente en casos observados | 204 | Proveedor asociado a múltiples casos observados |
| Frecuencia moderada — asegurado | 174 | Asegurado con 2 siniestros en 18 meses |
| Frecuencia moderada — vehículo | 163 | Vehículo con 2 siniestros en 18 meses |
| Documentos inconsistentes | 104 | Fechas no coinciden o valores diferentes en documentos |
| Frecuencia moderada — conductor | 103 | Conductor presente en 2 siniestros en 18 meses |
| Demora denuncia robo > 48h | 84 | Ver RF-06 |
| Monto alto frente a suma asegurada | 61 | Reclamo ≥ 95% de la cobertura contratada |
| Relato ilógico frente al tipo de impacto | 57 | Descripción incompatible con la dinámica declarada |
| Borde de vigencia (días 11–30) | 56 | Siniestro entre día 11 y 30 desde inicio de póliza |
| Evento sin tercero identificado | 55 | Daño sin rastro del tercero ni evidencia de cámaras |
| Reporte tardío > 7 días | 53 | Ver RF-05 escala alta |
| Narrativa similar > 85% | 53 | Ver RF-07 |

**Total de alertas generadas en el portafolio:** 2.575 sobre 1.027 siniestros (promedio: 2.5 alertas por caso)

---

## 4. Cómo se presenta la alerta al analista

### En el dashboard
Cada siniestro Rojo o Amarillo muestra un badge de color y el score. Al hacer clic en el caso:

- **Score Final** visible en gauge semicircular (0–100)
- **Lista de alertas** con texto en lenguaje natural
- **Reglas críticas activadas** como tags (RF-01, RF-02, etc.)
- **Acción sugerida** según el nivel de riesgo

### En la API (respuesta JSON)
```json
{
  "id_siniestro": "SIN-00001",
  "score_final": 85.0,
  "nivel_riesgo": "Rojo Alto",
  "alertas_activadas": [
    "Siniestro ocurrido 5 días después del inicio de póliza (umbral: 90)",
    "Proveedor 'Norte Automotriz' figura en lista restrictiva",
    "Documentación declarada como incompleta"
  ],
  "reglas_criticas_activadas": ["RF-01", "RF-02", "RF-04"],
  "accion_sugerida": "Escalar a equipo de antifraude — no pagar sin aprobación"
}
```

### En el agente IA
El analista puede preguntar en lenguaje natural:
> "¿Por qué el siniestro SIN-00001 tiene nivel Rojo Alto?"

El agente responde citando exactamente las alertas activadas, el score de cada componente y qué documentos faltan.

---

## 5. Umbrales configurables

Los umbrales están diseñados para ser ajustables sin cambiar código:

| Parámetro | Valor actual | Cómo ajustar |
|-----------|-------------|-------------|
| Días inicio póliza (RF-01) | 90 días | Constante en `scoring.py` |
| Puntos RF-01 | 30 pts | Constante en `scoring.py` |
| Multiplicador monto (RF-03) | 1.5× | Constante en `scoring.py` |
| Puntos RF-03 | 20 pts | Constante en `scoring.py` |
| Umbral similitud narrativas (RF-07) | 0.85 | Parámetro en `listar_narrativas_similares()` |
| Días reporte tardío (RF-05) | 15 días | Constante en `scoring.py` |
| Umbral Rojo Alto | 70 pts | Función `clasificar()` en `scoring.py` |
| Umbral Amarillo Medio | 40 pts | Función `clasificar()` en `scoring.py` |

En producción, estos valores se moverían a una tabla de configuración en la base de datos para que la unidad de antifraude pueda calibrarlos sin intervención de desarrollo.

---

## 6. Ética y límites del sistema de alertas

- **No es una acusación.** La activación de alertas indica que un caso merece revisión, no que el asegurado cometió fraude.
- **No rechaza siniestros.** Ninguna alerta, ni su combinación, genera un rechazo automático.
- **Falsos positivos esperados.** Un siniestro Rojo puede ser perfectamente legítimo. Las reglas detectan anomalías estadísticas, no certezas.
- **Trazabilidad total.** Cada alerta queda almacenada en la base de datos con marca de tiempo, visible para auditoría.
- **Revisión humana obligatoria.** El flujo de revisión humana (Kanban por analista especializado) es parte central del sistema, no un añadido opcional.

---

*FraudSweep · HackIAthon 2026 · Aseguradora del Sur*
