# FraudIA Claims Assistant — Estado del Proyecto

## Qué es
MVP de detección de posible fraude en siniestros para Aseguradora del Sur (HackIAthon).
El sistema genera alertas de revisión humana. **Nunca acusa fraude ni rechaza siniestros automáticamente.**

## Stack
- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2.x, psycopg 3
- **Agente:** Google ADK + Gemini 2.5 Flash
- **DB:** AlloyDB for PostgreSQL (esquemas: `claims`, `rag`, `app`)
- **RAG:** vector 768d con `gemini-embedding-001`
- **Frontend:** Next.js 15, TypeScript, Tailwind, shadcn/ui, TanStack Table, Recharts
- **Deploy:** Cloud Run (fraudia-api + fraudia-web), Artifact Registry

## Estructura del repo
```
fraud-ia/
├── apps/api/app/          FastAPI backend completo
│   ├── core/              config, db, logging
│   ├── claims/            GET /api/kpis, /api/siniestros
│   ├── providers/         GET /api/proveedores/riesgo
│   ├── documents/         GET /api/documentos/criticos
│   ├── rag/               GET /api/rag/search + chunking + embeddings
│   ├── agent/             ADK agent + 7 tools + instructions
│   └── admin/             POST /api/admin/bootstrap|load|reindex
├── apps/api/tests/        6 unit tests (test_rag.py) + integration (test_queries.py)
├── apps/web/app/          Next.js: landing, dashboard, siniestros, [id], proveedores, chat, arquitectura
├── apps/web/components/   Sidebar, badge, card, risk-badge, etc.
├── apps/web/lib/          api.ts, types.ts, utils.ts
├── data/synthetic/        11 CSVs (1000 siniestros, 3496 docs, etc.)
├── docs/business_kb/      9 documentos RAG (reglas, glosario, ética, manual, demo script)
├── infra/sql/             5 SQL: extensions, schema, indexes, views, grants
├── scripts/               bootstrap_database.py, load_csv_to_alloydb.py,
│                          ingest_business_docs.py, smoke_test_api.py
├── .env.example           Variables de entorno
├── docker-compose.yml     API + Web + PostgreSQL local
├── README.md              Guía completa de instalación y deploy
└── presentation/          pitch_outline.md
```

## APIs implementadas
```
GET  /health
GET  /api/kpis
GET  /api/siniestros?nivel_riesgo=&ramo=&search=&score_min=&limit=&offset=
GET  /api/siniestros/{id}
GET  /api/proveedores/riesgo?limit=
GET  /api/documentos/criticos
GET  /api/rag/search?query=&top_k=
POST /api/chat  { session_id, message } → { answer, tools_used, citations }
POST /api/admin/bootstrap-db
POST /api/admin/load-data
POST /api/admin/reindex-rag
```

## Herramientas del agente ADK
1. `buscar_conocimiento_negocio` — RAG sobre rag.business_chunks
2. `listar_siniestros_mayor_riesgo` — SQL: top N por score_final
3. `explicar_siniestro(id)` — SQL: detalle completo + documentos
4. `analizar_proveedores_alertas` — SQL view: v_provider_risk
5. `listar_documentos_faltantes_casos_criticos` — SQL: docs en rojos
6. `listar_casos_cerca_inicio_poliza` — SQL: dias_desde_inicio ≤ 90
7. `generar_resumen_ejecutivo` — SQL multi: KPIs + hallazgos + recomendaciones

## Score de riesgo
```
score_final = 0.6 × score_reglas + 0.4 × score_modelo_simulado
Verde Bajo:    0–39  → flujo normal
Amarillo Medio: 40–69 → revisión supervisora
Rojo Alto:    70–100 → escalar a antifraude
```

## Diferencias reales del dataset vs spec original
- `conductores.csv`: usa `rango_edad TEXT` y `antiguedad_licencia_anios INTEGER` (no edad/meses)
- `narrativas_similares.csv`: columnas reales: `id_par, id_siniestro_a, id_siniestro_b, cluster_narrativa, similitud_coseno_simulada, descripcion_a, descripcion_b`
- `vehiculos.csv`: columna extra `uso`
- `polizas.csv`: columna extra `plan_producto`
- `siniestros_scored.csv`: 51 columnas (más que el spec) — todas incluidas en el schema SQL

## Cómo correr localmente
```bash
# Backend
cd apps/api && pip install -r requirements.txt
export ALLOYDB_HOST=localhost ALLOYDB_DATABASE=fraudia ALLOYDB_USER=app_user
uvicorn app.main:app --reload --port 8080

# Frontend
cd apps/web && npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 npm run dev

# Tests (sin DB)
SKIP_DB_TESTS=1 pytest apps/api/tests/test_rag.py -v  # 6/6 pasan
```

## Flujo de setup de AlloyDB
1. `python scripts/bootstrap_database.py` — crea DB, esquemas, tablas, usuarios
2. `python scripts/load_csv_to_alloydb.py` — carga 1000 siniestros + tablas relacionadas
3. `python scripts/ingest_business_docs.py` — embebe 9 docs RAG con gemini-embedding-001
4. `python scripts/smoke_test_api.py` — prueba todos los endpoints

## Estado de tests
- `test_rag.py`: 6/6 pasan (no requieren DB) — chunking, secciones, metadatos, overlap
- `test_queries.py`: 6 integration tests (requieren AlloyDB corriendo)
- `smoke_test_api.py`: prueba HTTP contra API viva
