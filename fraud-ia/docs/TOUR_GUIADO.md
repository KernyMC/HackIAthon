# FraudIA — Tour Guiado para Colaboradores

> MVP de detección de posible fraude en siniestros para **Aseguradora del Sur**, construido en el HackIAthon GCP 2026.
> El sistema nunca acusa fraude ni rechaza siniestros automáticamente. Solo genera alertas para revisión humana.

---

## Tabla de contenidos

1. [Contexto del proyecto](#1-contexto-del-proyecto)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Cómo correr el proyecto localmente](#3-cómo-correr-el-proyecto-localmente)
4. [Arquitectura del sistema](#4-arquitectura-del-sistema)
5. [Tour por pantallas](#5-tour-por-pantallas)
   - 5.1 [Landing page](#51-landing-page)
   - 5.2 [Dashboard principal](#52-dashboard-principal)
   - 5.3 [Lista de siniestros](#53-lista-de-siniestros)
   - 5.4 [Detalle de siniestro](#54-detalle-de-siniestro)
   - 5.5 [Evaluar siniestro (ingreso manual)](#55-evaluar-siniestro-ingreso-manual)
   - 5.6 [Proveedores de riesgo](#56-proveedores-de-riesgo)
   - 5.7 [Chat con el agente IA](#57-chat-con-el-agente-ia)
   - 5.8 [Arquitectura técnica](#58-página-de-arquitectura-técnica)
6. [Sistema de scoring de riesgo](#6-sistema-de-scoring-de-riesgo)
7. [Flujo de revisión humana](#7-flujo-de-revisión-humana)
8. [Tablero Kanban](#8-tablero-kanban)
9. [Agente IA — herramientas disponibles](#9-agente-ia--herramientas-disponibles)
10. [APIs del backend](#10-apis-del-backend)
11. [Base de datos y esquemas](#11-base-de-datos-y-esquemas)
12. [Decisiones técnicas importantes](#12-decisiones-técnicas-importantes)
13. [Preguntas de demo recomendadas para el chat](#13-preguntas-de-demo-recomendadas-para-el-chat)

---

## 1. Contexto del proyecto

**FraudIA** es un complemento inteligente para el área de siniestros de una aseguradora. El problema que resuelve:

- Las aseguradoras reciben miles de siniestros al mes
- El fraude en seguros representa pérdidas del 10–15% de la cartera
- Los analistas no tienen tiempo para revisar cada caso a fondo
- No existe una forma sistemática de priorizar cuáles casos revisar primero

**Lo que hace FraudIA:**
1. Analiza cada siniestro contra reglas de negocio configurables
2. Asigna un score de riesgo (0–100)
3. Clasifica: Verde / Amarillo / Rojo
4. Genera alertas específicas por cada señal de riesgo detectada
5. Permite a un analista enviar el caso a revisión humana con asignación automática al revisor especializado
6. Tiene un agente IA conversacional para responder preguntas en lenguaje natural

**El dataset:** 1.000 siniestros sintéticos realistas (Ecuador), 3.496 documentos, ~50 proveedores, conductores con cédulas ecuatorianas válidas.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend API | Python 3.11, FastAPI, SQLAlchemy 2.x, psycopg 3 |
| Base de datos | AlloyDB for PostgreSQL (GCP) |
| Agente IA | Google Agent Development Kit (ADK) + Gemini 2.5 Flash |
| RAG / Embeddings | `gemini-embedding-001` (768 dimensiones) |
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Tablas | TanStack Table v8 |
| Gráficas | MUI X Charts v9.3 (Gauge, BarChart) |
| Íconos | Lucide React |
| Deploy | Cloud Run (2 servicios), Artifact Registry |
| Proyecto GCP | `gen-ai-hackathon-494720` |

---

## 3. Cómo correr el proyecto localmente

### Prerequisitos
- Python 3.11+
- Node.js 18+
- Acceso al proyecto GCP (pide acceso a Kerny)
- Credenciales de GCP configuradas

### Backend

```bash
# 1. Clonar el repo
git clone <repo-url>
cd fraud-ia

# 2. Instalar dependencias Python
cd apps/api
pip install -r requirements.txt

# 3. Copiar y configurar variables de entorno
cp ../../.env.example ../../.env
# Editar .env con los valores correctos (pedir a Kerny)

# 4. Autenticar con GCP (necesario para Vertex AI y AlloyDB)
gcloud auth application-default login
gcloud auth application-default set-quota-project gen-ai-hackathon-494720

# 5. Levantar el servidor
uvicorn app.main:app --reload --port 8080
# API disponible en: http://localhost:8080
# Docs interactivos: http://localhost:8080/docs
```

### Frontend

```bash
cd apps/web
npm install

# En una terminal separada (con el backend corriendo):
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 npm run dev
# Web disponible en: http://localhost:3000
```

### Variables de entorno requeridas (`.env`)

```env
ALLOYDB_HOST=34.132.40.218
ALLOYDB_PORT=5432
ALLOYDB_DATABASE=fraudia
ALLOYDB_USER=app_user
ALLOYDB_PASSWORD=<pedir a Kerny>
GOOGLE_CLOUD_PROJECT=gen-ai-hackathon-494720
GOOGLE_CLOUD_LOCATION=us-central1
```

### URLs de producción (ya desplegadas)
- **Frontend:** https://fraudia-web-[hash]-uc.a.run.app
- **Backend:** https://fraudia-api-[hash]-uc.a.run.app
- **API Docs:** https://fraudia-api-[hash]-uc.a.run.app/docs

---

## 4. Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 15 (Web)                        │
│  Landing │ Dashboard │ Siniestros │ Evaluar │ Chat │ Proveed. │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP / JSON
┌────────────────────▼────────────────────────────────────────┐
│                    FastAPI (Backend)                          │
│  /api/kpis │ /api/siniestros │ /api/chat │ /api/siniestros/ │
│            │                  │           │ evaluar           │
│  /api/revisiones/kanban │ /api/siniestros/{id}/revision      │
└──────┬──────────────────────────────────┬───────────────────┘
       │                                  │
┌──────▼──────┐              ┌────────────▼──────────────────┐
│  AlloyDB    │              │    Vertex AI / Gemini 2.5      │
│  PostgreSQL │              │  Flash (Agent + Embeddings)    │
│             │              │                                 │
│  claims.*   │              │  gemini-embedding-001 (768d)   │
│  rag.*      │◄─────────────│  RAG sobre business_chunks     │
│  app.*      │              └─────────────────────────────────┘
└─────────────┘
```

### Esquemas de la base de datos

| Esquema | Contiene |
|---------|----------|
| `claims` | siniestros, polizas, asegurados, vehiculos, conductores, proveedores, documentos, narrativas_similares |
| `rag` | business_chunks (embeddings de documentos de negocio) |
| `app` | revisores (5 analistas humanos ficticios) |

---

## 5. Tour por pantallas

### 5.1 Landing page
**Ruta:** `/`

Página de presentación del producto con:
- Hero con propuesta de valor
- Tres pilares: Detección Temprana, Scoring Inteligente, Revisión Humana
- Botón "Ir al Dashboard" → lleva al dashboard principal

---

### 5.2 Dashboard principal
**Ruta:** `/dashboard`

El corazón del sistema. Tiene un **grid de widgets** estilo bento con:

#### KPIs superiores
| Widget | Qué muestra |
|--------|-------------|
| Total siniestros | Cantidad total en la base |
| Casos Rojos | Siniestros con nivel_riesgo = "Rojo Alto" |
| Monto en riesgo | Suma de monto_reclamado de casos rojos (USD) |
| Score promedio | Promedio de score_final de todos los siniestros |

Cada KPI tiene un **icono de interrogación** (?) en la esquina — al hacer hover aparece un tooltip explicando qué mide ese indicador.

#### Gráficas del dashboard
- **Distribución por nivel de riesgo** — pie/donut: Verde / Amarillo / Rojo
- **Mapa de calor por ciudad** — siniestros agrupados por ciudad (bar chart)
- **Siniestros por ramo** — pie chart: Vehículos, Salud, Vida, Hogar, etc.
- **Score a lo largo del tiempo** — línea temporal

#### Widgets de listas
- **Top proveedores en riesgo** — tabla con los 5 proveedores con más casos rojos
- **Documentos críticos faltantes** — tabla de documentos faltantes en casos Rojo Alto
- **Cola de revisión humana** — siniestros en estado "En revisión" con el revisor asignado

#### Tablero Kanban (al final del dashboard)
Ver sección [8. Tablero Kanban](#8-tablero-kanban).

---

### 5.3 Lista de siniestros
**Ruta:** `/siniestros`

Tabla paginada con todos los siniestros. Funcionalidades:

#### Filtros disponibles
- **Búsqueda libre** — por ID o descripción
- **Nivel de riesgo** — dropdown: Todos / Verde Bajo / Amarillo Medio / Rojo Alto
- **Ramo** — dropdown: Automóvil, Salud, Vida, Hogar, etc.
- **Score mínimo** — slider numérico

#### Tabs de estado de revisión
En la parte superior de la tabla hay **5 tabs**:

| Tab | Filtro aplicado | Color |
|-----|----------------|-------|
| Todos | Sin filtro de estado | Neutro |
| Sin revisar | `estado_revision = 'Pendiente'` | Gris |
| En revisión | `estado_revision = 'En revisión'` | Ámbar |
| Aprobados | `estado_revision = 'Aprobado'` | Verde |
| Rechazados | `estado_revision = 'Rechazado'` | Rojo |

> **Tip de demo:** Al hacer clic en "Ver todos" desde el widget de cola del dashboard, la URL lleva `?estado_revision=En revisión` y la tabla abre directamente en ese tab.

#### Columnas de la tabla
ID Siniestro · Ramo · Ciudad · Score · Nivel de Riesgo · Monto Reclamado · Estado Revisión · Fecha Ocurrencia

Cada fila tiene un badge de color para el nivel de riesgo (verde/amarillo/rojo).

---

### 5.4 Detalle de siniestro
**Ruta:** `/siniestros/[id]`

Vista completa de un caso individual. Secciones:

#### Panel izquierdo — Score y riesgo
- **Gauge semicircular** (MUI X Charts) → Score Final (0–100) con colores según nivel
- **BarChart horizontal** → Desglose: Score Reglas vs Score Modelo Simulado
- Badge del nivel de riesgo
- Acción sugerida

#### Panel central — Datos del siniestro
- Información básica: ramo, cobertura, ciudad, sucursal, estado, montos
- Datos del asegurado: ID, póliza, fechas vigencia
- Datos del vehículo/proveedor
- Descripción del siniestro

#### Alertas activadas
Lista de alertas específicas que disparó el sistema. Ej:
- "Siniestro reportado a los 3 días del inicio de la póliza"
- "Proveedor en lista restrictiva"
- "Monto reclamado supera 1.5x el umbral del ramo"

#### Documentos
Tabla con todos los documentos asociados al caso:
- Tipo de documento
- Estado: Entregado / No entregado
- Legibilidad: Legible / Ilegible
- Inconsistencia detectada
- Observaciones

#### Historial
- **BarChart horizontal** → Historial de siniestros previos del asegurado, vehículo y conductor (colorizado: verde ≤ 1, amarillo = 2, rojo ≥ 3)

#### Botón "Enviar a revisión humana"
Botón ámbar al pie de la página. Al hacer clic:
1. Llama a `POST /api/siniestros/{id}/revision`
2. Se muestra un modal con el **revisor asignado automáticamente** según el ramo
3. El modal muestra: nombre del revisor, especialidad, casos activos actuales
4. Confirmar cierra el modal y el estado cambia a "En revisión"

---

### 5.5 Evaluar siniestro (ingreso manual)
**Ruta:** `/evaluar`

Formulario para evaluar un siniestro nuevo que no está en la base de datos. Útil para:
- Ingresar un caso recién reportado
- Hacer una evaluación preventiva
- Subir un peritaje en PDF para que el agente pueda analizarlo

#### Campos del formulario
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Ramo | Select | Automóvil, Salud, Vida, Hogar, RC, Robo |
| Ciudad | Texto | Ciudad donde ocurrió el siniestro |
| Monto reclamado (USD) | Número | Monto en dólares americanos |
| Proveedor | Texto | Nombre del taller/clínica/proveedor |
| Días desde inicio de póliza | Número | Opcional — activa regla de riesgo temprano |
| Días entre ocurrencia y reporte | Número | Opcional — activa regla de demora en reporte |
| ¿Documentos completos? | Checkbox | Si está desmarcado, activa alerta |
| Descripción | Textarea | Descripción del siniestro |
| PDF de peritaje | File upload | Opcional — se indexa en el RAG |

#### Resultado
Al enviar el formulario:
1. El backend calcula el score y las alertas
2. Persiste el siniestro en `claims.siniestros` con ID formato `SIN-EVAL-XXXXXX`
3. Si hay PDF: lo procesa con Gemini multimodal, extrae el texto y lo indexa en el RAG
4. Muestra tarjeta de resultado con:
   - Score Final
   - Nivel de riesgo con badge de color
   - Lista de alertas activadas
   - Acción sugerida
   - Si hay PDF: "Documento indexado. Puedes preguntarle al agente sobre este peritaje."
   - Botón "Ver siniestro" → va al detalle en `/siniestros/SIN-EVAL-XXXXXX`
   - Botón "Consultar al agente" → abre el chat bubble y le inyecta el contexto del peritaje

---

### 5.6 Proveedores de riesgo
**Ruta:** `/proveedores`

Tabla con todos los proveedores ordenados por concentración de riesgo:
- Nombre y tipo de proveedor
- Ciudad
- Total de siniestros asociados
- Casos rojos / amarillos
- Score promedio
- Monto total reclamado
- Badge rojo si está en lista restrictiva

---

### 5.7 Chat con el agente IA
**Ruta:** `/chat` (o chat bubble flotante en cualquier página)

Chat conversacional potenciado por **Google ADK + Gemini 2.5 Flash**.

El agente tiene acceso a 8 herramientas SQL+RAG. Puede responder preguntas sobre:
- Los siniestros más riesgosos
- Análisis de proveedores
- Casos cerca del inicio de póliza
- Documentos faltantes
- Resumen ejecutivo del portafolio
- Lectura de peritajes subidos
- Reglas de negocio y glosario de la aseguradora
- Narrativas similares (detección de fraude coordinado)

El chat muestra:
- Respuesta en markdown
- Herramientas utilizadas (chips bajo la respuesta)
- Citas de fuentes cuando usa RAG

Ver sección [9. Agente IA](#9-agente-ia--herramientas-disponibles) y [13. Preguntas de demo](#13-preguntas-de-demo-recomendadas-para-el-chat).

---

### 5.8 Página de arquitectura técnica
**Ruta:** `/arquitectura`

Diagrama visual del flujo de datos del sistema, pensado para presentaciones técnicas durante el hackathon.

---

## 6. Sistema de scoring de riesgo

```
score_final = 0.6 × score_reglas + 0.4 × score_modelo_simulado
```

### Reglas de negocio (score_reglas)

| Código | Condición | Puntos |
|--------|-----------|--------|
| RF-01 | dias_desde_inicio_poliza ≤ 90 | +30 |
| RF-02 | Proveedor en lista restrictiva | +35 |
| RF-03 | monto_reclamado > 1.5× umbral del ramo | +20 |
| RF-04 | documentos_completos = false | +10 |
| RF-05 | dias_entre_ocurrencia_reporte > 15 | +5 |
| RF-06 | Historial de siniestros alto (≥ 3 previos) | +20 |
| RF-07 | Narrativa similar a otros casos del cluster | +25 |

### Clasificación final

| Rango | Nivel | Color | Acción |
|-------|-------|-------|--------|
| 0 – 39 | Verde Bajo | 🟢 | Flujo normal de pago |
| 40 – 69 | Amarillo Medio | 🟡 | Revisión supervisora |
| 70 – 100 | Rojo Alto | 🔴 | Escalar a antifraude |

### score_modelo_simulado
Fijo en 50.0 para el MVP. En producción se reemplazaría por un modelo ML real (XGBoost / LightGBM) entrenado con el historial de fraudes confirmados.

---

## 7. Flujo de revisión humana

El flujo completo de un siniestro a través del sistema de revisión:

```
Ingresa siniestro
      │
      ▼
  estado_revision = 'Pendiente'  (tab "Sin revisar")
      │
      │  Analista hace clic "Enviar a revisión humana"
      ▼
POST /api/siniestros/{id}/revision
  → Asigna revisor según RAMO_A_REVISOR
  → incrementa casos_activos del revisor
  → estado_revision = 'En revisión'
      │
      ▼
  Aparece en Kanban y cola de revisión  (tab "En revisión")
      │
      │  Desde el Kanban, el revisor toma acción:
      ├──── Aprobar ────────► estado = 'Aprobado'   (tab "Aprobados")
      ├──── Rechazar ───────► estado = 'Rechazado'  (tab "Rechazados")
      └──── Reasignar ──────► cambia id_revisor_asignado (sigue "En revisión")
```

### Asignación automática de revisores por ramo

| Ramo del siniestro | Revisor asignado |
|---------------------|-----------------|
| Vehículos / Automóvil | Ana Morales — Especialista Automotriz (REV-001) |
| Salud / Accidentes Personales | Carlos Jiménez — Especialista Salud (REV-002) |
| Hogar / Robo | María Suárez — Especialista Bienes (REV-003) |
| Vida | Diego Paredes — Especialista Vida (REV-004) |
| Generales / RC | Lucía Vásquez — Especialista Generales (REV-005) |

---

## 8. Tablero Kanban

**Ubicación:** Al pie del Dashboard principal (`/dashboard`)

El Kanban agrupa los siniestros **en estado "En revisión"** por columna de revisor.

### Estructura
- 5 columnas, una por revisor
- Cada columna muestra el nombre del revisor, su especialidad y cantidad de casos activos
- Botón de refresh manual (icono) en el encabezado

### Cards de siniestro
Cada card muestra:
- ID del siniestro
- Ramo y ciudad
- Score (coloreado: rojo ≥ 70, amarillo ≥ 40, verde < 40)
- Días en cola (calculado como `NOW() - fecha_asignacion`)
- Botón **Aprobar** (verde) — llama a `PATCH /api/siniestros/{id}/revision` con `accion: "aprobar"`
- Botón **Rechazar** (rojo) — llama a `PATCH` con `accion: "rechazar"`
- Dropdown **Reasignar a...** — lista los otros 4 revisores, llama a `PATCH` con `accion: "reasignar"` y `id_revisor_nuevo`

Al tomar cualquier acción, el tablero se refresca automáticamente.

### Endpoint del Kanban
```
GET /api/revisiones/kanban
Response: [
  {
    "revisor": { id, nombre, especialidad, email, casos_activos },
    "casos": [
      { id_siniestro, ramo, ciudad, score_final, nivel_riesgo,
        monto_reclamado, fecha_asignacion, dias_en_cola }
    ]
  },
  ...
]
```

---

## 9. Agente IA — herramientas disponibles

El agente usa **keyword dispatch** para decidir qué herramienta usar según la pregunta. Herramientas:

| Herramienta | Qué hace | Cuándo la usa |
|-------------|----------|---------------|
| `buscar_conocimiento_negocio` | RAG sobre documentos de negocio: reglas, glosario, ética, proceso de revisión | Preguntas conceptuales o sobre políticas |
| `listar_siniestros_mayor_riesgo` | Top N siniestros por score_final | "Cuáles son los más riesgosos" |
| `explicar_siniestro(id)` | Detalle completo de un siniestro específico | Cuando se menciona un ID de siniestro |
| `analizar_proveedores_alertas` | Proveedores con más casos rojos/amarillos | "Proveedores sospechosos" |
| `listar_documentos_faltantes_casos_criticos` | Docs faltantes en casos Rojo Alto | "Documentos incompletos" |
| `listar_casos_cerca_inicio_poliza` | Siniestros en los primeros 90 días de póliza | "Riesgo moral", "inicio de póliza" |
| `listar_narrativas_similares` | Pares de siniestros con narrativas similares (TF-IDF cosine) | "Fraude coordinado", "narrativas repetidas" |
| `generar_resumen_ejecutivo` | KPIs + hallazgos + recomendaciones | "Resumen", "qué deberíamos hacer" |
| `leer_documento_peritaje(doc_id)` | Lee un PDF indexado por su ID exacto | Cuando se menciona `peritaje_XXXX` |

### Flujo del peritaje PDF
1. Usuario sube PDF en `/evaluar`
2. Backend llama a Gemini multimodal para extraer el texto
3. El texto se divide en chunks (800 palabras, 100 de overlap)
4. Cada chunk se embebe con `gemini-embedding-001` y se guarda en `rag.business_chunks` con `source_name = peritaje_XXXXXXXX`
5. El resultado de evaluación incluye el `doc_id`
6. El usuario puede preguntarle al chat: "explícame el peritaje_XXXXXXXX"
7. El agente detecta el patrón `peritaje_[a-f0-9]+` y llama directamente a `leer_documento_peritaje` (búsqueda directa por `source_name`, no por similitud vectorial)

---

## 10. APIs del backend

Documentación interactiva disponible en `/docs` cuando el servidor está corriendo.

### Endpoints principales

```
GET  /health
     → { status: "ok", database: "connected" }

GET  /api/kpis
     → { total_siniestros, casos_verdes, casos_amarillos, casos_rojos,
          monto_total_reclamado, monto_rojo_reclamado, score_promedio }

GET  /api/siniestros
     Params: nivel_riesgo, ramo, search, score_min, limit, offset, estado_revision
     → { items: [...], total, limit, offset }

GET  /api/siniestros/{id}
     → Siniestro completo con documentos adjuntos

POST /api/siniestros/evaluar   (multipart/form-data)
     Campos: ramo, ciudad, monto_reclamado, descripcion, nombre_proveedor,
             dias_desde_inicio_poliza?, dias_entre_ocurrencia_reporte?,
             documentos_completos?, pdf_file?
     → { id_siniestro, score_reglas, score_final, nivel_riesgo,
          alertas, accion_sugerida, proveedor_restringido,
          documento_indexado, mensaje_documento }

POST /api/siniestros/{id}/revision
     → { id_siniestro, estado_revision, revisor, fecha_asignacion, mensaje }

PATCH /api/siniestros/{id}/revision
     Body: { accion: "aprobar"|"rechazar"|"reasignar", id_revisor_nuevo? }
     → { mensaje, estado_revision | id_revisor_nuevo }

GET  /api/revisiones/kanban
     → list[KanbanColumn]

GET  /api/revisiones/cola
     → list[ColaRevisionItem]

GET  /api/revisores
     → list[Revisor]

GET  /api/proveedores/riesgo?limit=10
     → list[Proveedor ordenado por casos_rojos]

GET  /api/documentos/criticos
     → Documentos faltantes en casos Rojo Alto

GET  /api/rag/search?query=&top_k=5
     → Búsqueda semántica en base de conocimiento

POST /api/chat
     Body: { session_id, message }
     → { answer, tools_used, citations }
```

---

## 11. Base de datos y esquemas

### Tablas principales (`claims.*`)

```sql
claims.siniestros          -- 1.000+ filas (+ nuevos de /evaluar)
  id_siniestro             -- PK formato SIN-XXXXXX o SIN-EVAL-XXXXXX
  score_reglas             -- 0–100 (reglas de negocio)
  score_modelo_simulado    -- 0–100 (modelo ML, fijo en 50 en MVP)
  score_final              -- weighted average 60/40
  nivel_riesgo             -- 'Verde Bajo' | 'Amarillo Medio' | 'Rojo Alto'
  alertas_activadas        -- JSONB array de strings
  estado_revision          -- 'Pendiente' | 'En revisión' | 'Aprobado' | 'Rechazado'
  id_revisor_asignado      -- FK → app.revisores
  fecha_asignacion         -- timestamp

claims.proveedores         -- ~50 filas
  en_lista_restrictiva     -- boolean (activadores del RF-02)

claims.documentos          -- 3.496 filas
  entregado, legible, inconsistencia_detectada

claims.narrativas_similares -- pares de siniestros con similitud TF-IDF coseno
```

### RAG (`rag.*`)
```sql
rag.business_chunks
  source_name              -- nombre del doc (ej: "manual_revision.md", "peritaje_abc123")
  section                  -- sección dentro del doc
  chunk_text               -- texto del chunk (máx 800 palabras)
  embedding                -- vector(768) — gemini-embedding-001
```

### Revisores (`app.*`)
```sql
app.revisores              -- 5 filas
  id_revisor               -- 'REV-001' a 'REV-005'
  nombre                   -- nombre del analista ficticio
  especialidad             -- rama de especialización
  email                    -- email ficticio
  casos_activos            -- contador dinámico (incrementa/decrementa con el workflow)
```

---

## 12. Decisiones técnicas importantes

### Por qué CAST(:param AS jsonb) y no :param::jsonb
psycopg3 (el driver PostgreSQL de Python 3) no soporta la sintaxis de cast `::jsonb` con parámetros nombrados. La sintaxis `CAST(:alertas AS jsonb)` es la forma correcta.

### Por qué el agente busca peritajes por source_name y no por vector
Un peritaje es un documento específico. Si el usuario pregunta por `peritaje_abc123`, quiere ese documento exacto, no los 5 más parecidos semánticamente. La herramienta `leer_documento_peritaje` hace `WHERE source_name = :doc_id` para recuperar todos los chunks del documento en orden.

### Por qué 5 revisores fijos (no un sistema de colas dinámico)
MVP — para el hackathon es suficiente mostrar el concepto. La asignación por ramo es determinista y fácil de auditar. En producción se usaría un sistema de colas con carga balanceada.

### Por qué score_modelo_simulado = 50 fijo
El MVP no tiene datos de fraude confirmado para entrenar un modelo real. En producción, este score vendría de un modelo XGBoost/LightGBM entrenado con el historial de liquidaciones y rechazos de la aseguradora.

### Por qué AlloyDB y no Cloud SQL
AlloyDB tiene soporte nativo para pgvector (búsqueda vectorial) necesario para el RAG. Cloud SQL no lo tiene de forma nativa en la versión actual.

---

## 13. Preguntas de demo recomendadas para el chat

Estas preguntas funcionan bien para mostrar las capacidades del agente:

### Resumen ejecutivo
> "Dame un resumen ejecutivo del portafolio de siniestros"

→ Activa `generar_resumen_ejecutivo`: muestra KPIs, top 5 siniestros, top 5 proveedores en riesgo, hallazgos y recomendaciones.

### Casos más riesgosos
> "¿Cuáles son los 5 siniestros con mayor score de riesgo?"

→ Activa `listar_siniestros_mayor_riesgo`.

### Proveedor sospechoso
> "¿Qué proveedores tienen más casos en alerta roja?"

→ Activa `analizar_proveedores_alertas`.

### Casos cerca del inicio de póliza
> "¿Hay siniestros reportados muy pronto después de contratar la póliza?"

→ Activa `listar_casos_cerca_inicio_poliza`.

### Documentos faltantes
> "¿Qué documentos faltan en los casos más críticos?"

→ Activa `listar_documentos_faltantes_casos_criticos`.

### Fraude coordinado
> "¿Hay siniestros con narrativas similares que podrían indicar fraude coordinado?"

→ Activa `listar_narrativas_similares`.

### Caso específico
> "Explícame el siniestro SIN-000001"

→ Activa `explicar_siniestro("SIN-000001")`.

### Reglas de negocio (RAG)
> "¿Cuáles son las reglas para clasificar un siniestro como de alto riesgo?"

→ Activa `buscar_conocimiento_negocio`.

### Peritaje (después de subir un PDF en /evaluar)
> "Analiza el peritaje_[ID-que-aparece-en-el-resultado]"

→ Activa `leer_documento_peritaje` con búsqueda directa por ID.

---

*Documento generado el 2026-05-29. Proyecto: FraudIA · HackIAthon GCP 2026 · Aseguradora del Sur*
