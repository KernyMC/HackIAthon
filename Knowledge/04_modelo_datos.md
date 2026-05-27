# Modelo de Datos – Tablas y Campos para Detección de Fraude

**doc_id:** DOC-FRAUD-DATA-004  
**version:** v1.0  
**fuente:** hackIAthon – Reto Aseguradora del Sur, Sección 6  
**categoría:** Modelo de Datos

> Todos los datos deben ser **sintéticos o públicos**. Ningún campo debe contener información personal identificable real.

---

## TBL-001 – SINIESTROS

**categoría:** Modelo de Datos – Siniestros  
**keywords:** siniestro, tabla principal, ramo, cobertura, monto, fecha, estado, campo  
**descripción:** Tabla principal. Un registro por siniestro reportado. Es la tabla central del modelo de detección.

| Campo | Tipo | Descripción | Req. |
|---|---|---|---|
| `id_siniestro` | VARCHAR(20) | PK. Identificador único del siniestro | ✓ |
| `id_poliza` | VARCHAR(20) | FK → Pólizas | ✓ |
| `id_asegurado` | VARCHAR(20) | FK → Asegurados. Anónimo | ✓ |
| `ramo` | VARCHAR(50) | Vehículos \| Salud \| Vida \| Generales \| Hogar | ✓ |
| `cobertura` | VARCHAR(50) | Choque \| Robo \| PTxRB \| Atención médica \| Incendio | ✓ |
| `fecha_ocurrencia` | DATE | Fecha del evento | ✓ |
| `fecha_reporte` | DATE | Fecha de notificación a la aseguradora | ✓ |
| `monto_reclamado` | DECIMAL | Valor solicitado por el asegurado o proveedor | ✓ |
| `monto_estimado` | DECIMAL | Valor estimado por la aseguradora | — |
| `monto_pagado` | DECIMAL | Valor efectivamente pagado | — |
| `estado` | VARCHAR(30) | Reserva \| Pago Total \| Pago Parcial \| Negativa \| Cierre | ✓ |
| `sucursal` | VARCHAR(50) | Sucursal donde se tramita | — |
| `descripcion` | TEXT | Texto libre del reclamo. Usado en análisis NLP | ✓ |
| `documentos_completos` | BOOLEAN | Indicador Sí/No de completitud documental | ✓ |
| `beneficiario` | VARCHAR(50) | Tipo: Taller \| Clínica \| Perito \| Otro | — |
| `dias_desde_inicio_poliza` | INTEGER | Días entre inicio de póliza y siniestro. Campo derivado | ✓ |
| `dias_desde_fin_poliza` | INTEGER | Días entre fin de póliza y siniestro. Campo derivado | ✓ |
| `dias_entre_ocurrencia_reporte` | INTEGER | Diferencia entre ocurrencia y reporte. Campo derivado | ✓ |
| `historial_siniestros_asegurado` | INTEGER | Número de siniestros previos del asegurado | ✓ |
| `etiqueta_fraude_simulada` | INTEGER | 0/1. Solo para entrenamiento supervisado | — |

---

## TBL-002 – PÓLIZAS

**categoría:** Modelo de Datos – Pólizas  
**keywords:** póliza, vigencia, prima, suma asegurada, deducible, inicio, fin, canal  
**descripción:** Información de las pólizas contratadas. Permite cruzar vigencia y condiciones con los siniestros.

| Campo | Tipo | Descripción | Req. |
|---|---|---|---|
| `id_poliza` | VARCHAR(20) | PK. Identificador único de la póliza | ✓ |
| `id_asegurado` | VARCHAR(20) | FK → Asegurados | ✓ |
| `ramo` | VARCHAR(50) | Ramo de la póliza | ✓ |
| `fecha_inicio` | DATE | Inicio de vigencia | ✓ |
| `fecha_fin` | DATE | Fin de vigencia | ✓ |
| `prima` | DECIMAL | Prima anual | ✓ |
| `suma_asegurada` | DECIMAL | Valor máximo cubierto | ✓ |
| `deducible` | DECIMAL | Monto deducible aplicable | — |
| `canal_venta` | VARCHAR(30) | Directo \| Agente \| Broker \| Digital | — |
| `ciudad` | VARCHAR(50) | Ciudad de emisión | — |
| `estado_poliza` | VARCHAR(20) | Activa \| Vencida \| Cancelada \| Suspendida | ✓ |

---

## TBL-003 – ASEGURADOS

**categoría:** Modelo de Datos – Asegurados  
**keywords:** asegurado, perfil sintético, segmento, antigüedad, reclamos, lista restrictiva  
**descripción:** Perfiles sintéticos de asegurados. Sin datos personales reales. Permite análisis de comportamiento histórico.

| Campo | Tipo | Descripción | Req. |
|---|---|---|---|
| `id_asegurado` | VARCHAR(20) | PK. Anónimo | ✓ |
| `segmento` | VARCHAR(30) | Natural \| Jurídico | — |
| `antiguedad_anos` | INTEGER | Años como cliente | — |
| `ciudad` | VARCHAR(50) | Ciudad de residencia | — |
| `num_polizas_activas` | INTEGER | Número de pólizas activas | — |
| `reclamos_ultimos_12m` | INTEGER | Siniestros reportados en los últimos 12 meses | ✓ |
| `mora_actual` | BOOLEAN | Indicador de mora en primas | — |
| `score_cliente_simulado` | DECIMAL | Score interno del cliente (sintético) | — |
| `en_lista_restrictiva` | BOOLEAN | Coincidencia con lista restrictiva | ✓ |

---

## TBL-004 – PROVEEDORES / BENEFICIARIOS

**categoría:** Modelo de Datos – Proveedores  
**keywords:** proveedor, taller, clínica, perito, lista restrictiva, monto promedio, alertas, red  
**descripción:** Talleres, clínicas, peritos y otros prestadores asociados a siniestros. Clave para detectar redes de fraude.

| Campo | Tipo | Descripción | Req. |
|---|---|---|---|
| `id_proveedor` | VARCHAR(20) | PK | ✓ |
| `tipo` | VARCHAR(30) | Taller \| Clínica \| Perito \| Otro | ✓ |
| `ciudad` | VARCHAR(50) | Ciudad de operación | — |
| `reclamos_asociados` | INTEGER | Total de siniestros donde apareció | ✓ |
| `monto_promedio` | DECIMAL | Monto promedio reclamado en sus casos | — |
| `pct_casos_observados` | DECIMAL | Porcentaje de sus casos con alertas activas | ✓ |
| `antiguedad_anos` | INTEGER | Años en el registro de la aseguradora | — |
| `en_lista_restrictiva` | BOOLEAN | Aparece en lista restrictiva | ✓ |

---

## TBL-005 – DOCUMENTOS

**categoría:** Modelo de Datos – Documentos  
**keywords:** documento, denuncia, factura, informe, inconsistencia, legible, fecha, alteración  
**descripción:** Registro de documentos asociados a cada siniestro. Incluye indicadores de calidad e inconsistencias para detección de adulteración.

| Campo | Tipo | Descripción | Req. |
|---|---|---|---|
| `id_documento` | VARCHAR(20) | PK | ✓ |
| `id_siniestro` | VARCHAR(20) | FK → Siniestros | ✓ |
| `tipo_documento` | VARCHAR(50) | Denuncia \| Factura \| Informe \| Fotografía \| Otro | ✓ |
| `entregado` | BOOLEAN | Indica si fue entregado | ✓ |
| `legible` | BOOLEAN | Indica si es legible | ✓ |
| `fecha_emision` | DATE | Fecha del documento. Clave para detectar alteración | ✓ |
| `inconsistencia_detectada` | BOOLEAN | Marcado por sistema o analista | ✓ |
| `observacion` | TEXT | Texto libre de la observación del analista | — |

---

## Relaciones entre tablas

```
SINIESTROS ──── id_poliza ────→ PÓLIZAS
SINIESTROS ──── id_asegurado ──→ ASEGURADOS
SINIESTROS ──── beneficiario ──→ PROVEEDORES (via id_proveedor)
SINIESTROS ──── id_siniestro ──→ DOCUMENTOS (1:N)
PÓLIZAS    ──── id_asegurado ──→ ASEGURADOS
```

## Campos derivados clave para el scoring

| Campo derivado | Fórmula | Señal que activa |
|---|---|---|
| `dias_desde_inicio_poliza` | `fecha_ocurrencia - polizas.fecha_inicio` | SIG-001, RF-05 |
| `dias_desde_fin_poliza` | `polizas.fecha_fin - fecha_ocurrencia` | SIG-001, RF-05 |
| `dias_entre_ocurrencia_reporte` | `fecha_reporte - fecha_ocurrencia` | SIG-002, SIG-012, RF-06 |
| `historial_siniestros_asegurado` | COUNT siniestros del asegurado en 18 meses | SIG-003 |
| `similitud_narrativa` | cosine_similarity(descripcion, corpus) | SIG-013, RF-07 |
