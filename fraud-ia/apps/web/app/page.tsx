'use client'

import Link from 'next/link'
import Image from 'next/image'
import { TourStartButton } from '@/components/Tour/TourStartButton'
import { useMemo } from 'react'
import {
  ArrowRight, Activity, TrendingUp, AlertTriangle, CheckCircle,
  Cpu, Database, Lock, Zap, MessageSquare, BarChart3, FileText,
  ShieldAlert, Building2, FilePlus, GitBranch, Sparkles,
  LayoutDashboard, ChevronRight,
} from 'lucide-react'

// ── Sparkline data ──────────────────────────────────────────────────────────
const SPARK_RAW = [18, 22, 19, 28, 24, 31, 38, 35, 42, 48, 44, 52]

function buildSparkCoords(pts: number[], w: number, h: number) {
  const mx = Math.max(...pts), mn = Math.min(...pts), rng = mx - mn || 1
  const step = w / (pts.length - 1)
  return pts.map((v, i) => ({
    x: +(i * step).toFixed(2),
    y: +(h - ((v - mn) / rng) * (h - 10) - 5).toFixed(2),
  }))
}

// ── Mock claims ─────────────────────────────────────────────────────────────
const CLAIMS = [
  { id: 'SIN-00847', ramo: 'Automóvil', score: 94, nivel: 'Alto',  monto: '$12,400' },
  { id: 'SIN-00523', ramo: 'Hogar',     score: 72, nivel: 'Alto',  monto: '$8,200'  },
  { id: 'SIN-00981', ramo: 'Salud',     score: 55, nivel: 'Medio', monto: '$3,100'  },
  { id: 'SIN-00312', ramo: 'Vida',      score: 28, nivel: 'Bajo',  monto: '$1,900'  },
]

const RISK: Record<string, { bg: string; text: string; dot: string; bar: string }> = {
  Alto:  { bg: 'bg-red-500/10',    text: 'text-red-400',    dot: 'bg-red-500',    bar: 'bg-red-500'    },
  Medio: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-500', bar: 'bg-yellow-500' },
  Bajo:  { bg: 'bg-green-500/10',  text: 'text-green-400',  dot: 'bg-green-500',  bar: 'bg-green-500'  },
}

// ── Features (páginas reales del sistema) ───────────────────────────────────
const FEATURES = [
  {
    icon: LayoutDashboard,
    href: '/dashboard',
    label: 'Dashboard',
    title: 'Centro de mando en tiempo real',
    desc: 'KPIs, gráficas interactivas, mapa de calor ciudad × ramo, Kanban de revisión y cola de casos prioritarios en un solo lugar.',
    tag: 'GridStack · MUI X Charts',
    accent: '#C8FF00',
  },
  {
    icon: FileText,
    href: '/siniestros',
    label: 'Siniestros',
    title: 'Lista paginada con filtros avanzados',
    desc: 'Filtra por nivel de riesgo, ramo, score mínimo y estado de revisión. Tabs: Sin revisar / En revisión / Aprobados / Rechazados.',
    tag: 'TanStack Table v8',
    accent: '#eab308',
  },
  {
    icon: MessageSquare,
    href: '/chat',
    label: 'Agente IA',
    title: 'Chat conversacional con Google ADK',
    desc: 'Consulta el portafolio en lenguaje natural. El agente usa 9 herramientas SQL+RAG para responder, con citas y gráficas automáticas.',
    tag: 'ADK + Gemini 2.5 Flash',
    accent: '#C8FF00',
  },
  {
    icon: FilePlus,
    href: '/evaluar',
    label: 'Evaluar',
    title: 'Ingreso manual + peritaje PDF',
    desc: 'Evalúa siniestros nuevos con formulario. Sube un PDF de peritaje: Gemini lo analiza y lo indexa en el RAG para consulta posterior.',
    tag: 'Multimodal · gemini-embedding-001',
    accent: '#FF6500',
  },
  {
    icon: Building2,
    href: '/proveedores',
    label: 'Proveedores',
    title: 'Ranking por concentración de riesgo',
    desc: 'Tabla ordenada por casos Rojo Alto, score promedio y monto reclamado. Marca proveedores en lista restrictiva automáticamente.',
    tag: 'claims.v_provider_risk',
    accent: '#a855f7',
  },
  {
    icon: ShieldAlert,
    href: '/reglas',
    label: 'Reglas',
    title: 'Catálogo visual de reglas antifraude',
    desc: 'Las 7 reglas activas (RF-01..RF-07) con severidad, puntos y descripción. Muestra la fórmula de scoring y los umbrales de clasificación.',
    tag: 'RF-01..RF-07 · Score Engine',
    accent: '#ef4444',
  },
  {
    icon: BarChart3,
    href: '/reportes',
    label: 'Reportes',
    title: 'Reporte ejecutivo del portafolio',
    desc: 'KPIs agregados, distribución por nivel de riesgo, reglas más frecuentemente activadas, tabla por ramo y recomendaciones con datos en vivo.',
    tag: 'GET /api/analytics/resumen',
    accent: '#22c55e',
  },
  {
    icon: GitBranch,
    href: '/arquitectura',
    label: 'Arquitectura',
    title: 'Diagrama técnico del sistema',
    desc: 'Visualización del flujo de datos: Next.js → FastAPI → AlloyDB + Vertex AI. Diseñado para presentaciones técnicas al jurado.',
    tag: 'Cloud Run · AlloyDB AI',
    accent: '#C8FF00',
  },
]

// ── How it works ────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: '01',
    title: 'Siniestro ingresa al sistema',
    desc: 'El analista sube el caso manualmente en /evaluar o el sistema carga el dataset. Se capturan ramo, monto, proveedor, documentos y descripción.',
    color: '#C8FF00',
  },
  {
    n: '02',
    title: 'Motor de scoring aplica 7 reglas',
    desc: 'RF-01..RF-07 evalúan inicio de póliza, proveedor, monto, documentos, demora en reporte, historial y similitud de narrativas. Score 0–100.',
    color: '#FF6500',
  },
  {
    n: '03',
    title: 'Analista revisa la cola priorizada',
    desc: 'Los casos Rojo Alto (≥70) escalan a la unidad antifraude. El Kanban asigna un revisor especializado por ramo. Decisión final: humana.',
    color: '#ef4444',
  },
]

// ── Fraud rules ─────────────────────────────────────────────────────────────
const RULES = [
  { code: 'RF-01', label: 'Inicio temprano de póliza', pts: 30, sev: 'Crítico', color: '#ef4444' },
  { code: 'RF-02', label: 'Proveedor en lista restrictiva', pts: 35, sev: 'Crítico', color: '#ef4444' },
  { code: 'RF-03', label: 'Monto atípico por ramo', pts: 20, sev: 'Alto', color: '#f97316' },
  { code: 'RF-04', label: 'Documentos incompletos', pts: 10, sev: 'Medio', color: '#eab308' },
  { code: 'RF-05', label: 'Reporte tardío', pts: 5, sev: 'Bajo', color: '#22c55e' },
  { code: 'RF-06', label: 'Historial de siniestros elevado', pts: 20, sev: 'Alto', color: '#f97316' },
  { code: 'RF-07', label: 'Narrativa similar (fraude coordinado)', pts: 25, sev: 'Crítico', color: '#ef4444' },
]

// ── Metrics ─────────────────────────────────────────────────────────────────
const METRICS = [
  { value: '1.000',   label: 'Siniestros analizados', sub: 'Dataset sintético Ecuador' },
  { value: '7',       label: 'Reglas antifraude',      sub: 'RF-01 a RF-07 configurables' },
  { value: '<1s',     label: 'Tiempo de scoring',      sub: 'Por siniestro al ingreso'   },
  { value: '9',       label: 'Herramientas del agente', sub: 'SQL + RAG + Gemini'        },
]

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const W = 240, H = 64
  const coords = useMemo(() => buildSparkCoords(SPARK_RAW, W, H), [])
  const stroke  = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area    = `${stroke} L ${coords[coords.length - 1].x} ${H} L 0 ${H} Z`
  const lastPt  = coords[coords.length - 1]

  return (
    <div className="bg-[#09090b] min-h-screen text-white overflow-x-hidden">

      {/* ══ NAVBAR ════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-[#1f1f1f] bg-[#09090b]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FraudIA" width={28} height={28} className="flex-shrink-0" />
            <span className="text-sm font-black tracking-widest text-white uppercase">
              Fraud<span className="text-[#C8FF00]">IA</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider border border-[#2a2a2a] text-zinc-600 uppercase">
              Claims Assistant
            </span>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/reglas"
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-zinc-500 hover:text-white text-xs font-semibold transition-colors"
            >
              Reglas
            </Link>
            <Link
              href="/chat"
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-zinc-500 hover:text-white text-xs font-semibold transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Agente IA
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C8FF00] hover:bg-[#d4ff33] text-zinc-950 text-xs font-black transition-all duration-150 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section data-tour="landing-hero" className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">

        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(#C8FF00 1px, transparent 1px), linear-gradient(90deg, #C8FF00 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-[#C8FF00]/[0.04] blur-[130px] rounded-full" />
        </div>

        <div className="relative flex flex-col lg:flex-row gap-12 lg:gap-14 items-start lg:items-center">

          {/* ── Left: Copy ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">



            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-[-0.03em] leading-[0.92] text-white mb-5 uppercase">
              DETECCIÓN<br />
              DE FRAUDE<br />
              <span className="text-[#C8FF00]">EXPLICABLE</span><br />
              Y AUDITABLE.
            </h1>

            <p className="text-zinc-400 text-sm md:text-[15px] leading-relaxed mb-8 max-w-[420px]">
              FraudIA analiza siniestros de seguros con 7 reglas de negocio y un agente conversacional Gemini 2.5 Flash. Cada alerta es trazable. La decisión final siempre es humana.
            </p>

            <ul className="space-y-3 mb-10">
              {[
                { icon: TrendingUp, text: 'Score de riesgo 0–100 calculado en menos de 1 segundo' },
                { icon: Activity,   text: 'Agente IA con 9 herramientas SQL + RAG sobre AlloyDB'  },
                { icon: GitBranch,  text: 'Detección de fraude coordinado por similitud de narrativas' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#C8FF00]/10 border border-[#C8FF00]/10">
                    <Icon className="w-2.5 h-2.5 text-[#C8FF00]" />
                  </div>
                  <span className="text-sm text-zinc-300 leading-snug">{text}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8FF00] hover:bg-[#d4ff33] text-zinc-950 font-black rounded-xl text-sm transition-colors duration-150 cursor-pointer lime-glow"
              >
                <LayoutDashboard className="w-4 h-4" />
                Ir al Dashboard
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-[#2a2a2a] hover:border-[#C8FF00]/30 hover:bg-[#111111] text-zinc-300 font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Chat con la IA
              </Link>
              <TourStartButton />
            </div>
          </div>

          {/* ── Right: Dashboard widget ────────────────────────────────────── */}
          <div className="w-full lg:w-[430px] flex-shrink-0">
            <div className="rounded-2xl border border-[#222] bg-[#0f0f0f] overflow-hidden shadow-2xl">

              {/* Widget header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0d0d0d]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] pulse-dot" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.12em]">Monitor en vivo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-700 font-mono">Score Engine v2.1</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                </div>
              </div>

              {/* Sparkline */}
              <div className="px-4 pt-3.5 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">Alertas / 12 meses</span>
                  <span className="text-[10px] font-black text-[#C8FF00] font-mono">+34% detectado</span>
                </div>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" aria-hidden>
                  <defs>
                    <linearGradient id="lp-spark-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#C8FF00" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#C8FF00" stopOpacity="0"    />
                    </linearGradient>
                  </defs>
                  <path d={area}   fill="url(#lp-spark-fill)" />
                  <path d={stroke} fill="none" stroke="#C8FF00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx={lastPt.x} cy={lastPt.y} r="3" fill="#C8FF00" />
                  <circle cx={lastPt.x} cy={lastPt.y} r="6" fill="#C8FF00" fillOpacity="0.15" />
                </svg>
              </div>

              {/* Claims list */}
              <div className="px-4 pb-4">
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.12em] font-bold mb-2.5">
                  Reclamos recientes · Revisión prioritaria
                </p>
                <div className="space-y-1.5">
                  {CLAIMS.map((c) => {
                    const r = RISK[c.nivel]
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#161616] border border-[#222] hover:border-[#333] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.dot}`} />
                          <span className="text-[11px] font-mono font-bold text-white">{c.id}</span>
                          <span className="text-[10px] text-zinc-600 truncate hidden sm:block">{c.ramo}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-zinc-500 font-mono tabular-nums">{c.monto}</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${r.bg} ${r.text}`}>
                            {c.score} pts
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#1a1a1a] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {[
                      { dot: 'bg-red-500',    label: 'Alto'  },
                      { dot: 'bg-yellow-500', label: 'Medio' },
                      { dot: 'bg-green-500',  label: 'Bajo'  },
                    ].map(({ dot, label }) => (
                      <div key={label} className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        <span className="text-[10px] text-zinc-600">{label}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-zinc-700 font-mono">score_final 0–100</span>
                </div>
              </div>
            </div>

            {/* Trust signals */}
            <div className="mt-4 flex items-center gap-5 px-1 flex-wrap">
              {[
                { icon: Lock,     text: 'Datos cifrados'   },
                { icon: Database, text: 'AlloyDB + pgvector' },
                { icon: Zap,      text: 'Gemini 2.5 Flash' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3 text-zinc-700" />
                  <span className="text-[10px] text-zinc-600">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ METRICS ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-[#1a1a1a] bg-[#0c0c0c]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#1f1f1f]">
            {METRICS.map((m) => (
              <div key={m.value} className="py-8 px-6 text-center">
                <p className="text-3xl md:text-4xl font-black text-[#C8FF00] tracking-[-0.04em] tabular-nums font-mono mb-1">
                  {m.value}
                </p>
                <p className="text-[11px] font-bold text-white mb-0.5">{m.label}</p>
                <p className="text-[10px] text-zinc-600">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
      <section className="py-20 border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-6">

          <div className="mb-12">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.15em] mb-3">
              Flujo del sistema
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-[-0.03em] uppercase leading-tight">
              Cómo funciona<br />
              <span className="text-[#C8FF00]">FraudIA.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] right-0 h-px bg-gradient-to-r from-[#2a2a2a] to-transparent z-10" />
                )}
                <div className="relative p-6 md:p-8 rounded-2xl bg-[#0f0f0f] border border-[#1f1f1f] md:border-r-0 md:last:border-r md:rounded-none md:first:rounded-l-2xl md:last:rounded-r-2xl h-full">
                  {/* Step number */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 font-black text-xl font-mono"
                    style={{ background: `${step.color}15`, border: `1px solid ${step.color}30`, color: step.color }}
                  >
                    {step.n}
                  </div>
                  <h3 className="text-[15px] font-bold text-white mb-2 leading-snug">{step.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES (páginas reales) ══════════════════════════════════════════ */}
      <section data-tour="landing-features" className="py-20 border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-6">

          <div className="mb-12">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.15em] mb-3">
              8 módulos operativos
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-[-0.03em] uppercase leading-tight">
              Todo lo que necesitas<br />
              <span className="text-[#C8FF00]">en una plataforma.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  className="group rounded-2xl p-5 bg-[#0f0f0f] border border-[#1f1f1f] hover:border-[#C8FF00]/25 transition-all duration-200 relative overflow-hidden flex flex-col cursor-pointer"
                >
                  {/* Glow */}
                  <div
                    className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `${f.accent}18` }}
                  />

                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
                    style={{ background: `${f.accent}15`, border: `1px solid ${f.accent}25` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: f.accent }} />
                  </div>

                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.15em] mb-1">{f.label}</p>
                  <h3 className="text-[13px] font-bold text-white mb-2 leading-snug flex-1">{f.title}</h3>
                  <p className="text-[12px] text-zinc-600 leading-relaxed mb-4">{f.desc}</p>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#1a1a1a]">
                    <span className="text-[9px] font-mono text-zinc-700">{f.tag}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-[#C8FF00] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ FRAUD RULES ═══════════════════════════════════════════════════════ */}
      <section className="py-20 border-b border-[#1a1a1a] bg-[#0c0c0c]">
        <div className="max-w-6xl mx-auto px-6">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.15em] mb-3">
                Motor de scoring
              </p>
              <h2 className="text-3xl md:text-4xl font-black tracking-[-0.03em] uppercase leading-tight">
                7 reglas que detectan<br />
                <span className="text-[#C8FF00]">el fraude antes</span><br />
                del desembolso.
              </h2>
            </div>
            <div className="rounded-2xl bg-[#0f0f0f] border border-[#1f1f1f] px-5 py-4 text-center flex-shrink-0">
              <p className="text-[10px] text-zinc-600 font-mono mb-1">score_final =</p>
              <p className="text-sm font-black text-white font-mono">
                <span className="text-[#C8FF00]">0.6</span> × score_reglas
                <span className="text-zinc-600"> + </span>
                <span className="text-[#C8FF00]">0.4</span> × modelo
              </p>
              <div className="flex gap-2 mt-3 justify-center">
                {[
                  { range: '0–39',   label: 'Verde',    color: '#22c55e' },
                  { range: '40–69',  label: 'Amarillo', color: '#eab308' },
                  { range: '70–100', label: 'Rojo',     color: '#ef4444' },
                ].map(b => (
                  <div key={b.label} className="text-center">
                    <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: b.color }} />
                    <p className="text-[9px] font-mono" style={{ color: b.color }}>{b.range}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {RULES.map((r) => (
              <div
                key={r.code}
                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors group"
              >
                {/* Code */}
                <span
                  className="text-[11px] font-black font-mono px-2 py-0.5 rounded-lg flex-shrink-0 w-14 text-center"
                  style={{ background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}25` }}
                >
                  {r.code}
                </span>

                {/* Label */}
                <span className="text-[13px] text-zinc-300 font-medium flex-1 min-w-0 truncate">
                  {r.label}
                </span>

                {/* Bar */}
                <div className="hidden sm:flex items-center gap-2 w-40 flex-shrink-0">
                  <div className="flex-1 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(r.pts / 35) * 100}%`, background: r.color }}
                    />
                  </div>
                </div>

                {/* Severity */}
                <span className="text-[10px] text-zinc-600 w-14 text-right flex-shrink-0 hidden md:block">{r.sev}</span>

                {/* Points */}
                <span className="text-[12px] font-black font-mono tabular-nums flex-shrink-0 w-12 text-right" style={{ color: r.color }}>
                  +{r.pts} pts
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href="/reglas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2a2a2a] text-zinc-400 hover:text-[#C8FF00] hover:border-[#C8FF00]/30 text-xs font-semibold transition-all duration-200"
            >
              Ver catálogo completo
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ AGENT HIGHLIGHT ═══════════════════════════════════════════════════ */}
      <section className="py-20 border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="rounded-2xl border border-[#C8FF00]/15 bg-[#0f0f0f] overflow-hidden">

            {/* Header */}
            <div className="px-8 py-6 border-b border-[#1f1f1f]" style={{ background: 'linear-gradient(90deg, rgba(200,255,0,0.04) 0%, transparent 60%)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#C8FF00]/10 border border-[#C8FF00]/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#C8FF00]" />
                    </div>
                    <p className="text-[10px] font-black text-[#C8FF00] uppercase tracking-[0.15em]">Agente IA conversacional</p>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-[-0.02em] text-white">
                    Pregúntale al agente.<br />
                    <span className="text-[#C8FF00]">Responde con datos reales.</span>
                  </h2>
                </div>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#C8FF00] hover:bg-[#d4ff33] text-zinc-950 font-black rounded-xl text-sm transition-colors duration-150 cursor-pointer flex-shrink-0"
                >
                  <MessageSquare className="w-4 h-4" />
                  Abrir chat
                </Link>
              </div>
            </div>

            {/* Demo questions */}
            <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { q: '¿Cuáles son los 5 siniestros con mayor riesgo?',                      tool: 'listar_siniestros_mayor_riesgo' },
                { q: '¿Qué proveedores concentran más alertas rojas?',                       tool: 'analizar_proveedores_alertas'  },
                { q: '¿Hay siniestros con narrativas similares que indiquen fraude coordinado?', tool: 'listar_narrativas_similares' },
                { q: '¿Qué documentos faltan en los casos críticos?',                        tool: 'listar_documentos_faltantes'  },
                { q: 'Dame un resumen ejecutivo del portafolio.',                            tool: 'generar_resumen_ejecutivo'     },
                { q: '¿Cuáles son las reglas para clasificar un siniestro como de alto riesgo?', tool: 'buscar_conocimiento_negocio' },
              ].map(({ q, tool }) => (
                <div
                  key={q}
                  className="rounded-xl bg-[#161616] border border-[#222] px-4 py-3 hover:border-[#C8FF00]/20 transition-colors cursor-default"
                >
                  <p className="text-[12px] text-zinc-300 leading-snug mb-2">&quot;{q}&quot;</p>
                  <span className="text-[9px] font-mono text-zinc-700 bg-[#0d0d0d] px-1.5 py-0.5 rounded">
                    → {tool}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CLOSING CTA ═══════════════════════════════════════════════════════ */}
      <section data-tour="landing-cta" className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/[0.06]">
            <CheckCircle className="w-3 h-3 text-[#C8FF00]" />
            <span className="text-[10px] font-black tracking-[0.15em] text-[#C8FF00] uppercase">
              Revisión humana · Siempre
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black tracking-[-0.03em] uppercase leading-[0.95] mb-5">
            El fraude no espera.<br />
            <span className="text-[#C8FF00]">Tampoco FraudIA.</span>
          </h2>

          <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-10 max-w-xl mx-auto">
            FraudIA no acusa ni rechaza automáticamente. Prioriza los casos que necesitan atención y explica exactamente por qué — con evidencia trazable y auditable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#C8FF00] hover:bg-[#d4ff33] text-zinc-950 font-black rounded-xl text-sm transition-colors duration-150 cursor-pointer lime-glow"
            >
              <LayoutDashboard className="w-4 h-4" />
              Ver el Dashboard
            </Link>
            <Link
              href="/siniestros"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-[#2a2a2a] hover:border-[#C8FF00]/30 hover:bg-[#111111] text-zinc-300 font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Explorar siniestros
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 border-t border-[#1a1a1a]">
            {[
              { icon: AlertTriangle, text: 'Sin acusaciones automáticas', color: 'text-orange-500' },
              { icon: CheckCircle,   text: 'Datos 100% sintéticos',       color: 'text-[#C8FF00]'  },
              { icon: Lock,          text: 'Decisiones siempre humanas',  color: 'text-zinc-400'   },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-xs text-zinc-500">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#1a1a1a] py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="FraudIA" width={20} height={20} className="flex-shrink-0 opacity-60" />
            <span className="text-[11px] font-black text-zinc-600 tracking-widest uppercase">
              FraudIA · HackIAthon GCP 2026
            </span>
          </div>
          <div className="flex items-center gap-4">
            {[
              { href: '/reglas',       label: 'Reglas'      },
              { href: '/reportes',     label: 'Reportes'    },
              { href: '/arquitectura', label: 'Arquitectura' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors">
                {label}
              </Link>
            ))}
          </div>
          <p className="text-[11px] text-zinc-700 text-center sm:text-right">
            Aseguradora del Sur — MVP antifraude — Datos sintéticos
          </p>
        </div>
      </footer>

    </div>
  )
}
