# Glosario de Seguros y Terminología del Sistema FraudIA

**doc_id:** DOC-BUSINESS-002
**version:** hackathon_v1
**doc_type:** glosario
**categoría:** Terminología

> Glosario de términos de seguros, fraude y scoring usados en el sistema FraudIA Claims Assistant. Las definiciones están adaptadas al contexto del mercado ecuatoriano y al ramo de vehículos, que es el ramo principal del dataset sintético.

---

## A. Términos Generales de Seguros

### Siniestro

Evento cubierto por una póliza de seguros que genera una obligación de pago por parte de la aseguradora. En el contexto de FraudIA, un siniestro es el registro central del sistema. Cada siniestro tiene un identificador único (`id_siniestro`), una póliza asociada, un asegurado, un vehículo, un conductor y un proveedor.

**Campos clave en el sistema:** `id_siniestro`, `fecha_ocurrencia`, `fecha_reporte`, `estado`, `monto_reclamado`

### Póliza

Contrato entre el asegurado y la aseguradora que define las coberturas, montos máximos (suma asegurada), deducibles y vigencia. La póliza determina si el siniestro es válido y cuánto puede pagarse.

**Campos clave:** `id_poliza`, `fecha_inicio`, `fecha_fin`, `suma_asegurada`, `prima`, `estado_poliza`

### Ramo

Categoría general del seguro. Los ramos principales son: Vehículos, Salud, Vida, Generales y Hogar. El dataset sintético de FraudIA contiene principalmente siniestros del ramo Vehículos.

**Valores posibles:** `Vehículos`, `Salud`, `Vida`, `Generales`, `Hogar`

### Cobertura

El tipo específico de riesgo cubierto dentro de un ramo. Por ejemplo, en el ramo Vehículos las coberturas incluyen: Choque, Robo, Pérdida Total por Robo (PTxRB), Responsabilidad Civil (RC), Volcadura.

**Valores comunes:** `Choque`, `Robo`, `PTxRB`, `RC`, `Atención médica`, `Incendio`, `Volcadura`

### Prima

El monto que el asegurado paga periódicamente (mensual, trimestral o anual) para mantener la cobertura. La prima se calcula en función del riesgo del asegurado, el valor del bien asegurado y las coberturas contratadas.

### Suma Asegurada

El valor máximo que la aseguradora puede pagar por un siniestro cubierto. Es el techo de la indemnización. En el ramo Vehículos, corresponde generalmente al valor comercial del vehículo.

**Campo clave:** `polizas.suma_asegurada`

### Deducible

Monto que el asegurado debe asumir antes de que la aseguradora cubra el resto. Si el deducible es $500 y el daño es $2.000, la aseguradora paga $1.500.

### Monto Reclamado

Valor solicitado por el asegurado o proveedor para cubrir los daños del siniestro. No necesariamente es el monto que se pagará, ya que está sujeto a revisión y deducibles.

**Campo clave:** `siniestros.monto_reclamado`

### Monto Pagado

Valor efectivamente desembolsado por la aseguradora al cierre del siniestro. Puede ser menor al monto reclamado por aplicación de deducibles, sublímites o ajustes por liquidación.

**Campo clave:** `siniestros.monto_pagado`

### Liquidación

Proceso de evaluación y determinación del monto que la aseguradora pagará por un siniestro. Incluye revisión documental, peritaje de daños y verificación de cobertura.

### Reserva

Monto que la aseguradora provisiona contablemente para cubrir siniestros en proceso de tramitación. Un siniestro en estado "Reserva" está siendo evaluado y aún no se ha tomado una decisión de pago.

**Estado del siniestro:** `Reserva`, `Pago Total`, `Pago Parcial`, `Negativa`, `Cierre`

### Beneficiario

Persona natural o jurídica que recibe el pago del siniestro. En vehículos puede ser el taller mecánico, el propio asegurado, la entidad financiera (si hay prenda), etc.

### Asegurado

Persona natural o jurídica titular de la póliza y del bien asegurado. En el sistema FraudIA todos los asegurados son identificadores sintéticos anónimos.

**Campo clave:** `id_asegurado`

---

## B. Términos del Ramo Vehículos

### PTxRB – Pérdida Total por Robo

Cobertura que indemniza al asegurado cuando su vehículo es robado y no es recuperado, o cuando el costo de recuperación supera el valor del vehículo. Es la cobertura de mayor monto promedio y la de mayor incidencia de fraude. El sistema FraudIA clasifica automáticamente como **Rojo Alto** todo siniestro con cobertura PTxRB (Regla RF-01).

### RC – Responsabilidad Civil

Cobertura que protege al asegurado ante daños causados a terceros (personas o vehículos) en un accidente donde el asegurado es responsable. Los siniestros de "solo RC" (sin daño al vehículo propio) son una señal de alerta cuando son frecuentes.

### Peritaje

Evaluación técnica de los daños del vehículo realizada por un perito o ajustador de siniestros. El informe de peritaje es un documento obligatorio en siniestros de choque y PTxRB.

### APS – Auxiliar de Producción de Seguros

Intermediario que facilita la contratación de pólizas entre el asegurado y la aseguradora. En algunos esquemas de fraude organizado, un APS puede estar involucrado en la fabricación de siniestros.

---

## C. Términos de Detección de Fraude

### Riesgo Moral (Moral Hazard)

Comportamiento del asegurado que, al estar cubierto por un seguro, toma más riesgos o actúa de forma menos cuidadosa de lo que lo haría sin cobertura. También incluye la tentación de reportar siniestros exagerados o falsos al tener póliza vigente.

### Fraude de Siniestro

Acto intencional de presentar un reclamo falso o exagerado para obtener una indemnización indebida. Puede ser cometido por el asegurado, el proveedor o ambos en colusión.

### Inflación de Reclamo

Variante del fraude donde el siniestro real ocurrió pero el monto reclamado es exagerado (más daños de los reales, repuestos no instalados, horas de trabajo no realizadas).

### Fraude Organizado

Red coordinada de actores (asegurados, talleres, ajustadores corruptos, APS) que fabrican o inflan siniestros de forma sistemática. Se detecta por patrones de narrativas similares, proveedores recurrentes con alta frecuencia de alertas y coincidencias entre asegurados y proveedores.

### Lista Restrictiva

Base de datos interna de la aseguradora que contiene asegurados, proveedores y otros actores con antecedentes de fraude comprobado o bajo investigación activa. Cualquier coincidencia con la Lista Restrictiva activa la Regla RF-03 y clasifica el caso como Rojo Alto automáticamente.

**Campo clave:** `proveedores.en_lista_restrictiva`, `asegurados.en_lista_restrictiva`

### Fraude Documental

Falsificación o alteración de documentos del siniestro: facturas con fechas alteradas, denuncias policiales modificadas, informes médicos falsificados. Activa la Regla RF-02 y clasifica como Rojo Alto.

### Narrativa Clonada

Descripción del siniestro que es idéntica o muy similar (>85% similitud textual) a la descripción de otro siniestro diferente. Indica fraude organizado donde se reutiliza el mismo relato. Activa la Regla RF-07.

---

## D. Términos del Sistema de Scoring

### Score de Riesgo

Número entre 0 y 100 que indica el nivel de riesgo de un siniestro. Se calcula sumando los puntos de las señales de riesgo activas (SIG-001 a SIG-014), con techo en 100. Fórmula del sistema FraudIA:

```
score_final = 0.6 × score_reglas + 0.4 × score_modelo_simulado
```

### Score de Reglas

Componente del score calculado por reglas determinísticas basadas en las 14 señales de riesgo. Peso: 60% del score final.

**Campo clave:** `siniestros.score_reglas`

### Score del Modelo Simulado

Componente del score generado por un modelo de machine learning simulado que captura patrones no lineales en los datos. Peso: 40% del score final.

**Campo clave:** `siniestros.score_modelo_simulado`

### Señal de Riesgo

Condición específica que, al activarse, suma puntos al score de riesgo. El sistema tiene 14 señales (SIG-001 a SIG-014). Cada señal tiene un puntaje máximo y criterios de activación específicos.

### Regla Crítica

Condición de negocio que clasifica automáticamente un caso en un nivel de riesgo determinado, independientemente del score numérico. El sistema tiene 7 reglas críticas (RF-01 a RF-07): cuatro de nivel Rojo y tres de nivel Amarillo mínimo.

### Override

Mecanismo por el cual una regla crítica sobreescribe la clasificación por score. Por ejemplo, un siniestro con score 25 (Verde) puede ser clasificado como Rojo si la cobertura es PTxRB (RF-01 activa).

### Nivel de Riesgo – Semáforo

**Verde Bajo (0-39):** Sin señales significativas. Flujo normal de tramitación.
**Amarillo Medio (40-69):** Señales moderadas. Requiere revisión documental por supervisor o Unidad Antifraude.
**Rojo Alto (70-100):** Múltiples señales graves. Requiere escalamiento inmediato a Unidad Antifraude para investigación especializada de campo.

### Alerta Activada

Señal de riesgo específica que se activó para un siniestro particular, con su puntaje y descripción. El sistema almacena todas las alertas activadas en formato JSON para cada siniestro.

**Campo clave:** `siniestros.alertas_activadas` (JSONB)

### Acción Sugerida

Recomendación del sistema basada en el nivel de riesgo y las alertas activadas: "Tramitar según flujo normal", "Escalar a supervisor", "Escalar a Unidad Antifraude inmediatamente".

**Campo clave:** `siniestros.accion_sugerida`

---

## E. Términos del Sistema RAG y Agente IA

### RAG – Retrieval Augmented Generation

Técnica de IA que combina recuperación de información (búsqueda en base de conocimiento) con generación de texto (modelo de lenguaje). El agente FraudIA usa RAG para responder preguntas sobre reglas, procesos y terminología buscando en documentos de negocio indexados vectorialmente en AlloyDB.

### Embedding

Representación vectorial de un texto que captura su significado semántico. El sistema usa el modelo `gemini-embedding-001` con dimensión 768 para convertir documentos y consultas en vectores y calcular similitud.

### Búsqueda Semántica

Búsqueda que encuentra documentos similares en significado (no solo en palabras clave) usando distancia coseno entre embeddings. Se usa en el RAG del sistema para recuperar reglas y definiciones relevantes.

### Tool (Herramienta del Agente)

Función Python que el agente IA puede llamar para obtener datos estructurados. El agente FraudIA tiene tools para consultar siniestros, proveedores, documentos y generar resúmenes ejecutivos.

### Agente Conversacional

Sistema de IA que mantiene un diálogo en lenguaje natural con el usuario, decide qué tools usar en cada turno y genera respuestas coherentes. El agente FraudIA está construido con Google ADK y Gemini 2.5 Flash.
