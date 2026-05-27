# Ética, Privacidad y Limitaciones del Sistema FraudIA

**doc_id:** DOC-BUSINESS-007
**version:** hackathon_v1
**doc_type:** etica_limitaciones
**categoría:** Ética y Gobernanza de IA

> Este documento establece los principios éticos, las protecciones de privacidad y las limitaciones técnicas y operativas del sistema FraudIA Claims Assistant. Es de lectura obligatoria para todos los usuarios del sistema.

---

## 1. Principios Éticos Fundamentales

### 1.1 El sistema no acusa

FraudIA nunca afirma que un asegurado, proveedor, conductor o beneficiario cometió fraude. El sistema genera alertas de revisión basadas en señales estadísticas, no veredictos de culpabilidad.

El lenguaje del sistema siempre usa términos como:
- "posible riesgo"
- "señal de alerta"
- "requiere revisión humana"
- "caso para investigación"
- "anomalía detectada"

El lenguaje que el sistema **nunca usa**:
- "este asegurado es un fraude"
- "el proveedor realizó fraude"
- "siniestro rechazado automáticamente por fraude"
- "fraude confirmado"

### 1.2 La decisión final siempre es humana

FraudIA es una herramienta de apoyo a la decisión. Ningún siniestro se rechaza automáticamente. Ninguna persona es acusada automáticamente. Toda decisión de negativa, pago o denuncia requiere la evaluación y firma de un analista humano calificado.

El sistema puede sugerir acciones (escalar, revisar, tramitar), pero no puede ejecutarlas por sí solo.

### 1.3 Transparencia del score

Cada score tiene un desglose explicable. El analista siempre puede ver:
- Cuáles señales se activaron
- Cuántos puntos sumó cada señal
- Por qué se asignó el nivel de riesgo
- Cuál es la acción sugerida y su justificación

No hay "cajas negras" en el componente de reglas (SIG-001 a SIG-014). El componente del modelo simulado tiene menor transparencia, pero su peso es solo del 40%.

### 1.4 Presunción de buena fe

Todos los asegurados, conductores y proveedores son tratados como actores de buena fe hasta que la investigación humana determine lo contrario. Un score alto no es una condena. Es una señal de que se requiere más información.

### 1.5 Proporcionalidad

La intensidad de la investigación debe ser proporcional al nivel de riesgo y al monto involucrado. No se justifica una investigación de campo exhaustiva para un siniestro de bajo monto con score 45 (Amarillo bajo).

---

## 2. Privacidad y Protección de Datos

### 2.1 Datos completamente sintéticos

El dataset utilizado en el sistema FraudIA del hackathon es 100% sintético. No contiene:
- Nombres reales de personas
- Números de cédula o identificación real
- Placas de vehículos reales
- Direcciones reales
- Datos de salud de personas reales
- Información financiera personal real

Los identificadores (id_asegurado, id_conductor, id_vehiculo) son códigos alfanuméricos generados aleatoriamente sin ninguna vinculación con personas reales.

### 2.2 Hacheo de datos sensibles

Los datos que en producción serían sensibles (placa del vehículo, número de chasis, número de motor) están hacheados en el sistema:
- `placa_hash`: hash SHA-256 de la placa real
- `chasis_hash`: hash SHA-256 del chasis real
- `motor_hash`: hash SHA-256 del motor real

Esto permite correlacionar vehículos entre siniestros sin exponer los valores reales.

### 2.3 Sin datos de salud

El sistema no procesa datos de salud reales. Los siniestros del ramo Salud en el dataset sintético usan únicamente montos y fechas ficticios, sin diagnósticos ni tratamientos reales.

### 2.4 Retención de datos de chat

Las conversaciones con el agente FraudIA se almacenan en `app.chat_messages` para trazabilidad y auditoría. En producción, se debe definir una política de retención y eliminar registros según los plazos legales aplicables.

### 2.5 Acceso controlado

En producción, el sistema debe implementar:
- Autenticación de usuarios con roles diferenciados (analista, investigador, jefe, admin)
- Logs de acceso a datos sensibles
- Restricción de queries directas a la base de datos a roles técnicos autorizados
- Cifrado de datos en tránsito (HTTPS) y en reposo

**Nota para el hackathon:** La API está configurada como `--allow-unauthenticated` en Cloud Run para facilitar la demo. En producción, esto debe cambiar a autenticación con Google IAP o similar.

---

## 3. Limitaciones Técnicas del Sistema

### 3.1 El score es probabilístico, no determinístico

El score final incluye un componente del modelo simulado (40% del peso) que es una estimación estadística. Esto significa que:
- Dos siniestros idénticos en señales de reglas pueden tener scores diferentes
- El score puede variar si se actualizan los datos del asegurado o proveedor
- Un score bajo no garantiza que el siniestro sea legítimo

### 3.2 Las señales son indicadores, no pruebas

La activación de una señal (por ejemplo, SIG-001 por borde de vigencia) no prueba que el siniestro sea irregular. Hay razones legítimas por las que un asegurado puede necesitar usar su póliza recién contratada:
- Accidentes genuinos pueden ocurrir el primer día de cobertura
- Robos ocurren independientemente de cuándo se contrató la póliza

### 3.3 Cobertura limitada de señales

El sistema evalúa 14 señales predefinidas. Existen patrones de fraude que no están cubiertos por estas señales y que no serán detectados automáticamente. El analista humano es la última línea de defensa.

### 3.4 Calidad de los datos de entrada

El sistema depende de la calidad y completitud de los datos ingresados. Si los campos clave (`fecha_ocurrencia`, `monto_reclamado`, `id_proveedor`) están incompletos o tienen errores, el score puede ser incorrecto. "Garbage in, garbage out."

### 3.5 El análisis NLP es aproximado

La detección de narrativas similares (SIG-005, RF-07) usa similitud TF-IDF con coseno. Esta técnica:
- Puede generar falsos positivos si dos siniestros usan vocabulario estándar de seguros
- No captura similitudes semánticas profundas (dos narrativas con el mismo significado pero diferente redacción)
- Requiere un corpus suficientemente grande para ser confiable

### 3.6 La Lista Restrictiva puede estar desactualizada

La Lista Restrictiva es un registro estático que se actualiza manualmente. Puede no incluir actores que recientemente comenzaron actividades fraudulentas. La ausencia de un actor en la lista no significa que sea confiable.

### 3.7 Latencia en detección de redes

La detección de redes de fraude organizado (múltiples asegurados, mismo proveedor) requiere análisis conjunto de múltiples siniestros. El sistema actual analiza señales por siniestro individual. La detección de redes complejas requiere herramientas adicionales de análisis de grafos.

---

## 4. Consideraciones sobre Sesgo

### 4.1 Sesgo de selección en el entrenamiento

El modelo simulado fue entrenado sobre datos sintéticos que pueden no representar fielmente la distribución real de fraudes en el mercado ecuatoriano. Los patrones aprendidos pueden no generalizar perfectamente a la cartera real.

### 4.2 Sesgo geográfico

Si ciertas ciudades tienen históricamente más fraudes detectados, el sistema puede asignar más alertas a siniestros de esas ciudades, lo que puede crear un ciclo de sesgo donde se detectan más fraudes ahí simplemente porque se busca más ahí.

### 4.3 Sesgo por canal de venta

Los siniestros de ciertos canales de venta (por ejemplo, digital) pueden tener perfiles de riesgo diferentes a los de venta directa. El modelo debe ser validado separadamente por canal.

### 4.4 Mitigation

- El componente de reglas (60%) es transparente y no tiene sesgo estadístico implícito
- Todos los scores deben revisarse periódicamente para detectar patrones de sesgo
- Los analistas deben recibir capacitación sobre las limitaciones del sistema
- Los casos rechazados por el sistema deben ser auditados regularmente

---

## 5. Lo que el Sistema NO Puede Hacer

1. **No puede confirmar que un siniestro es fraudulento.** Solo identifica señales de riesgo.
2. **No puede rechazar automáticamente un siniestro.** Esa es una decisión humana.
3. **No puede acusar a una persona.** Solo señala comportamientos estadísticamente atípicos.
4. **No puede reemplazar la investigación de campo.** Los hallazgos del sistema deben ser corroborados con evidencia física.
5. **No puede detectar todos los fraudes.** Los fraudes sofisticados que no activan ninguna señal pasarán desapercibidos.
6. **No puede operar con datos incompletos de forma confiable.** Si los campos clave están vacíos, el score es poco confiable.
7. **No puede garantizar la exactitud del NLP.** El análisis de narrativas es aproximado y puede generar errores.
8. **No puede sustituir el criterio del analista experto.** La experiencia humana es irreemplazable en casos complejos.

---

## 6. Notas de Cumplimiento Normativo

El sistema FraudIA fue diseñado considerando los siguientes principios normativos aplicables en Ecuador:

- **Ley Orgánica de Protección de Datos Personales (LOPDP):** El sistema no procesa datos personales reales. En producción, el tratamiento de datos debe cumplir con los principios de la LOPDP.
- **Resolución de la Superintendencia de Compañías de Seguros y Reaseguros:** Los procesos de negativa de siniestros deben estar debidamente documentados y justificados. El sistema provee el soporte documental de alertas, pero la decisión final debe seguir el proceso regulatorio.
- **Principio de no discriminación:** El sistema no usa variables protegidas (origen étnico, religión, orientación sexual) para el scoring. Las variables de riesgo son todas objetivas y relacionadas con el comportamiento en la póliza.

---

## 7. Declaración de Uso Responsable

Al usar FraudIA Claims Assistant, el analista acepta:

1. Usar el sistema como herramienta de apoyo, no como sustituto del juicio profesional.
2. No comunicar a los asegurados o proveedores que "el sistema los marcó como fraude".
3. Mantener la confidencialidad de los scores y alertas generados por el sistema.
4. Documentar sus decisiones independientemente de lo que indique el sistema.
5. Reportar errores o comportamientos inesperados del sistema al equipo técnico.
6. Aplicar los mismos estándares de revisión a todos los casos del mismo nivel de riesgo.
