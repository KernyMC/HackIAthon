'use client'

import Link from 'next/link'
import Image from 'next/image'
import { TourStartButton } from '@/components/Tour/TourStartButton'
import { useState, useMemo } from 'react'
import {
  ArrowRight,
  Activity,
  GitBranch,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Cpu,
  Database,
  Lock,
  Zap,
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

// ── Mock claims (hero widget) ───────────────────────────────────────────────
const CLAIMS = [
  { id: 'SIN-00847', ramo: 'Automóvil', score: 94, nivel: 'Alto',  monto: '$12,400' },
  { id: 'SIN-00523', ramo: 'Hogar',     score: 72, nivel: 'Alto',  monto: '$8,200'  },
  { id: 'SIN-00981', ramo: 'Salud',     score: 55, nivel: 'Medio', monto: '$3,100'  },
  { id: 'SIN-00312', ramo: 'Vida',      score: 28, nivel: 'Bajo',  monto: '$1,900'  },
]

const RISK: Record<string, { bg: string; text: string; dot: string }> = {
  Alto:  { bg: 'bg-red-500/10',    text: 'text-red-400',    dot: 'bg-red-500'    },
  Medio: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  Bajo:  { bg: 'bg-green-500/10',  text: 'text-green-400',  dot: 'bg-green-500'  },
}

// ── Features ────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Cpu,
    label: 'Inteligencia Artificial',
    title: 'Agente IA con Gemini 2.5 Flash',
    desc: 'El agente ADK analiza narrativas, documentos y patrones de comportamiento para generar alertas explicables, priorizando casos que requieren revisión humana.',
    tag: 'Google ADK + Gemini 2.5',
  },
  {
    icon: TrendingUp,
    label: 'Dashboard de Indicadores',
    title: 'Análisis de KPIs en Tiempo Real',
    desc: 'Monitorea el loss ratio, score promedio de riesgo, distribución de alertas y tendencias de fraude con métricas actualizadas para decisiones estratégicas.',
    tag: 'Recharts + AlloyDB',
  },
  {
    icon: AlertTriangle,
    label: 'Score de Riesgo',
    title: 'Evaluación Automática al Ingreso',
    desc: 'Cada siniestro recibe un score_final al ingresar al sistema, combinando reglas de negocio y modelo simulado para clasificarlo en riesgo Bajo, Medio o Alto.',
    tag: 'Score = 0.6×Reglas + 0.4×Modelo',
  },
]

// ── Metrics ─────────────────────────────────────────────────────────────────
const METRICS = [
  { value: '$80B+', label: 'Protegidos anualmente'   },
  { value: '-12%',  label: 'Loss Ratio proyectado'   },
  { value: '<1s',   label: 'Tiempo de respuesta'     },
]

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [email, setEmail] = useState('')

  const W = 240, H = 64
  const coords  = useMemo(() => buildSparkCoords(SPARK_RAW, W, H), [])
  const stroke  = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area    = `${stroke} L ${coords[coords.length - 1].x} ${H} L 0 ${H} Z`
  const lastPt  = coords[coords.length - 1]

  return (
    <div className="bg-[#09090b] min-h-screen text-white overflow-x-hidden">

      {/* ══ NAVBAR ════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-[#1f1f1f] bg-[#09090b]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FraudSweep logo" width={28} height={28} className="flex-shrink-0" />
            <span className="text-sm font-black tracking-widest text-white uppercase">
              Fraud<span className="text-[#C8FF00]">Sweep</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider border border-[#2a2a2a] text-zinc-600 uppercase">
              Claims Assistant
            </span>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-xs font-semibold hover:border-[#C8FF00]/40 hover:text-white transition-all duration-200 cursor-pointer"
          >
            <span>Ver más</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section data-tour="landing-hero" className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">

        {/* Ambient grid overlay */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(#C8FF00 1px, transparent 1px), linear-gradient(90deg, #C8FF00 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-[#C8FF00]/[0.035] blur-[130px] rounded-full" />
        </div>

        <div className="relative flex flex-col lg:flex-row gap-12 lg:gap-14 items-start lg:items-center">

          {/* ── Left: Copy ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/[0.06]">
              <Cpu className="w-3 h-3 text-[#C8FF00]" />
              <span className="text-[10px] font-black tracking-[0.15em] text-[#C8FF00] uppercase">
                Motor Antifraude IA
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-[-0.03em] leading-[0.92] text-white mb-5 uppercase">
              INTEGRIDAD<br />
              DE RECLAMOS<br />
              <span className="text-[#C8FF00]">A VELOCIDAD</span><br />
              DE CÓMPUTO.
            </h1>

            {/* Subtitle */}
            <p className="text-zinc-400 text-sm md:text-[15px] leading-relaxed mb-8 max-w-[420px]">
              FraudSweep analiza datos multimodales de seguros — narrativas, geografía y redes — para frenar el fraude antes del desembolso. Cada alerta es explicable y auditada por humanos.
            </p>

            {/* Benefits */}
            <ul className="space-y-3 mb-10">
              {[
                { icon: TrendingUp, text: 'Reducción del 75% en falsos positivos con scoring explicable' },
                { icon: Activity,   text: 'Monitoreo predictivo en tiempo real con Gemini 2.5 Flash'    },
                { icon: GitBranch,  text: 'Análisis de redes y detección de fraude organizado'           },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#C8FF00]/10 border border-[#C8FF00]/10">
                    <Icon className="w-2.5 h-2.5 text-[#C8FF00]" />
                  </div>
                  <span className="text-sm text-zinc-300 leading-snug">{text}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8FF00] hover:bg-[#d4ff33] text-zinc-950 font-black rounded-xl text-sm transition-colors duration-150 cursor-pointer lime-glow"
              >
                Proteger Operaciones
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-[#2a2a2a] hover:border-[#C8FF00]/30 hover:bg-[#111111] text-zinc-300 font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer"
              >
                Chat con el Agente
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
                  <span className="text-[10px] font-black text-[#C8FF00] font-mono">+34% YoY detectado</span>
                </div>
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="w-full"
                  preserveAspectRatio="none"
                  aria-hidden
                >
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

              {/* Claims mini-table */}
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

                {/* Legend */}
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
                { icon: Lock,     text: 'Datos cifrados'        },
                { icon: Database, text: 'AlloyDB + Vector'      },
                { icon: Zap,      text: 'Gemini 2.5 Flash'      },
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

      {/* ══ FEATURES ══════════════════════════════════════════════════════════ */}
      <section data-tour="landing-features" className="border-t border-[#1a1a1a] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.15em] mb-3">
              Capacidades técnicas
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-[-0.03em] uppercase leading-tight">
              El motor de detección<br />
              <span className="text-[#C8FF00]">en 3 pilares.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl p-6 bg-[#0f0f0f] border border-[#1f1f1f] hover:border-[#C8FF00]/20 transition-all duration-250 relative overflow-hidden cursor-default"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#C8FF00]/[0.025] blur-3xl rounded-full pointer-events-none group-hover:bg-[#C8FF00]/[0.055] transition-all duration-500" />
                  <div className="w-10 h-10 rounded-xl bg-[#C8FF00]/10 border border-[#C8FF00]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#C8FF00]" />
                  </div>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.15em] mb-1.5">{f.label}</p>
                  <h3 className="text-[15px] font-bold text-white mb-2.5 leading-snug">{f.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed mb-5">{f.desc}</p>
                  <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#161616] border border-[#252525]">
                    <span className="text-[10px] font-mono text-zinc-600">{f.tag}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ METRICS ═══════════════════════════════════════════════════════════ */}
      <section data-tour="landing-metrics" className="border-t border-b border-[#1a1a1a] py-16 bg-[#0c0c0c]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#1f1f1f]">
            {METRICS.map((m) => (
              <div key={m.value} className="py-10 md:py-6 px-8 text-center">
                <p className="text-5xl md:text-6xl font-black text-[#C8FF00] tracking-[-0.04em] tabular-nums font-mono mb-2">
                  {m.value}
                </p>
                <p className="text-xs text-zinc-600 uppercase tracking-widest">{m.label}</p>
              </div>
            ))}
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
            Valide la honestidad<br />
            <span className="text-[#C8FF00]">de sus clientes</span><br />
            en tiempo real.
          </h2>

          <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-10 max-w-xl mx-auto">
            FraudSweep no acusa ni rechaza automáticamente. Es el asistente que prioriza los casos que necesitan su atención y explica exactamente por qué — con evidencia trazable.
          </p>

          {/* Email + CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mb-12">
            <label htmlFor="lp-email" className="sr-only">Correo electrónico</label>
            <input
              id="lp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@aseguradora.com"
              className="w-full sm:flex-1 px-4 py-3 rounded-xl bg-[#111111] border border-[#2a2a2a] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#C8FF00]/50 transition-colors"
              autoComplete="email"
            />
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C8FF00] hover:bg-[#d4ff33] text-zinc-950 font-black rounded-xl text-sm transition-colors duration-150 whitespace-nowrap cursor-pointer lime-glow"
            >
              Ver más
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 border-t border-[#1a1a1a]">
            {[
              { icon: AlertTriangle, text: 'Sin acusaciones automáticas', color: 'text-orange-500' },
              { icon: CheckCircle,   text: 'Datos sintéticos / privados', color: 'text-[#C8FF00]'  },
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
            <Image src="/logo.png" alt="FraudSweep logo" width={20} height={20} className="flex-shrink-0 opacity-60" />
            <span className="text-[11px] font-black text-zinc-600 tracking-widest uppercase">
              FraudSweep · HackIAthon 2025
            </span>
          </div>
          <p className="text-[11px] text-zinc-700 text-center sm:text-right">
            Aseguradora del Sur — MVP de Detección de Fraude — Todos los datos son 100% sintéticos
          </p>
        </div>
      </footer>

    </div>
  )
}
