import { AlertTriangle, ArrowRight, Database, Zap, Globe, Bot, Server, Shield } from 'lucide-react'

// ── Inline SVG logos ─────────────────────────────────────────────────────────

const NextjsLogo = () => (
  <svg viewBox="0 0 180 180" className="w-full h-full" aria-label="Next.js">
    <circle cx="90" cy="90" r="90" fill="#000" />
    <path
      d="M149.508 157.52L69.142 54H54v71.97h12.114V69.384l73.303 95.131a90.76 90.76 0 0010.09-7Z"
      fill="url(#nxt-a)"
    />
    <rect x="108" y="54" width="12" height="72" fill="url(#nxt-b)" />
    <defs>
      <linearGradient id="nxt-a" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="nxt-b" x1="108" y1="54" x2="108.5" y2="106.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
)

const TypeScriptLogo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="TypeScript">
    <rect width="100" height="100" rx="8" fill="#3178C6" />
    <path d="M56 71.4v7.5c1.2.6 2.7 1.1 4.4 1.4 1.7.3 3.5.5 5.4.5 1.9 0 3.7-.2 5.4-.6 1.7-.4 3.1-1 4.4-1.9 1.2-.9 2.2-2 2.9-3.4.7-1.4 1.1-3.1 1.1-5.1 0-1.5-.2-2.8-.7-3.9-.5-1.1-1.2-2.1-2-3s-1.9-1.7-3-2.4c-1.2-.7-2.4-1.4-3.8-2l-3.2-1.3c-.9-.4-1.7-.7-2.3-1.1-.6-.4-1.1-.7-1.5-1.1-.4-.4-.7-.8-.9-1.2-.2-.5-.3-1-.3-1.6 0-.6.1-1.1.3-1.5.2-.4.5-.8.9-1.1.4-.3.9-.6 1.5-.7.6-.2 1.3-.3 2-.3 1.4 0 2.8.2 4.2.7 1.4.5 2.7 1.2 3.8 2.2V47c-1.1-.8-2.4-1.4-3.8-1.8-1.4-.4-2.9-.6-4.6-.6-1.8 0-3.5.2-5 .7s-2.8 1.1-3.9 2c-1.1.9-1.9 1.9-2.5 3.2-.6 1.2-.9 2.6-.9 4.1 0 2.7.8 5 2.4 6.7 1.6 1.8 4 3.2 7.2 4.4l3.3 1.3c2.3.9 3.9 1.8 4.7 2.7.8.9 1.2 2 1.2 3.3 0 .6-.1 1.2-.4 1.7-.3.5-.7 1-1.2 1.4-.5.4-1.1.7-1.8.9-.7.2-1.5.3-2.4.3-1.7 0-3.4-.4-5-1.1-1.6-.7-3-1.8-4.2-3.1zM38 46.4h12V40H18v6.4h12V80h8V46.4z" fill="#fff" />
  </svg>
)

const TailwindLogo = () => (
  <svg viewBox="0 0 54 33" className="w-full h-full" aria-label="Tailwind CSS">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M27 0C19.8 0 15.3 3.6 13.5 10.8c2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 12.716 33.808 16 40.5 16c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C37.256 3.284 34.192 0 27 0zM13.5 16C6.3 16 1.8 19.6 0 26.8c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C16.744 28.716 19.808 32 26.5 32c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C23.756 19.284 20.692 16 13.5 16z"
      fill="#38BDF8"
    />
  </svg>
)

const PythonLogo = () => (
  <svg viewBox="0 0 110 110" className="w-full h-full" aria-label="Python">
    <path d="M54.9 4.4c-26.4 0-24.8 11.4-24.8 11.4l.03 11.8h25.2v3.5H21.5S4.6 29.3 4.6 55.9c0 26.6 14.7 25.6 14.7 25.6h8.8v-12.3s-.5-14.7 14.5-14.7h24.9s14 .2 14-13.5V18.2s2.1-13.8-26.6-13.8zM41 12.3a4.3 4.3 0 110 8.6 4.3 4.3 0 010-8.6z" fill="#387EB8"/>
    <path d="M55.5 105.6c26.4 0 24.8-11.5 24.8-11.5l-.03-11.8H55.1v-3.5h34.1s16.9 1.8 16.9-24.8c0-26.6-14.7-25.6-14.7-25.6h-8.8v12.3s.5 14.7-14.5 14.7H43.2s-14-.2-14 13.5v21.8s-2.1 13.9 26.3 13.9zm13.7-8.1a4.3 4.3 0 110-8.6 4.3 4.3 0 010 8.6z" fill="#FFE052"/>
  </svg>
)

const FastAPILogo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="FastAPI">
    <circle cx="50" cy="50" r="50" fill="#009688" />
    <path d="M54 18L26 54h24l-4 28 28-36H50l4-28z" fill="#fff" />
  </svg>
)

const GeminiLogo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="Gemini">
    <defs>
      <linearGradient id="gem-g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4"/>
        <stop offset="33%" stopColor="#9B72CB"/>
        <stop offset="66%" stopColor="#D96570"/>
        <stop offset="100%" stopColor="#D96570"/>
      </linearGradient>
    </defs>
    <path
      d="M50 8C50 8 56 32 74 50C56 68 50 92 50 92C50 92 44 68 26 50C44 32 50 8 50 8Z"
      fill="url(#gem-g)"
    />
    <path
      d="M50 25C50 25 58.5 40 70 50C58.5 60 50 75 50 75C50 75 41.5 60 30 50C41.5 40 50 25 50 25Z"
      fill="black" opacity="0.15"
    />
  </svg>
)

const PostgresLogo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="PostgreSQL">
    <circle cx="50" cy="50" r="50" fill="#336791" />
    <text x="50" y="68" textAnchor="middle" fontSize="52" fontWeight="bold" fill="#fff" fontFamily="serif">
      Pg
    </text>
  </svg>
)

const AlloyDBLogo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="AlloyDB">
    <defs>
      <linearGradient id="alloy-g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4"/>
        <stop offset="100%" stopColor="#34A853"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="16" fill="url(#alloy-g)" />
    <ellipse cx="50" cy="34" rx="26" ry="10" fill="rgba(255,255,255,0.9)" />
    <rect x="24" y="34" width="52" height="32" fill="rgba(255,255,255,0.15)" />
    <ellipse cx="50" cy="66" rx="26" ry="10" fill="rgba(255,255,255,0.7)" />
    <path d="M24 34 Q50 28 76 34 L76 66 Q50 72 24 66Z" fill="rgba(255,255,255,0.08)" />
  </svg>
)

const CloudRunLogo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="Cloud Run">
    <defs>
      <linearGradient id="cr-g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4"/>
        <stop offset="100%" stopColor="#1565C0"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="16" fill="url(#cr-g)" />
    <path d="M30 70 L50 20 L70 70 L58 70 L50 48 L42 70Z" fill="#fff" opacity="0.9" />
    <rect x="35" y="72" width="30" height="6" rx="3" fill="#fff" opacity="0.5" />
  </svg>
)

const GoogleADKLogo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="Google ADK">
    <rect width="100" height="100" rx="16" fill="#202124" />
    <text x="50" y="40" textAnchor="middle" fontSize="16" fill="#4285F4" fontWeight="bold" fontFamily="sans-serif">ADK</text>
    <circle cx="50" cy="60" r="14" fill="none" stroke="#34A853" strokeWidth="3" />
    <circle cx="50" cy="60" r="6" fill="#EA4335" />
    <line x1="50" y1="46" x2="50" y2="38" stroke="#FBBC05" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="64" y1="60" x2="72" y2="60" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="36" y1="60" x2="28" y2="60" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="50" y1="74" x2="50" y2="82" stroke="#FBBC05" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

// ── Data ─────────────────────────────────────────────────────────────────────

const STACK = [
  {
    title: 'Frontend',
    color: '#3b82f6',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    logo: NextjsLogo,
    secondaryLogos: [TypeScriptLogo, TailwindLogo],
    items: ['Next.js 15 App Router', 'TypeScript strict', 'Tailwind CSS dark', 'TanStack Table v8', 'MUI X Charts v9', 'shadcn/ui'],
  },
  {
    title: 'Backend API',
    color: '#a855f7',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
    logo: FastAPILogo,
    secondaryLogos: [PythonLogo],
    items: ['Python 3.11', 'FastAPI async', 'SQLAlchemy 2.x ORM', 'psycopg 3', 'Pydantic v2', 'Uvicorn ASGI'],
  },
  {
    title: 'Agente IA',
    color: '#22c55e',
    border: 'border-green-500/20',
    bg: 'bg-green-500/5',
    logo: GeminiLogo,
    secondaryLogos: [GoogleADKLogo],
    items: ['Google ADK', 'Gemini 2.5 Flash', '7 function tools', 'RAG 768D vectors', 'Español nativo', 'gemini-embedding-001'],
  },
  {
    title: 'Infraestructura',
    color: '#FF6500',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/5',
    logo: AlloyDBLogo,
    secondaryLogos: [PostgresLogo, CloudRunLogo],
    items: ['AlloyDB PostgreSQL 16', 'Vector Search 768D', 'Cloud Run (x2)', 'Artifact Registry', 'Secret Manager', 'Esquemas: claims / rag / app'],
  },
]

const TOOLS = [
  { name: 'buscar_conocimiento_negocio',                type: 'RAG',     color: '#22c55e', border: 'border-green-800',  bg: 'bg-green-900/30',  desc: 'Base vectorial: reglas, glosario, ética' },
  { name: 'listar_siniestros_mayor_riesgo',             type: 'SQL',     color: '#3b82f6', border: 'border-blue-800',   bg: 'bg-blue-900/30',   desc: 'Top N por score_final con alertas' },
  { name: 'explicar_siniestro',                         type: 'SQL+RAG', color: '#a855f7', border: 'border-purple-800', bg: 'bg-purple-900/30', desc: 'Detalle completo + documentos + proveedor' },
  { name: 'analizar_proveedores_alertas',               type: 'SQL',     color: '#3b82f6', border: 'border-blue-800',   bg: 'bg-blue-900/30',   desc: 'Ranking por concentración de Rojo Alto' },
  { name: 'listar_documentos_faltantes_casos_criticos', type: 'SQL',     color: '#3b82f6', border: 'border-blue-800',   bg: 'bg-blue-900/30',   desc: 'Docs faltantes en casos críticos' },
  { name: 'listar_casos_cerca_inicio_poliza',           type: 'SQL',     color: '#3b82f6', border: 'border-blue-800',   bg: 'bg-blue-900/30',   desc: 'Siniestros en primeros 90 días de póliza' },
  { name: 'generar_resumen_ejecutivo',                  type: 'SQL',     color: '#eab308', border: 'border-yellow-800', bg: 'bg-yellow-900/30', desc: 'KPIs globales + top casos + recomendaciones' },
]

const FLOW = [
  { icon: Globe,    label: 'Next.js 15',    sub: 'Frontend',       color: '#3b82f6' },
  { icon: Server,   label: 'FastAPI',       sub: 'Backend API',    color: '#a855f7' },
  { icon: Bot,      label: 'Gemini ADK',    sub: 'Agente IA',      color: '#22c55e' },
  { icon: Database, label: 'AlloyDB',       sub: 'Vector + SQL',   color: '#FF6500' },
  { icon: Shield,   label: 'FraudSweep',    sub: 'Analista humano',color: '#C8FF00' },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ArquitecturaPage() {
  return (
    <div className="bg-[#111111] min-h-screen p-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-1">Sistema</p>
        <h1 className="text-5xl font-black text-white leading-none tracking-tight uppercase">Arquitectura</h1>
        <p className="text-neutral-500 mt-2">FraudSweep Claims Assistant · Stack Tecnológico & Herramientas del Agente</p>
      </div>

      {/* ── Flow diagram ───────────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-4">Flujo del sistema</p>
        <div className="rounded-2xl border border-[#2A2A2A] bg-[#0f0f0f] p-6">
          <div className="flex items-center justify-between gap-2">
            {FLOW.map((node, i) => {
              const Icon = node.icon
              return (
                <div key={node.label} className="flex items-center gap-2 flex-1">
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${node.color}15`, border: `1px solid ${node.color}30` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: node.color }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white leading-tight">{node.label}</p>
                      <p className="text-[10px] text-neutral-600 mt-0.5">{node.sub}</p>
                    </div>
                  </div>
                  {i < FLOW.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-neutral-700 flex-shrink-0 mb-5" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Score formula */}
          <div className="mt-6 pt-5 border-t border-[#1a1a1a] flex items-center justify-center gap-6 flex-wrap">
            <p className="text-xs text-neutral-600 uppercase tracking-widest">Score final =</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                <span className="text-sm font-bold text-[#C8FF00]">0.6</span>
                <span className="text-xs text-neutral-500">× Score reglas</span>
              </div>
              <span className="text-neutral-600">+</span>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                <span className="text-sm font-bold text-[#C8FF00]">0.4</span>
                <span className="text-xs text-neutral-500">× Modelo simulado</span>
              </div>
              <span className="text-neutral-600">→</span>
              <div className="flex items-center gap-3">
                {[
                  { label: 'Verde', range: '0–39',   color: '#22c55e' },
                  { label: 'Amarillo', range: '40–69', color: '#eab308' },
                  { label: 'Rojo',  range: '70–100', color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-xs" style={{ color: s.color }}>{s.label}</span>
                    <span className="text-xs text-neutral-700">{s.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stack grid ─────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-4">Stack tecnológico</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STACK.map((s) => {
            const MainLogo = s.logo
            return (
              <div
                key={s.title}
                className={`rounded-2xl ${s.bg} border ${s.border} p-5 flex flex-col gap-4`}
              >
                {/* Logos row */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex-shrink-0">
                    <MainLogo />
                  </div>
                  <div className="flex gap-2">
                    {s.secondaryLogos.map((Logo, i) => (
                      <div key={i} className="w-8 h-8 flex-shrink-0 opacity-80">
                        <Logo />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <p className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: s.color }}>
                    {s.title}
                  </p>
                  <div className="h-px w-8 rounded" style={{ background: s.color }} />
                </div>

                {/* Items */}
                <ul className="space-y-1.5 flex-1">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-neutral-400">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Agent Tools ────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Tools del Agente ADK</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] font-bold">
            7 herramientas
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {TOOLS.map((t, i) => (
            <div
              key={t.name}
              className={`rounded-xl p-4 border ${t.border} ${t.bg} flex items-start gap-3`}
            >
              <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded font-mono"
                  style={{ color: t.color, background: `${t.color}20`, border: `1px solid ${t.color}40` }}
                >
                  {t.type}
                </span>
                <span className="text-[10px] text-neutral-700 font-mono">#{i + 1}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-mono font-bold text-white leading-tight truncate" title={t.name}>
                  {t.name}
                </p>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Disclaimer ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#FF6500]/5 border border-[#FF6500]/20 p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-[#FF6500] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-neutral-400 leading-relaxed">
          <span className="font-bold text-[#FF6500]">Principio ético central:</span>{' '}
          FraudSweep genera <strong className="text-white">alertas de revisión</strong>, nunca acusaciones.
          Ningún siniestro es rechazado automáticamente. Toda decisión final recae en analistas humanos calificados.
          Datos del demo 100% sintéticos.
        </p>
      </div>

    </div>
  )
}
