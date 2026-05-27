# FraudIA Claims Assistant

Sistema de apoyo para análisis de posible fraude en siniestros de seguros — **Reto HackIAthon Aseguradora del Sur**.

> **Principio ético:** Este sistema genera alertas de revisión y señales de posible riesgo. **Nunca acusa fraude ni rechaza siniestros automáticamente.** Toda decisión es responsabilidad de analistas humanos.

---

## Arquitectura

```
Usuario / Jurado
   ↓
Next.js Web App  (Cloud Run: fraudia-web)
   ↓ HTTPS/REST
FastAPI Backend  (Cloud Run: fraudia-api)
   ↓
Google ADK Agent
   ↓
Tools del agente
   ├── buscar_conocimiento_negocio  → RAG (AlloyDB vector)
   ├── listar_siniestros_mayor_riesgo → SQL
   ├── explicar_siniestro           → SQL + docs
   ├── analizar_proveedores_alertas → SQL view
   ├── listar_documentos_faltantes  → SQL join
   ├── listar_casos_cerca_inicio_poliza → SQL
   └── generar_resumen_ejecutivo    → SQL KPIs
   ↓
AlloyDB for PostgreSQL
   ├── claims.siniestros (1000 siniestros)
   ├── claims.polizas
   ├── claims.proveedores
   ├── claims.documentos
   ├── claims.asegurados
   ├── claims.vehiculos
   ├── claims.conductores
   ├── rag.business_chunks (vector 768d)
   └── app.chat_messages
   ↓
Vertex AI
   ├── Gemini 2.5 Flash (agente + respuestas)
   └── gemini-embedding-001 (RAG embeddings)
```

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, TanStack Table, Recharts |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.x, psycopg 3.x |
| Agente IA | Google ADK, Gemini 2.5 Flash |
| Base de datos | AlloyDB for PostgreSQL 16 |
| Embeddings | gemini-embedding-001 (768d) |
| Infraestructura | Cloud Run, Artifact Registry, Secret Manager, Cloud Storage |

---

## Instalación local

### Requisitos previos

- Python 3.11+
- Node.js 20+
- PostgreSQL 16 (local) o AlloyDB (producción)
- `gcloud` CLI con Application Default Credentials

### 1. Clonar y configurar variables

```bash
git clone <repo>
cd fraudia-claims
cp .env.example .env
# Editar .env con tus valores
```

### 2. Backend API

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate       # Linux/Mac
# .venv\Scripts\activate        # Windows CMD

pip install -r requirements.txt

# Variables de entorno mínimas para local:
export ALLOYDB_HOST=localhost
export ALLOYDB_PORT=5432
export ALLOYDB_DATABASE=fraudia
export ALLOYDB_USER=app_user
export ALLOYDB_PASSWORD=app_user_pass
export GOOGLE_CLOUD_PROJECT=
export APP_ENV=local

uvicorn app.main:app --reload --port 8080
```

API disponible en: http://localhost:8080  
Docs interactivos: http://localhost:8080/docs

### 3. Frontend Web

```bash
cd apps/web
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 npm run dev
```

Web disponible en: http://localhost:3000

### 4. Con Docker Compose (recomendado para local completo)

```bash
# Copiar .env y configurar
cp .env.example .env

docker compose up --build
```

- API: http://localhost:8080
- Web: http://localhost:3000
- PostgreSQL: localhost:5432

---

## Configuración de base de datos

### Crear esquema y tablas

```bash
# Variables de admin
export ALLOYDB_HOST=<ip>
export ALLOYDB_ADMIN_USER=postgres
export ALLOYDB_ADMIN_PASSWORD=<password>
export ALLOYDB_DATABASE=fraudia
export APP_DB_PASSWORD=<password_app_user>
export LOADER_DB_PASSWORD=<password_loader_user>

python scripts/bootstrap_database.py
```

Crea: base de datos `fraudia`, esquemas `claims/rag/app`, todas las tablas, vistas, índices y usuarios.

### Cargar datos sintéticos

```bash
export ALLOYDB_USER=loader_user
export ALLOYDB_PASSWORD=<loader_password>

python scripts/load_csv_to_alloydb.py
```

Carga 1000 siniestros y todas las tablas relacionadas desde `data/synthetic/`.

### Indexar documentos RAG

```bash
export GOOGLE_CLOUD_PROJECT=tu-proyecto
export ALLOYDB_USER=loader_user

python scripts/ingest_business_docs.py
```

Embebe los 9 documentos de `docs/business_kb/` con `gemini-embedding-001`.

---

## Despliegue en Google Cloud

> Todos los comandos para **Windows CMD**. En Linux/Mac reemplazar `^` por `\` y `set` por `export`.

### Variables base

```cmd
set PROJECT_ID=TU_PROJECT_ID
set REGION=us-central1
set NETWORK=fraudia-vpc
set SUBNET=fraudia-subnet
set CLUSTER_ID=fraudia-cluster
set INSTANCE_ID=fraudia-primary
set DB_NAME=fraudia
set REPO_NAME=fraudia
set API_SERVICE=fraudia-api
set WEB_SERVICE=fraudia-web
set API_IMAGE=%REGION%-docker.pkg.dev/%PROJECT_ID%/%REPO_NAME%/fraudia-api:latest
set WEB_IMAGE=%REGION%-docker.pkg.dev/%PROJECT_ID%/%REPO_NAME%/fraudia-web:latest
set BUCKET_NAME=fraudia-hackathon-%PROJECT_ID%
```

### Habilitar APIs

```cmd
gcloud services enable alloydb.googleapis.com aiplatform.googleapis.com ^
  run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com ^
  secretmanager.googleapis.com compute.googleapis.com ^
  servicenetworking.googleapis.com storage.googleapis.com
```

### Crear infraestructura

```cmd
gcloud artifacts repositories create %REPO_NAME% --repository-format=docker --location=%REGION%

gcloud compute networks create %NETWORK% --subnet-mode=custom
gcloud compute networks subnets create %SUBNET% --network=%NETWORK% --region=%REGION% --range=10.10.0.0/24

gcloud compute addresses create google-managed-services-fraudia --global --purpose=VPC_PEERING --prefix-length=16 --network=%NETWORK%
gcloud services vpc-peerings connect --service=servicenetworking.googleapis.com --ranges=google-managed-services-fraudia --network=%NETWORK%

gcloud alloydb clusters create %CLUSTER_ID% --database-version=POSTGRES_16 --password=%POSTGRES_PASSWORD% --region=%REGION% --network=projects/%PROJECT_ID%/global/networks/%NETWORK%
gcloud alloydb instances create %INSTANCE_ID% --instance-type=PRIMARY --cluster=%CLUSTER_ID% --region=%REGION% --cpu-count=2
```

### Build y deploy API

```cmd
gcloud builds submit . --config cloudbuild-api.yaml

gcloud run deploy %API_SERVICE% ^
  --image=%API_IMAGE% --region=%REGION% ^
  --network=%NETWORK% --subnet=%SUBNET% --vpc-egress=private-ranges-only ^
  --service-account=fraudia-api-sa@%PROJECT_ID%.iam.gserviceaccount.com ^
  --allow-unauthenticated ^
  --set-env-vars=GOOGLE_CLOUD_PROJECT=%PROJECT_ID%,ALLOYDB_HOST=%ALLOYDB_HOST%,ALLOYDB_DATABASE=%DB_NAME%,ALLOYDB_USER=app_user,GEMINI_MODEL=gemini-2.5-flash,EMBEDDING_MODEL=gemini-embedding-001,GCS_BUCKET=%BUCKET_NAME% ^
  --set-secrets=ALLOYDB_PASSWORD=fraudia-app-db-password:latest
```

### Build y deploy Web

```cmd
gcloud builds submit . --config cloudbuild-web.yaml

gcloud run deploy %WEB_SERVICE% ^
  --image=%WEB_IMAGE% --region=%REGION% --allow-unauthenticated ^
  --set-env-vars=NEXT_PUBLIC_API_BASE_URL=%API_URL%
```

---

## Endpoints de la API

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |
| GET | `/api/kpis` | KPIs: totales, montos, score promedio |
| GET | `/api/siniestros` | Lista paginada con filtros |
| GET | `/api/siniestros/{id}` | Detalle completo de un siniestro |
| GET | `/api/proveedores/riesgo` | Ranking de proveedores por riesgo |
| GET | `/api/documentos/criticos` | Docs faltantes en casos rojos |
| GET | `/api/rag/search?query=` | Búsqueda semántica en base de conocimiento |
| POST | `/api/chat` | Chat con el agente IA |
| POST | `/api/admin/bootstrap-db` | Inicializar base de datos |
| POST | `/api/admin/load-data` | Cargar CSVs |
| POST | `/api/admin/reindex-rag` | Re-indexar documentos RAG |

---

## Preguntas de demo para el jurado

```
¿Cuáles son los 10 siniestros con mayor riesgo?
¿Por qué el siniestro SIN-00003 fue marcado como rojo?
¿Qué proveedores concentran más alertas rojas?
¿Qué documentos faltan en los casos críticos?
¿Qué siniestros ocurrieron cerca del inicio de la póliza?
¿Qué patrones se repiten en los reclamos sospechosos?
¿Qué significa riesgo amarillo?
¿Cuál es la diferencia entre score de reglas y score del modelo?
Genera un resumen ejecutivo de los casos críticos.
Recomienda qué casos debería revisar primero el analista.
¿Qué limitaciones éticas tiene el modelo?
¿Cómo detectan narrativas similares?
```

---

## Limitaciones éticas

1. **No acusa fraude.** El sistema genera alertas de posible riesgo. La determinación de fraude es una decisión legal y humana.
2. **Datos sintéticos.** Todos los datos son ficticios y no corresponden a personas ni casos reales.
3. **Tasa de error.** El modelo puede generar falsas alarmas. Todo caso flaggeado requiere revisión humana.
4. **No automatiza rechazos.** Ningún siniestro es rechazado automáticamente por el sistema.
5. **Transparencia.** Cada score viene acompañado de las alertas específicas que lo generaron.
6. **Sesgo potencial.** El score debe ser monitoreado periódicamente para detectar sesgos por ciudad, ramo o proveedor.

---

## Estructura del repositorio

```
fraudia-claims/
├── apps/
│   ├── api/              FastAPI backend + ADK agent
│   └── web/              Next.js frontend
├── data/synthetic/       CSVs sintéticos (1000 siniestros)
├── docs/business_kb/     9 documentos de conocimiento RAG
├── infra/sql/            5 archivos SQL (schema, índices, vistas)
├── scripts/              Bootstrap, carga, ingestión RAG, smoke test
└── presentation/         Outline del pitch
```

---

## Tests

```bash
cd apps/api
pip install pytest
pytest tests/test_rag.py -v          # Tests unitarios (no requieren DB)
pytest tests/ -v                     # Todos (requieren DB)

# Smoke test contra API corriendo
python scripts/smoke_test_api.py
```

---

## Equipo

Desarrollado para el **HackIAthon — Reto Aseguradora del Sur** usando Google Cloud, Gemini y AlloyDB.
