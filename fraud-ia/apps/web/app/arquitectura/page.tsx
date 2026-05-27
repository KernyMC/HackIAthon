const stackSections = [
  {
    title: 'Frontend',
    color: 'blue' as const,
    items: [
      'Next.js 15 con TypeScript',
      'Tailwind CSS — dark theme',
      'TanStack Table — tabla de siniestros',
      'Recharts — gráficos de distribución',
      'shadcn/ui — componentes base',
    ],
  },
  {
    title: 'Backend API',
    color: 'purple' as const,
    items: [
      'Python 3.11 + FastAPI',
      'SQLAlchemy 2.x ORM',
      'psycopg 3 — driver PostgreSQL',
      'Pydantic v2 — validación',
      'Uvicorn — servidor ASGI',
    ],
  },
  {
    title: 'Agente IA',
    color: 'green' as const,
    items: [
      'Google ADK — orquestación',
      'Gemini 2.5 Flash — respuestas',
      '7 tools especializadas',
      'RAG + SQL combinados',
      'Respuestas siempre en español',
    ],
  },
  {
    title: 'Infraestructura',
    color: 'orange' as const,
    items: [
      'AlloyDB for PostgreSQL 16',
      'vector (768d) — embeddings',
      'Cloud Run — serverless containers',
      'Artifact Registry — imágenes Docker',
      'Secret Manager — credenciales seguras',
    ],
  },
]

const colorMap = {
  blue: { dot: 'bg-blue-400', title: 'text-blue-400', border: 'border-blue-800/40', bg: 'bg-blue-900/10' },
  purple: { dot: 'bg-purple-400', title: 'text-purple-400', border: 'border-purple-800/40', bg: 'bg-purple-900/10' },
  green: { dot: 'bg-green-400', title: 'text-green-400', border: 'border-green-800/40', bg: 'bg-green-900/10' },
  orange: { dot: 'bg-orange-400', title: 'text-orange-400', border: 'border-orange-800/40', bg: 'bg-orange-900/10' },
}

const agentTools = [
  { name: 'buscar_conocimiento_negocio', type: 'RAG', desc: 'Busca en la base vectorial de reglas, glosario, ética y proceso de revisión' },
  { name: 'listar_siniestros_mayor_riesgo', type: 'SQL', desc: 'Devuelve los N siniestros con mayor score_final con alertas y acción sugerida' },
  { name: 'explicar_siniestro', type: 'SQL+RAG', desc: 'Detalle completo: score, alertas, documentos, proveedor y póliza' },
  { name: 'analizar_proveedores_alertas', type: 'SQL', desc: 'Ranking de proveedores por concentración de casos Rojo Alto' },
  { name: 'listar_documentos_faltantes_casos_criticos', type: 'SQL', desc: 'Documentos faltantes o inconsistentes en casos críticos' },
  { name: 'listar_casos_cerca_inicio_poliza', type: 'SQL', desc: 'Siniestros en los primeros 90 días de vigencia — señal de riesgo moral' },
  { name: 'generar_resumen_ejecutivo', type: 'SQL', desc: 'KPIs, top proveedores, top casos y recomendaciones para jefatura' },
]

const toolTypeStyle: Record<string, string> = {
  RAG: 'bg-green-900/40 text-green-300 border border-green-800',
  'SQL+RAG': 'bg-purple-900/40 text-purple-300 border border-purple-800',
  SQL: 'bg-blue-900/40 text-blue-300 border border-blue-800',
}

const ethicalPrinciples = [
  'El sistema nunca acusa fraude — solo genera alertas de posible riesgo',
  'Ningún siniestro es rechazado automáticamente por el sistema',
  'Toda decisión final es responsabilidad de analistas humanos calificados',
  'Todos los datos del demo son 100% sintéticos y anonimizados',
  'Cada score es explicable: el analista ve qué alertas lo generaron',
  'El sistema debe ser monitoreado periódicamente para detectar sesgos',
]

export default function ArquitecturaPage() {
  return (
    <div className="p-8 animate-fade-in max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Arquitectura del Sistema</h1>
        <p className="text-gray-400 text-sm mt-1">
          FraudIA Claims Assistant — Hackathon Aseguradora del Sur 2025
        </p>
      </div>

      {/* Architecture Diagram */}
      <div className="rounded-xl bg-[hsl(222,47%,10%)] border border-[hsl(217,33%,20%)] p-6 mb-8 overflow-x-auto">
        <pre className="text-green-400 text-xs leading-relaxed font-mono">{`
  Usuario / Analista / Jurado
         │
         ▼
  ┌─────────────────────────────────────┐
  │   Next.js 15 Web App                │  Cloud Run: fraudia-web
  │   TypeScript · Tailwind CSS         │  Port 8080
  │   TanStack Table · Recharts         │
  └─────────────────────────────────────┘
         │  HTTPS REST API
         ▼
  ┌─────────────────────────────────────┐
  │   FastAPI Backend                   │  Cloud Run: fraudia-api
  │   Python 3.11 · Uvicorn             │  Port 8080 · VPC Direct Egress
  │   SQLAlchemy 2.x · Pydantic v2      │
  └─────────────────────────────────────┘
         │
         ▼
  ┌─────────────────────────────────────┐
  │   Google ADK Agent                  │
  │   Model: Gemini 2.5 Flash           │
  │   7 Function Tools                  │
  └─────────────────────────────────────┘
         │
    ┌────┴──────────────────────────────┐
    ▼                                   ▼
  SQL Tools                          RAG Tool
  (siniestros, proveedores, KPIs)   (reglas, glosario, ética)
    │                                   │
    └──────────────────┬────────────────┘
                       ▼
  ┌───────────────────────────────────────────────────┐
  │             AlloyDB for PostgreSQL 16             │
  │                                                   │
  │  claims.*           rag.*            app.*         │
  │  ├─ siniestros      ├─ documents     ├─ sessions   │
  │  ├─ polizas         └─ chunks        ├─ messages   │
  │  ├─ proveedores         (vector768)  └─ tool_calls │
  │  ├─ documentos                                     │
  │  ├─ asegurados      Extensiones:                   │
  │  ├─ vehiculos       vector · alloydb_scann         │
  │  └─ conductores     pg_trgm · google_ml_integration│
  └───────────────────────────────────────────────────┘
         │
         ▼
  ┌─────────────────────────────────────┐
  │       Vertex AI (Google Cloud)      │
  │  ├─ Gemini 2.5 Flash — respuestas   │
  │  └─ gemini-embedding-001 — RAG 768d │
  └─────────────────────────────────────┘`}</pre>
      </div>

      {/* Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {stackSections.map((section) => {
          const c = colorMap[section.color]
          return (
            <div
              key={section.title}
              className={`rounded-xl border ${c.border} ${c.bg} p-5`}
            >
              <h3 className={`font-bold text-base mb-3 ${c.title}`}>{section.title}</h3>
              <ul className="space-y-1.5">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Agent Tools */}
      <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-6 mb-8">
        <h2 className="text-white font-bold text-base mb-4">Tools del Agente ADK</h2>
        <div className="space-y-3">
          {agentTools.map((tool) => (
            <div key={tool.name} className="flex items-start gap-3 py-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono flex-shrink-0 mt-0.5 ${toolTypeStyle[tool.type] || toolTypeStyle['SQL']}`}
              >
                {tool.type}
              </span>
              <div>
                <p className="text-white text-sm font-mono">{tool.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{tool.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ethical Principles */}
      <div className="rounded-xl bg-yellow-900/10 border border-yellow-800/50 p-6">
        <h2 className="text-yellow-400 font-bold text-base mb-4">Principios Eticos y Limitaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ethicalPrinciples.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-yellow-400 mt-0.5 flex-shrink-0 text-base leading-none">+</span>
              <span className="text-gray-300">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
