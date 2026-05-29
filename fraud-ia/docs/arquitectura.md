# Arquitectura del Sistema — FraudSweep

## Diagrama general

```
┌─────────────────────────────────────────────────────────────────┐
│                  USUARIO / ANALISTA DE SINIESTROS               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────────┐
│              Next.js 15 — fraudia-web (Cloud Run)               │
│  /         Landing page + tour guiado                           │
│  /dashboard    KPIs · gráficas · Kanban de revisión             │
│  /siniestros   Tabla paginada con filtros y tabs de estado       │
│  /siniestros/[id]  Detalle · Gauge · BarChart · botón revisión  │
│  /evaluar      Formulario ingreso + PDF peritaje                 │
│  /proveedores  Ranking de riesgo                                 │
│  /reportes     Reporte ejecutivo imprimible                      │
│  /chat         Chat directo con el agente IA                     │
│  /arquitectura Diagrama técnico visual                           │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/JSON (rewrites Next.js)
┌────────────────────────▼────────────────────────────────────────┐
│              FastAPI — fraudia-api (Cloud Run)                   │
│                                                                  │
│  GET  /health                                                    │
│  GET  /api/kpis                                                  │
│  GET  /api/siniestros          (filtros, paginación, estado)     │
│  GET  /api/siniestros/{id}                                       │
│  POST /api/siniestros/evaluar  (form + PDF multipart)            │
│  POST /api/siniestros/{id}/revision                              │
│  PATCH /api/siniestros/{id}/revision                             │
│  GET  /api/revisiones/kanban                                     │
│  GET  /api/revisiones/cola                                       │
│  GET  /api/revisores                                             │
│  GET  /api/proveedores/riesgo                                    │
│  GET  /api/documentos/criticos                                   │
│  GET  /api/rag/search                                            │
│  POST /api/chat                                                  │
│  GET  /api/analytics/alertas                                     │
│  GET  /api/analytics/resumen                                     │
└────┬──────────────────┬──────────────────────────────┬──────────┘
     │ SQL (psycopg3)   │ Vertex AI SDK                │ Vertex AI
┌────▼──────────┐  ┌────▼──────────────────────┐  ┌───▼──────────┐
│    AlloyDB    │  │  Google Agent Dev Kit      │  │  Gemini      │
│  PostgreSQL   │  │  (ADK) + Gemini 2.5 Flash  │  │  Embeddings  │
│               │  │                            │  │  001 (768d)  │
│  claims.*     │  │  8 herramientas SQL + RAG   │  │              │
│  rag.*        │◄─┤  keyword dispatch           │  │  PDF OCR     │
│  app.*        │  │  session memory             │  │  multimodal  │
└───────────────┘  └────────────────────────────┘  └──────────────┘
```

## Servicios en Cloud Run (GCP)

| Servicio | Imagen | URL |
|---------|--------|-----|
| `fraudia-api` | `us-central1-docker.pkg.dev/gen-ai-hackathon-494720/fraudia/fraudia-api:latest` | https://fraudia-api-484146602083.us-central1.run.app |
| `fraudia-web` | `us-central1-docker.pkg.dev/gen-ai-hackathon-494720/fraudia/fraudia-web:latest` | https://fraudia-web-484146602083.us-central1.run.app |

Proyecto GCP: `gen-ai-hackathon-494720` · Región: `us-central1`

## Stack completo

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Next.js | 15.1.0 |
| Lenguaje frontend | TypeScript | 5.x |
| Estilos | Tailwind CSS + shadcn/ui | 3.x |
| Gráficas | MUI X Charts | 9.3.0 |
| Backend | FastAPI | 0.115.x |
| Lenguaje backend | Python | 3.11 |
| ORM | SQLAlchemy | 2.x |
| Driver PostgreSQL | psycopg | 3.x |
| Base de datos | AlloyDB for PostgreSQL | 16 |
| Extensión vectorial | pgvector | 768 dimensiones |
| Agente IA | Google ADK | 1.2.1 |
| Modelo conversacional | Gemini 2.5 Flash | gemini-2.5-flash |
| Modelo de embeddings | gemini-embedding-001 | 768d |
| Containerización | Docker | multi-stage build |
| CI/CD | Cloud Build | YAML pipelines |
| Registry | Artifact Registry | GCP |
| Deploy | Cloud Run | fully managed |

## Flujo de datos principal

```
1. ANÁLISIS DE SINIESTRO EXISTENTE
   AlloyDB → FastAPI → Next.js dashboard
   
2. EVALUACIÓN DE SINIESTRO NUEVO
   Formulario web → POST /api/siniestros/evaluar
   → calcular_score() (reglas) + score_modelo (ML)
   → INSERT claims.siniestros
   → retorna EvaluacionResult con alertas

3. INGESTA DE PERITAJE PDF
   Upload web → FastAPI multipart
   → Gemini multimodal (extracción texto)
   → chunking 800 palabras / 100 overlap
   → gemini-embedding-001 (768d)
   → INSERT rag.business_chunks
   → doc_id retornado para consulta futura

4. CHAT CON AGENTE
   Mensaje usuario → POST /api/chat
   → ADK session manager
   → keyword dispatch → tool selection
   → SQL query o RAG search
   → Gemini 2.5 Flash (síntesis y respuesta)
   → JSON con answer + tools_used + citations

5. FLUJO DE REVISIÓN HUMANA
   Dashboard → POST /api/siniestros/{id}/revision
   → RAMO_A_REVISOR mapping → asignación automática
   → UPDATE claims.siniestros (estado_revision, id_revisor)
   → UPDATE app.revisores (casos_activos++)
   → Visible en Kanban del dashboard
   → Analista: Aprobar / Rechazar / Reasignar (PATCH)
```

## Esquemas de base de datos

```
claims.*          → datos operativos de siniestros
  siniestros      → tabla principal (51 columnas)
  polizas         → datos de pólizas contratadas
  asegurados      → asegurados sintéticos con cédulas ecuatorianas
  vehiculos       → flota de vehículos asegurados
  conductores     → conductores asociados
  proveedores     → talleres, clínicas, peritos
  documentos      → expediente documental por siniestro
  narrativas_similares → pares TF-IDF coseno para RF-07

rag.*             → base de conocimiento vectorial
  business_chunks → chunks embebidos (reglas, glosario, ética, manual)
                    source_name distingue docs de negocio vs peritajes

app.*             → datos de la aplicación
  revisores       → 5 analistas especializados por ramo
```
