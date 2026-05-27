# Manual del Analista Antifraude – Guía de Uso del Sistema FraudIA

**doc_id:** DOC-BUSINESS-008
**version:** hackathon_v1
**doc_type:** manual_usuario
**categoría:** Guía Operativa

> Este manual explica cómo usar el sistema FraudIA Claims Assistant de forma efectiva. Está dirigido a analistas de liquidación, investigadores de antifraude y supervisores.

---

## 1. Acceso al Sistema

El sistema FraudIA tiene cuatro secciones principales accesibles desde el menú de navegación:

| Sección | URL | Propósito |
|---|---|---|
| Dashboard | /dashboard | KPIs de la cartera y gráficos |
| Siniestros | /siniestros | Tabla de casos con filtros |
| Proveedores | /proveedores | Ranking de proveedores por riesgo |
| Chat FraudIA | /chat | Agente conversacional IA |

---

## 2. Cómo Usar el Dashboard

El dashboard muestra el estado de la cartera en tiempo real. Las métricas principales son:

**Panel de KPIs (fila superior):**
- Total de siniestros analizados
- Casos Verde Bajo (flujo normal)
- Casos Amarillo Medio (revisión requerida)
- Casos Rojo Alto (escalamiento inmediato)
- Monto total reclamado en cartera
- Monto reclamado en casos Rojo Alto
- Score promedio de la cartera

**Gráfico de distribución por nivel:** Muestra la proporción de casos en cada nivel. Un porcentaje de Rojo superior al 15% puede indicar un problema sistémico o un período de mayor actividad fraudulenta.

**Top proveedores con alertas rojas:** Lista los proveedores que concentran más casos con nivel Rojo Alto. Son los actores de mayor prioridad para investigación.

**Top 10 siniestros por score:** Lista los 10 casos de mayor riesgo. Estos son los casos que deben revisarse primero cada mañana.

---

## 3. Cómo Usar la Tabla de Siniestros

### Navegación básica

La tabla muestra todos los siniestros ordenados por score descendente (mayor riesgo primero). Las columnas visibles son:

- ID del siniestro (enlace al detalle)
- Ramo y cobertura
- Ciudad
- Proveedor asociado
- Monto reclamado
- Score final (0-100)
- Nivel de riesgo (semáforo visual)
- Alertas principales
- Acción sugerida

### Filtros disponibles

**Por nivel de riesgo:** Seleccionar Verde, Amarillo o Rojo para ver solo casos de ese nivel.

**Por ramo:** Filtrar por Vehículos, Salud, Vida, etc.

**Por cobertura:** Filtrar por Choque, Robo, PTxRB, RC, etc.

**Por proveedor:** Filtrar por el ID del proveedor para ver todos sus casos.

**Por score mínimo:** Ingresar un número para ver solo casos con score igual o superior.

**Por texto libre:** Buscar por fragmentos de la narrativa del siniestro.

### Flujo de trabajo recomendado

1. Al inicio del día, aplicar filtro "Rojo Alto" para ver los casos urgentes.
2. Revisar el detalle de cada caso rojo y escalar a Unidad Antifraude según el proceso.
3. Luego revisar casos "Amarillo Medio" con score mayor a 60.
4. Al final del día, procesar los casos "Verde Bajo" pendientes.

---

## 4. Cómo Interpretar el Detalle de un Siniestro

Al hacer clic en un siniestro, se abre la pantalla de detalle que muestra:

### Panel de score y semáforo

El score final se muestra en grande con el color correspondiente (verde, amarillo, rojo). Debajo aparecen el score de reglas y el score del modelo simulado por separado.

**Cómo leer el score:**
- Score 0-39: El caso está dentro de los parámetros normales. Proceder con flujo estándar.
- Score 40-69: Hay señales que justifican revisión. No proceder al pago sin verificación.
- Score 70-100: Múltiples señales graves convergentes. No proceder al pago. Escalar.

### Panel de alertas activadas

Muestra cada señal activada con su código (SIG-001, etc.), descripción y puntos sumados. Por ejemplo:

```
SIG-001 – Reclamo Cercano al Borde de Vigencia: 8 puntos
  Detalle: El siniestro ocurrió 7 días después del inicio de la póliza.

SIG-003 – Alta Frecuencia del Asegurado: 8 puntos
  Detalle: El asegurado tiene 3 siniestros en los últimos 18 meses.

SIG-011 – Proveedor Recurrente Sospechoso: 5 puntos
  Detalle: El proveedor aparece en 4 casos observados en el año.
```

### Panel de reglas críticas

Si hay reglas críticas activas (RF-01 a RF-07), aparecen resaltadas con el nivel que activan:

```
RF-01 – Cobertura PTxRB: ROJO AUTOMÁTICO
  El siniestro corresponde a Pérdida Total por Robo.
  Requiere revisión especializada de campo. Escalar inmediatamente.
```

### Panel de documentos

Lista todos los documentos del siniestro con su estado:
- Entregado: Sí / No
- Legible: Sí / No
- Inconsistencia detectada: Sí / No
- Observación del analista (si existe)

Si hay documentos con `inconsistencia_detectada = Sí`, revisar con detalle antes de proceder.

### Botón "Explicar con IA"

Abre una ventana de chat preconfigurada con la pregunta "Explícame el siniestro [ID]" dirigida al agente FraudIA. El agente analizará el caso y explicará en lenguaje natural por qué tiene ese score y cuáles son las señales más preocupantes.

---

## 5. Cómo Usar el Chat FraudIA

El chat permite hacer preguntas en lenguaje natural al agente IA. El agente decide automáticamente si consulta la base de datos (SQL) o el conocimiento de negocio (RAG) o ambos.

### Preguntas sobre casos específicos

```
¿Por qué el siniestro SIN-000123 tiene nivel Rojo?
¿Qué documentos faltan en el siniestro SIN-000456?
¿Tiene el asegurado del siniestro SIN-000789 otros casos previos?
Explícame las alertas del siniestro SIN-000234.
```

### Preguntas sobre proveedores

```
¿Qué proveedores tienen más alertas rojas este mes?
¿El proveedor PRV-005 está en la Lista Restrictiva?
¿Cuál es el monto promedio reclamado por el proveedor PRV-010?
Muéstrame todos los siniestros del proveedor PRV-007.
```

### Preguntas sobre patrones y rankings

```
¿Cuáles son los 10 siniestros con mayor score de riesgo?
¿Qué siniestros ocurrieron dentro de los primeros 30 días de vigencia de la póliza?
¿Cuántos siniestros tienen narrativas similares a otros casos?
¿Qué patrones se repiten en los reclamos con score mayor a 80?
```

### Preguntas sobre reglas y terminología

```
¿Qué significa riesgo Amarillo?
¿Cuándo se activa la regla RF-03?
¿Qué documentos son obligatorios para un siniestro de PTxRB?
¿Cuál es la diferencia entre score de reglas y score del modelo?
¿Qué es la Lista Restrictiva?
```

### Preguntas de resumen ejecutivo

```
Genera un resumen ejecutivo de los casos críticos.
¿Cuáles son los hallazgos principales de la semana?
¿Qué casos debería revisar primero el analista hoy?
Resume los KPIs de la cartera actual.
```

### Cómo interpretar la respuesta del agente

El agente siempre muestra:
- La respuesta en texto claro en español
- Las herramientas usadas (SQL, RAG o ambas)
- Las fuentes consultadas (vista SQL, documento de conocimiento)

Si el agente no puede responder con los datos disponibles, lo indica claramente. No inventa datos.

---

## 6. Cómo Analizar un Caso Rojo Paso a Paso

### Paso 1: Ver el detalle del siniestro

Abrir el detalle del siniestro en /siniestros/[id]. Revisar:
- Score total y desglose
- Señales activadas y puntos
- Reglas críticas activas
- Estado de documentos

### Paso 2: Pedir explicación al agente

En el chat, preguntar: "Explícame el siniestro [ID] y dime cuáles son las alertas más preocupantes."

El agente combinará la información de la base de datos con el conocimiento de las reglas de negocio y explicará el caso de forma completa.

### Paso 3: Revisar los documentos

En el panel de documentos, identificar:
- Documentos faltantes → solicitar al asegurado
- Documentos con inconsistencias → revisar con analista documental
- Facturas con fecha anterior al siniestro → alerta de posible adulteración (RF-02)

### Paso 4: Revisar el historial del asegurado y proveedor

En el chat, preguntar:
- "¿Cuántos siniestros tiene el asegurado ASG-XXXX en los últimos 18 meses?"
- "¿El proveedor PRV-XXXX tiene antecedentes de alertas?"

### Paso 5: Verificar narrativas similares

Preguntar al agente: "¿Hay siniestros con narrativa similar al siniestro [ID]?"

Si hay similitudes altas, identificar los casos relacionados para análisis conjunto.

### Paso 6: Tomar la decisión

Con toda la información recopilada:
- Si la evidencia sugiere riesgo real: Escalar a Unidad Antifraude con el reporte de hallazgos.
- Si la evidencia no es concluyente: Solicitar documentación adicional y mantener en revisión.
- Si la evidencia es suficiente para proceder: Documentar la decisión y tramitar el pago.

---

## 7. Patrones Comunes en Reclamos Sospechosos

### Patrón A: Robo planificado

Señales características:
- Cobertura PTxRB (activa RF-01)
- Póliza muy reciente (días_desde_inicio_poliza < 30, activa SIG-001)
- Demora en la denuncia (dias_entre_ocurrencia_reporte > 2, activa SIG-002)
- Documentos incompletos (activa SIG-014)

Qué buscar: Verificar la denuncia policial. Cruzar con base de vehículos robados. Revisar si el vehículo tiene GPS activo y si hay registros de movimiento.

### Patrón B: Fraude con proveedor cómplice

Señales características:
- Proveedor en Lista Restrictiva (activa SIG-011 con 10 pts y RF-03)
- Documentos inconsistentes (activa SIG-010)
- Monto cercano a la suma asegurada (activa SIG-013)
- Factura con fecha inconsistente (activa SIG-010 con máximo puntaje)

Qué buscar: Visitar el proveedor. Verificar si los servicios descritos en la factura realmente se prestaron. Revisar si otros asegurados usaron el mismo proveedor con alertas similares.

### Patrón C: Asegurado recurrente

Señales características:
- Alta frecuencia del asegurado (historial_siniestros_asegurado >= 3, activa SIG-003 con 8 pts)
- Alta frecuencia del conductor (activa SIG-004)
- Posiblemente narrativas similares (activa SIG-005)

Qué buscar: Revisar el historial completo del asegurado. Identificar si siempre usa el mismo proveedor. Verificar si el conductor es el mismo o varía. Buscar posible fraude organizado.

### Patrón D: Fraude de borde de vigencia

Señales características:
- Siniestro en los primeros o últimos 10 días de vigencia (activa SIG-001 con 8 pts y posiblemente RF-05)
- Puede combinarse con cualquier cobertura

Qué buscar: Verificar si el asegurado contrató la póliza con urgencia inusual. Revisar si hay antecedentes en otra aseguradora. Verificar testimonios y evidencias del evento.

---

## 8. Preguntas Frecuentes del Analista

**P: ¿Un score de 0 significa que el siniestro es 100% legítimo?**
R: No. Significa que el sistema no detectó señales de riesgo con la información disponible. El analista siempre puede identificar irregularidades adicionales.

**P: ¿Puedo rechazar un siniestro basándome solo en el score?**
R: No. El score es un indicador. La negativa de un siniestro debe estar documentada con evidencia específica de que la cobertura no aplica o hay irregularidades concretas, siguiendo el proceso regulatorio.

**P: ¿Qué hago si el score dice Verde pero yo noto algo sospechoso?**
R: Confíe en su criterio. Eleve manualmente el caso a Amarillo o Rojo y documente el motivo. El sistema es una herramienta de apoyo, no un reemplazante del juicio profesional.

**P: ¿El agente puede equivocarse?**
R: Sí. El agente puede cometer errores, especialmente en preguntas complejas o ambiguas. Siempre verifique los datos críticos directamente en el sistema antes de tomar una decisión importante.

**P: ¿Puedo usar el chat para redactar un informe de investigación?**
R: Sí, puede pedirle al agente que genere un borrador de reporte sobre un caso. Sin embargo, debe revisar, verificar y firmar el reporte antes de enviarlo. El agente produce borradores, no documentos oficiales.

**P: ¿Qué significa que un proveedor tenga 30% de casos observados?**
R: Significa que el 30% de los siniestros donde participó ese proveedor tienen alguna alerta activa. Es una señal de que el proveedor puede estar involucrado en prácticas irregulares. Se activa SIG-011 con 5 puntos si supera el 2% de casos observados.

**P: ¿Cada cuánto se actualiza el score?**
R: El score se calcula al momento de registrar el siniestro y se puede recalcular si cambian datos relevantes (por ejemplo, si el proveedor se agrega a la Lista Restrictiva después del registro original).
