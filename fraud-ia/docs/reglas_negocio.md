# Reglas de Negocio — FraudSweep

## Principio general

Las reglas de negocio son condiciones **deterministas, auditables y explicables** que se evalúan sobre las variables de cada siniestro. Cuando una condición se cumple, se suman puntos al `score_reglas` y se genera un mensaje de alerta en lenguaje natural.

```
score_final = 0.6 × score_reglas + 0.4 × score_modelo_simulado
```

El `score_reglas` es la suma de todos los puntos activados (máximo 100).

---

## Reglas críticas (RF-01 a RF-07)

### RF-01 — Siniestro en borde de inicio de póliza

- **Condición:** `dias_desde_inicio_poliza <= 90`
- **Puntos:** +30
- **Clasificación:** Rojo Alto
- **Alerta generada:** `"Siniestro ocurrido N días después del inicio de póliza (umbral: 90)"`
- **Lógica:** Un siniestro en los primeros 90 días sugiere contratación con intención previa de reclamar.

### RF-02 — Proveedor en lista restrictiva

- **Condición:** `JOIN claims.proveedores WHERE en_lista_restrictiva = TRUE`
- **Puntos:** +35
- **Clasificación:** Rojo Alto
- **Alerta generada:** `"Proveedor 'NOMBRE' figura en lista restrictiva"`
- **Lógica:** Proveedores con historial de casos irregulares reciben el mayor peso individual del sistema.

### RF-03 — Monto superior al umbral del ramo

- **Condición:** `monto_reclamado > umbral_ramo × 1.5`
- **Puntos:** +20
- **Clasificación:** Rojo Alto
- **Alerta generada:** `"Monto $X supera 1.5× el umbral de RAMO ($UMBRAL)"`
- **Umbrales:** Automóvil $50k · Salud $80k · Vida $200k · Hogar $40k · RC $100k · Robo $30k

### RF-04 — Documentación incompleta

- **Condición:** `documentos_completos = FALSE`
- **Puntos:** +10
- **Clasificación:** Amarillo Medio
- **Alerta generada:** `"Documentación declarada como incompleta"`

### RF-05 — Reporte tardío

- **Condición:** `dias_entre_ocurrencia_reporte > 15`
- **Puntos:** +5
- **Clasificación:** Amarillo Medio
- **Alerta generada:** `"Reporte tardío: N días después de la ocurrencia"`

### RF-06 — Demora atípica en denuncia de robo

- **Condición:** `ramo = 'Robo' AND dias_entre_ocurrencia_reporte > 2`
- **Puntos:** +8 (> 48h) / +4 (24–48h)
- **Clasificación:** Amarillo Medio
- **Alerta generada:** `"Demora denuncia por robo mayor a 48 horas"`

### RF-07 — Narrativa clonada (similitud textual)

- **Condición:** `similitud_coseno_simulada >= 0.85` en `claims.narrativas_similares`
- **Puntos:** +8 (> 85%) / +4 (70–84%)
- **Clasificación:** Rojo Alto
- **Técnica:** TF-IDF vectorizado + similitud coseno
- **Alerta generada:** `"Narrativa con similitud mayor a 85% frente a otro reclamo"`

---

## Clasificación por score

| Rango | Nivel | Acción sugerida |
|-------|-------|-----------------|
| 0–39 | 🟢 Verde Bajo | Continuar flujo normal de aprobación |
| 40–69 | 🟡 Amarillo Medio | Solicitar revisión supervisora antes de pagar |
| 70–100 | 🔴 Rojo Alto | Escalar a equipo de antifraude — no pagar sin aprobación |

---

## Asignación automática de revisor por ramo

Cuando un caso se envía a revisión humana, se asigna automáticamente:

| Ramo | Revisor asignado |
|------|-----------------|
| Vehículos / Automóvil | Ana Morales · Especialista Automotriz |
| Salud / Accidentes Personales | Carlos Jiménez · Especialista Salud |
| Hogar / Robo | María Suárez · Especialista Bienes |
| Vida | Diego Paredes · Especialista Vida |
| Generales / RC | Lucía Vásquez · Especialista Generales |

---

## Nota ética

Ninguna regla, ni su combinación, genera un rechazo automático. Las reglas producen alertas orientativas para el analista humano, quien toma la decisión final.
