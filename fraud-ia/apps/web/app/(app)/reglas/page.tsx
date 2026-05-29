import { cn } from '@/lib/utils'
import { ShieldAlert, AlertTriangle, TrendingUp, Info, Scale } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type Severidad = 'critico' | 'alto' | 'medio' | 'bajo'

interface Regla {
  codigo: string
  titulo: string
  descripcion: string
  puntos: number
  severidad: Severidad
}

// ── Data ─────────────────────────────────────────────────────────────────────

const REGLAS: Regla[] = [
  {
    codigo: 'RF-01',
    titulo: 'Inicio temprano de póliza',
    descripcion:
      'Siniestro ocurrido en los primeros 90 días de vigencia de la póliza. Patrón común en fraude por riesgo moral.',
    puntos: 30,
    severidad: 'critico',
  },
  {
    codigo: 'RF-02',
    titulo: 'Proveedor en lista restrictiva',
    descripcion:
      'El proveedor (taller, clínica, etc.) está marcado en la lista de proveedores con historial de irregularidades.',
    puntos: 35,
    severidad: 'critico',
  },
  {
    codigo: 'RF-03',
    titulo: 'Monto atípico por ramo',
    descripcion:
      'El monto reclamado supera 1.5 veces el umbral promedio para el ramo del siniestro.',
    puntos: 20,
    severidad: 'alto',
  },
  {
    codigo: 'RF-04',
    titulo: 'Documentos incompletos',
    descripcion:
      'El expediente no cuenta con todos los documentos requeridos para el tipo de siniestro.',
    puntos: 10,
    severidad: 'medio',
  },
  {
    codigo: 'RF-05',
    titulo: 'Reporte tardío',
    descripcion:
      'Más de 15 días entre la fecha de ocurrencia y la fecha de reporte del siniestro.',
    puntos: 5,
    severidad: 'bajo',
  },
  {
    codigo: 'RF-06',
    titulo: 'Historial de siniestros elevado',
    descripcion:
      'El asegurado o conductor registra 3 o más siniestros previos. Frecuencia inusual que amerita revisión.',
    puntos: 20,
    severidad: 'alto',
  },
  {
    codigo: 'RF-07',
    titulo: 'Narrativa similar a otros casos',
    descripcion:
      'La descripción del siniestro presenta alta similitud textual (coseno TF-IDF) con otros casos del mismo cluster, posible fraude coordinado.',
    puntos: 25,
    severidad: 'critico',
  },
]

// ── Severity config ───────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  Severidad,
  { label: string; badgeBg: string; badgeText: string; borderAccent: string; dot: string; icon: typeof AlertTriangle }
> = {
  critico: {
    label: 'Crítico',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-400',
    borderAccent: 'hover:border-red-500/40',
    dot: 'bg-red-500',
    icon: AlertTriangle,
  },
  alto: {
    label: 'Alto',
    badgeBg: 'bg-orange-500/15',
    badgeText: 'text-orange-400',
    borderAccent: 'hover:border-orange-500/40',
    dot: 'bg-orange-500',
    icon: TrendingUp,
  },
  medio: {
    label: 'Medio',
    badgeBg: 'bg-yellow-500/15',
    badgeText: 'text-yellow-400',
    borderAccent: 'hover:border-yellow-500/40',
    dot: 'bg-yellow-500',
    icon: Info,
  },
  bajo: {
    label: 'Bajo',
    badgeBg: 'bg-green-500/15',
    badgeText: 'text-green-400',
    borderAccent: 'hover:border-green-500/40',
    dot: 'bg-green-500',
    icon: Info,
  },
}

// ── Severity summary counts ──────────────────────────────────────────────────

const SEVERITY_COUNTS = Object.entries(
  REGLAS.reduce<Record<Severidad, number>>(
    (acc, r) => {
      acc[r.severidad] = (acc[r.severidad] ?? 0) + 1
      return acc
    },
    { critico: 0, alto: 0, medio: 0, bajo: 0 }
  )
) as [Severidad, number][]

// ── Score bands ───────────────────────────────────────────────────────────────

const SCORE_BANDS = [
  {
    range: '0 – 39',
    nivel: 'Verde Bajo',
    accion: 'Flujo normal de pago',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
    dot: 'bg-green-500',
  },
  {
    range: '40 – 69',
    nivel: 'Amarillo Medio',
    accion: 'Revisión supervisora',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    text: 'text-yellow-400',
    dot: 'bg-yellow-500',
  },
  {
    range: '70 – 100',
    nivel: 'Rojo Alto',
    accion: 'Escalar a antifraude',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    dot: 'bg-red-500',
  },
]

// ── Rule Card ────────────────────────────────────────────────────────────────

function ReglaCard({ regla }: { regla: Regla }) {
  const sev = SEVERITY_CONFIG[regla.severidad]
  const SevIcon = sev.icon

  return (
    <div
      className={cn(
        'group relative rounded-2xl p-5 bg-[#0F0F0F] border border-[#2A2A2A] transition-all duration-200 overflow-hidden',
        sev.borderAccent
      )}
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 blur-3xl rounded-full pointer-events-none transition-opacity duration-500 bg-white/[0.02]" />

      {/* Top row: code badge + severity badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        {/* Code badge */}
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] text-xs font-black tracking-widest font-mono">
          {regla.codigo}
        </span>

        {/* Severity badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold',
            sev.badgeBg,
            sev.badgeText
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', sev.dot)} />
          {sev.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-bold text-white leading-snug mb-2">
        {regla.titulo}
      </h3>

      {/* Description */}
      <p className="text-[13px] text-zinc-500 leading-relaxed mb-5">
        {regla.descripcion}
      </p>

      {/* Footer: points + icon */}
      <div className="flex items-center justify-between pt-3 border-t border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
            <SevIcon className={cn('w-3.5 h-3.5', sev.badgeText)} />
          </div>
          <span className="text-[11px] text-zinc-600 uppercase tracking-wider font-semibold">
            Severidad {sev.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-600 font-medium">Score</span>
          <span className="text-sm font-black text-[#C8FF00] font-mono tabular-nums">
            +{regla.puntos} pts
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReglasPage() {
  const totalMaxPoints = REGLAS.reduce((sum, r) => sum + r.puntos, 0)

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="mb-10">
          {/* Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/[0.06]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#C8FF00]" />
            <span className="text-[10px] font-black tracking-[0.15em] text-[#C8FF00] uppercase">
              Motor de Scoring · {REGLAS.length} reglas activas
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-[-0.03em] uppercase leading-tight mb-3">
            Catálogo de Reglas<br />
            <span className="text-[#C8FF00]">Antifraude</span>
          </h1>

          <p className="text-zinc-400 text-sm md:text-[15px] leading-relaxed max-w-2xl">
            El motor de scoring aplica estas reglas para calcular el{' '}
            <code className="text-[#C8FF00] bg-[#C8FF00]/10 px-1.5 py-0.5 rounded text-[12px] font-mono">
              score_reglas
            </code>{' '}
            (0–100). El score final combina reglas y modelo simulado:{' '}
            <code className="text-zinc-300 bg-[#1A1A1A] px-1.5 py-0.5 rounded text-[12px] font-mono">
              score_final = 60% reglas + 40% modelo
            </code>
            .
          </p>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {SEVERITY_COUNTS.map(([sev, count]) => {
            const cfg = SEVERITY_CONFIG[sev]
            return (
              <div
                key={sev}
                className={cn(
                  'rounded-xl px-4 py-3 border',
                  cfg.badgeBg,
                  'border-transparent'
                )}
              >
                <p className={cn('text-2xl font-black font-mono tabular-nums', cfg.badgeText)}>
                  {count}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-semibold uppercase tracking-wider">
                  {cfg.label}
                </p>
              </div>
            )
          })}
        </div>

        {/* ── Rules grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-12">
          {REGLAS.map((regla) => (
            <ReglaCard key={regla.codigo} regla={regla} />
          ))}
        </div>

        {/* ── Scoring summary section ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#2A2A2A] bg-[#0A0A0A] overflow-hidden">

          {/* Section header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[#2A2A2A] bg-[#0D0D0D]">
            <div className="w-8 h-8 rounded-xl bg-[#C8FF00]/10 border border-[#C8FF00]/15 flex items-center justify-center">
              <Scale className="w-4 h-4 text-[#C8FF00]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Resumen del Scoring</h2>
              <p className="text-[11px] text-zinc-600">Fórmula de cálculo y umbrales de clasificación</p>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Formula */}
            <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.15em] mb-3">
                Fórmula
              </p>
              <div className="rounded-xl bg-[#111111] border border-[#2A2A2A] px-5 py-4 font-mono">
                <p className="text-base md:text-lg font-black text-white tracking-tight">
                  score_final ={' '}
                  <span className="text-[#C8FF00]">0.6</span>
                  <span className="text-zinc-500"> × </span>
                  <span className="text-zinc-300">score_reglas</span>
                  <span className="text-zinc-500"> + </span>
                  <span className="text-[#C8FF00]">0.4</span>
                  <span className="text-zinc-500"> × </span>
                  <span className="text-zinc-300">score_modelo_simulado</span>
                </p>
                <p className="text-[11px] text-zinc-600 mt-2">
                  Suma máxima de reglas: {totalMaxPoints} pts · Escala normalizada 0–100
                </p>
              </div>
            </div>

            {/* Score bands */}
            <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.15em] mb-3">
                Umbrales de clasificación
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SCORE_BANDS.map((band) => (
                  <div
                    key={band.nivel}
                    className={cn(
                      'rounded-xl px-4 py-4 border',
                      band.bg,
                      band.border
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', band.dot)} />
                      <span className={cn('text-xs font-black', band.text)}>
                        {band.nivel}
                      </span>
                    </div>
                    <p className="text-2xl font-black font-mono tabular-nums text-white mb-1">
                      {band.range}
                    </p>
                    <p className="text-[11px] text-zinc-500">{band.accion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 rounded-xl bg-[#111111] border border-[#2A2A2A] px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                El sistema{' '}
                <strong className="text-zinc-300 font-semibold">nunca acusa fraude</strong>{' '}
                ni rechaza siniestros automáticamente. Todas las alertas requieren revisión
                humana supervisora antes de cualquier acción.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
