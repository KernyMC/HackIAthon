# FraudIA — Detección Inteligente de Fraude en Siniestros

MVP de detección de posible fraude en siniestros de seguros para **Aseguradora del Sur** — HackIAthon GCP 2026.

El sistema analiza cada siniestro contra reglas de negocio configurables, asigna un score de riesgo (0–100) y genera alertas específicas para que un analista humano tome la decisión final. **Nunca acusa fraude automáticamente ni rechaza siniestros** — solo prioriza la cola de revisión.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend API | Python 3.11, FastAPI, SQLAlchemy 2.x, psycopg 3 |
| Base de datos | AlloyDB for PostgreSQL (pgvector, embeddings 768d) |
| Agente IA | Google ADK + Gemini 2.5 Flash |
| Embeddings / RAG | `gemini-embedding-001` (768 dimensiones) |
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Tablas | TanStack Table v8 |
| Gráficas | MUI X Charts v9 (Gauge, BarChart) |
| Deploy | Cloud Run (2 servicios: `fraudia-api` + `fraudia-web`), Artifact Registry |
| Proyecto GCP | `gen-ai-hackathon-494720` · región `us-central1` |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 15 (Web)                          │
│  / · /dashboard · /siniestros · /siniestros/[id] · /evaluar     │
│  /proveedores · /reglas · /reportes · /chat · /arquitectura     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / JSON
┌──────────────────────────▼──────────────────────────────────────┐
│                      FastAPI (Backend)                            │
│                                                                   │
│  /api/kpis          /api/siniestros        /api/chat             │
│  /api/proveedores   /api/documentos        /api/rag/search       │
│  /api/revisiones    /api/analytics         /api/siniestros/evaluar│
└──────┬──────────────────────────────────┬───────────────────────┘
       │                                  │
┌──────▼──────┐              ┌────────────▼────────────────────────┐
│  AlloyDB    │              │     Vertex AI / Gemini 2.5 Flash     │
│ PostgreSQL  │              │                                       │
│             │              │  Google ADK — 9 herramientas SQL+RAG │
│  claims.*   │◄─────────────│  gemini-embedding-001 (RAG 768d)     │
│  rag.*      │              │  Gemini multimodal (análisis PDF)     │
│  app.*      │              └───────────────────────────────────────┘
└─────────────┘
```

**Flujo principal:**
1. Los siniestros se cargan desde el dataset sintético (1.000 casos)
2. El motor de scoring calcula `score_reglas` aplicando las 7 reglas RF-01..RF-07
3. `score_final = 0.6 × score_reglas + 0.4 × score_modelo_simulado`
4. El analista revisa la cola priorizada por score y puede enviar casos a revisión humana
5. El Kanban muestra los casos asignados por revisor especializado
6. El agente IA responde preguntas en lenguaje natural sobre el portafolio

**Pantallas del frontend:**

| Ruta | Descripción |
|---|---|
| `/` | Landing — propuesta de valor |
| `/dashboard` | KPIs + gráficas + cola de revisión + Kanban |
| `/siniestros` | Lista paginada con filtros y tabs por estado de revisión |
| `/siniestros/[id]` | Detalle: gauge de score, alertas activadas, documentos, historial |
| `/evaluar` | Formulario de ingreso manual + subida de PDF para peritaje |
| `/proveedores` | Tabla de proveedores ordenada por concentración de riesgo |
| `/reglas` | Catálogo visual de reglas RF-01..RF-07 con severidad y puntos |
| `/reportes` | Reporte ejecutivo: KPIs, frecuencia de reglas, distribución por ramo |
| `/chat` | Chat con el agente IA (también disponible como widget flotante) |
| `/arquitectura` | Diagrama del sistema para presentaciones técnicas |

---

## Modelo de datos

La base de datos AlloyDB tiene tres esquemas:

### `claims.*` — dominio de siniestros

```
claims.siniestros           1.000+ filas
  id_siniestro              PK — formato SIN-XXXXXX o SIN-EVAL-XXXXXX
  score_reglas              0–100 (motor de reglas de negocio)
  score_modelo_simulado     0–100 (modelo ML, fijo en 50 en el MVP)
  score_final               promedio ponderado 60/40
  nivel_riesgo              'Verde Bajo' | 'Amarillo Medio' | 'Rojo Alto'
  alertas_activadas         JSONB — lista de alertas disparadas
  estado_revision           'Pendiente' | 'En revisión' | 'Aprobado' | 'Rechazado'
  id_revisor_asignado       FK → app.revisores
  fecha_asignacion          timestamp de asignación al revisor

claims.polizas              datos de la póliza asociada
claims.asegurados           datos del asegurado
claims.vehiculos            datos del vehículo (ramo automotriz)
claims.conductores          rango de edad y antigüedad de licencia
claims.proveedores          ~50 proveedores con flag en_lista_restrictiva
claims.documentos           3.496 filas — estado de cada documento del expediente
claims.narrativas_similares pares de siniestros con similitud TF-IDF coseno (RF-07)
```

### `rag.*` — base de conocimiento vectorial

```
rag.business_chunks
  source_name    nombre del documento fuente (ej: "manual_revision.md", "peritaje_abc123")
  section        sección dentro del documento
  chunk_text     texto del chunk (máx 800 palabras, overlap 100)
  embedding      vector(768) — gemini-embedding-001
```

9 documentos indexados: reglas de negocio, glosario, código de ética, manual de revisión, criterios de puntuación, y peritajes subidos dinámicamente por los analistas.

### `app.*` — operaciones del sistema

```
app.revisores          5 analistas ficticios con especialidad por ramo
app.chat_sessions      sesiones del agente IA
app.chat_messages      historial de mensajes por sesión
```

---

## Reglas antifraude

El motor aplica estas 7 reglas para calcular `score_reglas`. Cada regla suma puntos si se activa:

| Código | Señal detectada | Puntos | Severidad |
|--------|----------------|--------|-----------|
| RF-01 | Siniestro en los primeros 90 días de vigencia de la póliza (riesgo moral) | +30 | Crítico |
| RF-02 | Proveedor en lista restrictiva (taller/clínica con historial de irregularidades) | +35 | Crítico |
| RF-03 | Monto reclamado supera 1.5× el umbral promedio del ramo | +20 | Alto |
| RF-04 | Expediente sin documentación completa | +10 | Medio |
| RF-05 | Más de 15 días entre la fecha de ocurrencia y el reporte | +5 | Bajo |
| RF-06 | Asegurado o conductor con 3 o más siniestros previos | +20 | Alto |
| RF-07 | Descripción con alta similitud textual (TF-IDF coseno) a otros casos del mismo cluster | +25 | Crítico |

**Clasificación final:**

```
score_final = 0.6 × score_reglas + 0.4 × score_modelo_simulado

Verde Bajo:     0–39   → flujo normal de pago
Amarillo Medio: 40–69  → revisión supervisora
Rojo Alto:      70–100 → escalar a unidad antifraude
```

> En producción, `score_modelo_simulado` (fijo en 50 en el MVP) sería reemplazado por un modelo XGBoost/LightGBM entrenado con el historial de fraudes confirmados.

**Asignación automática de revisores por ramo:**

| Ramo | Revisor asignado |
|---|---|
| Vehículos / Automóvil | Ana Morales — Especialista Automotriz |
| Salud / Accidentes Personales | Carlos Jiménez — Especialista Salud |
| Hogar / Robo | María Suárez — Especialista Bienes |
| Vida | Diego Paredes — Especialista Vida |
| Generales / RC | Lucía Vásquez — Especialista Generales |

---

## Uso de IA

### 1. Agente conversacional — Google ADK + Gemini 2.5 Flash

El agente tiene acceso a 9 herramientas que combinan SQL contra AlloyDB y búsqueda vectorial en el RAG:

| Herramienta | Qué hace |
|---|---|
| `buscar_conocimiento_negocio` | RAG sobre los 9 documentos de negocio indexados |
| `listar_siniestros_mayor_riesgo` | Top N siniestros por score_final |
| `explicar_siniestro(id)` | Detalle completo de un caso específico |
| `analizar_proveedores_alertas` | Proveedores con mayor concentración de casos rojos |
| `listar_documentos_faltantes_casos_criticos` | Documentos incompletos en casos Rojo Alto |
| `listar_casos_cerca_inicio_poliza` | Siniestros en los primeros 90 días de póliza |
| `listar_narrativas_similares` | Pares de siniestros con narrativas clonadas (RF-07) |
| `generar_resumen_ejecutivo` | KPIs + hallazgos + recomendaciones (1 query CTE) |
| `leer_documento_peritaje(doc_id)` | Lee un PDF indexado por su ID exacto |

Preguntas de demo recomendadas:
```
"Dame un resumen ejecutivo del portafolio de siniestros"
"¿Cuáles son los 5 siniestros con mayor score de riesgo?"
"¿Qué proveedores tienen más casos en alerta roja?"
"¿Hay siniestros con narrativas similares que indiquen fraude coordinado?"
"¿Cuáles son las reglas para clasificar un siniestro como de alto riesgo?"
"Explícame el siniestro SIN-000001"
```

### 2. RAG — Retrieval-Augmented Generation

- **Modelo de embeddings:** `gemini-embedding-001` (768 dimensiones)
- **Vector store:** `rag.business_chunks` en AlloyDB con extensión `pgvector`
- **Chunking:** 800 palabras por chunk, 100 palabras de overlap
- **Búsqueda:** similitud coseno con operador `<=>` de pgvector, top-k = 5

### 3. Análisis multimodal de PDF

Cuando el analista sube un peritaje en `/evaluar`:
1. Gemini extrae el texto completo del PDF en modo multimodal
2. El texto se divide en chunks y se embebe con `gemini-embedding-001`
3. Los chunks se guardan en `rag.business_chunks` con un `doc_id` único (ej: `peritaje_abc123`)
4. El analista puede preguntarle al chat: *"Analiza el peritaje_abc123"*
5. El agente recupera el documento completo por `source_name` (búsqueda directa, no vectorial)

### 4. APIs del backend

```
GET  /api/kpis
GET  /api/siniestros              ?nivel_riesgo= &ramo= &search= &score_min= &estado_revision=
GET  /api/siniestros/{id}
POST /api/siniestros/evaluar      multipart/form-data — PDF opcional
POST /api/siniestros/{id}/revision
PATCH /api/siniestros/{id}/revision
GET  /api/revisiones/kanban
GET  /api/revisiones/cola
GET  /api/proveedores/riesgo
GET  /api/documentos/criticos
GET  /api/narrativas/similares
GET  /api/analytics/alertas       ranking de reglas más activadas
GET  /api/analytics/resumen       resumen ejecutivo del portafolio
GET  /api/rag/search              ?query= &top_k=
POST /api/chat                    { session_id, message } → { answer, tools_used, citations }
```

---

## Cómo correr localmente

```bash
# Backend
cd apps/api
pip install -r requirements.txt
gcloud auth application-default login
gcloud auth application-default set-quota-project gen-ai-hackathon-494720
uvicorn app.main:app --reload --port 8080
# Docs interactivas: http://localhost:8080/docs

# Frontend (en otra terminal)
cd apps/web
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 npm run dev
# Web: http://localhost:3000
```

**Variables de entorno requeridas (`.env`):**
```env
ALLOYDB_HOST=<ip-alloydb>
ALLOYDB_PORT=5432
ALLOYDB_DATABASE=fraudia
ALLOYDB_USER=app_user
ALLOYDB_PASSWORD=<password>
GOOGLE_CLOUD_PROJECT=<project>
GOOGLE_CLOUD_LOCATION=us-central1
```

**Dataset:** 1.000 siniestros sintéticos (Ecuador), 3.496 documentos, ~50 proveedores, cédulas ecuatorianas válidas.
