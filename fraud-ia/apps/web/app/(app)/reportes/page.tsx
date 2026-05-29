'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  FileBarChart,
  Printer,
  AlertTriangle,
  ShieldCheck,
  Activity,
  CalendarDays,
  TrendingUp,
  DollarSign,
  RefreshCw,
} from 'lucide-react'
import { getResumenEjecutivo, getAlertasAnalytics, getKpis } from '@/lib/api'
import type { ResumenEjecutivo, AlertasAnalytics, KPIs } from '@/lib/types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat('es-EC').format(n)
}

function fmtUSD(n: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(): string {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function pct(part: number, total: number): string {
  if (!total) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

// ─── sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-3 ${
        accent ? 'border-[#C8FF00]/30 bg-[#C8FF00]/5' : 'border-[#2A2A2A] bg-[#141414]'
      }`}
    >
      <div className="flex items-center gap-2 text-[#888]">
        <Icon className={`w-4 h-4 ${accent ? 'text-[#C8FF00]' : ''}`} />
        <span className="text-xs font-medium uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${accent ? 'text-[#C8FF00]' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-[#555]">{sub}</p>}
    </div>
  )
}

function HBar({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const width = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#ccc]">{label}</span>
        <span className="text-[#888] text-xs">
          {fmt(value)} ({pct(value, total)})
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#1E1E1E]">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function AlertaRow({
  codigo,
  descripcion,
  frecuencia,
  maxFrecuencia,
}: {
  codigo: string
  descripcion: string
  frecuencia: number
  maxFrecuencia: number
}) {
  const width = maxFrecuencia ? Math.round((frecuencia / maxFrecuencia) * 100) : 0
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-[#1E1E1E] last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-[#C8FF00] bg-[#C8FF00]/10 px-2 py-0.5 rounded">
            {codigo}
          </span>
          <span className="text-sm text-[#ccc]">{descripcion}</span>
        </div>
        <span className="text-sm font-semibold text-white ml-4 shrink-0">{fmt(frecuencia)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#1E1E1E] mt-1">
        <div
          className="h-1.5 rounded-full bg-[#C8FF00]/60"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const [resumen, setResumen] = useState<ResumenEjecutivo | null>(null)
  const [alertas, setAlertas] = useState<AlertasAnalytics | null>(null)
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setErrors({})

    const results = await Promise.allSettled([
      getResumenEjecutivo(),
      getAlertasAnalytics(),
      getKpis(),
    ])

    const newErrors: Record<string, string> = {}

    if (results[0].status === 'fulfilled') {
      setResumen(results[0].value)
    } else {
      newErrors.resumen = (results[0].reason as Error).message
    }

    if (results[1].status === 'fulfilled') {
      setAlertas(results[1].value)
    } else {
      newErrors.alertas = (results[1].reason as Error).message
    }

    if (results[2].status === 'fulfilled') {
      setKpis(results[2].value)
    } else {
      newErrors.kpis = (results[2].reason as Error).message
    }

    setErrors(newErrors)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Derived values — prefer resumen, fall back to kpis
  const totalSiniestros = resumen?.total_siniestros ?? kpis?.total_siniestros ?? 0
  const casosRojos = resumen?.casos_rojos ?? kpis?.casos_rojos ?? 0
  const casosAmarillos = resumen?.casos_amarillos ?? kpis?.casos_amarillos ?? 0
  const casosVerdes = resumen?.casos_verdes ?? kpis?.casos_verdes ?? 0
  const scorePromedio = resumen?.score_promedio ?? kpis?.score_promedio ?? 0
  const montoTotal = resumen?.monto_total_reclamado ?? kpis?.monto_total_reclamado ?? 0
  const montoRiesgo = resumen?.monto_en_riesgo ?? kpis?.monto_rojo_reclamado ?? 0

  const maxAlertaFrecuencia =
    alertas && alertas.items.length > 0 ? alertas.items[0].frecuencia : 1

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#0F0F0F]/90 backdrop-blur border-b border-[#2A2A2A] px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileBarChart className="w-5 h-5 text-[#C8FF00]" />
            <div>
              <h1 className="text-base font-bold text-white">Reporte Ejecutivo</h1>
              <p className="text-xs text-[#555]">
                Resumen del portafolio de siniestros — Aseguradora del Sur
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#555] border border-[#2A2A2A] rounded-lg px-3 py-1.5 bg-[#141414]">
              Generado: {fmtDate()}
            </span>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-[#888] hover:text-white border border-[#2A2A2A] rounded-lg px-3 py-1.5 bg-[#141414] hover:bg-[#1E1E1E] transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#0F0F0F] bg-[#C8FF00] hover:bg-[#d4ff33] rounded-lg px-4 py-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 space-y-10 max-w-7xl mx-auto">
        {/* ── Loading skeleton ────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-[#555] gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Cargando reporte…</span>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Section 1: KPIs ─────────────────────────────── */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-4">
                Indicadores principales
              </h2>
              {errors.resumen && errors.kpis ? (
                <div className="rounded-xl border border-red-900/40 bg-red-900/10 p-4 text-sm text-red-400">
                  No se pudieron cargar los KPIs: {errors.resumen}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard
                    icon={Activity}
                    label="Total siniestros"
                    value={fmt(totalSiniestros)}
                    sub={`Monto total: ${fmtUSD(montoTotal)}`}
                  />
                  <KpiCard
                    icon={AlertTriangle}
                    label="Casos Rojo Alto"
                    value={fmt(casosRojos)}
                    sub={`En riesgo: ${fmtUSD(montoRiesgo)}`}
                    accent
                  />
                  <KpiCard
                    icon={TrendingUp}
                    label="Score promedio"
                    value={scorePromedio.toFixed(1)}
                    sub="Escala 0–100"
                  />
                  <KpiCard
                    icon={CalendarDays}
                    label="Últimos 30 días"
                    value={fmt(resumen?.siniestros_ultimos_30_dias ?? 0)}
                    sub={`${fmt(resumen?.casos_rojos_ultimos_30_dias ?? 0)} rojos recientes`}
                  />
                </div>
              )}
            </section>

            {/* ── Section 2: Distribución por nivel de riesgo ─── */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-4">
                Distribución por nivel de riesgo
              </h2>
              <div className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-6 space-y-5">
                <HBar
                  label="Verde Bajo"
                  value={casosVerdes}
                  total={totalSiniestros}
                  color="#22c55e"
                />
                <HBar
                  label="Amarillo Medio"
                  value={casosAmarillos}
                  total={totalSiniestros}
                  color="#eab308"
                />
                <HBar
                  label="Rojo Alto"
                  value={casosRojos}
                  total={totalSiniestros}
                  color="#ef4444"
                />
                <div className="pt-2 border-t border-[#2A2A2A] flex items-center gap-6 text-xs text-[#555]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    {pct(casosVerdes, totalSiniestros)} sin alerta
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#eab308]" />
                    {pct(casosAmarillos, totalSiniestros)} revisión supervisora
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                    {pct(casosRojos, totalSiniestros)} escalar a antifraude
                  </span>
                </div>
              </div>
            </section>

            {/* ── Section 3: Top reglas activadas ─────────────── */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-4">
                Reglas de riesgo más activadas
              </h2>
              {errors.alertas ? (
                <div className="rounded-xl border border-yellow-900/40 bg-yellow-900/10 p-4 text-sm text-yellow-400">
                  No se pudieron cargar las alertas: {errors.alertas}
                </div>
              ) : alertas ? (
                <div className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-6">
                  {/* summary row */}
                  <div className="flex items-center gap-6 mb-5 pb-4 border-b border-[#2A2A2A]">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-[#C8FF00]">
                        {fmt(alertas.total_alertas)}
                      </span>
                      <span className="text-xs text-[#555]">alertas totales</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white">
                        {alertas.reglas_activadas}
                      </span>
                      <span className="text-xs text-[#555]">reglas distintas</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white">
                        {fmt(alertas.casos_con_alertas)}
                      </span>
                      <span className="text-xs text-[#555]">casos afectados</span>
                    </div>
                  </div>
                  {/* rule list */}
                  <div>
                    {alertas.items.map((item) => (
                      <AlertaRow
                        key={item.codigo}
                        codigo={item.codigo}
                        descripcion={item.descripcion}
                        frecuencia={item.frecuencia}
                        maxFrecuencia={maxAlertaFrecuencia}
                      />
                    ))}
                    {alertas.items.length === 0 && (
                      <p className="text-sm text-[#555] py-4 text-center">
                        Sin datos de reglas disponibles.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </section>

            {/* ── Section 4: Distribución por ramo ────────────── */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-4">
                Distribución por ramo
              </h2>
              {errors.resumen ? (
                <div className="rounded-xl border border-yellow-900/40 bg-yellow-900/10 p-4 text-sm text-yellow-400">
                  No se pudieron cargar los datos por ramo.
                </div>
              ) : resumen && resumen.top_ramos.length > 0 ? (
                <div className="rounded-2xl border border-[#2A2A2A] bg-[#141414] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2A2A2A]">
                        <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#555]">
                          Ramo
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#555]">
                          Total
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#555]">
                          Rojos
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#555]">
                          Amarillos
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#555]">
                          % Riesgo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumen.top_ramos.map((r, i) => {
                        const riesgoTotal = r.rojos + r.amarillos
                        const pctRiesgo = r.total
                          ? ((riesgoTotal / r.total) * 100).toFixed(1)
                          : '0.0'
                        const isHigh = parseFloat(pctRiesgo) >= 50
                        return (
                          <tr
                            key={r.ramo}
                            className={`border-b border-[#1E1E1E] last:border-0 ${
                              i % 2 === 0 ? 'bg-transparent' : 'bg-[#0F0F0F]/40'
                            }`}
                          >
                            <td className="px-6 py-3.5 font-medium text-white">{r.ramo}</td>
                            <td className="px-6 py-3.5 text-right text-[#aaa]">{fmt(r.total)}</td>
                            <td className="px-6 py-3.5 text-right text-red-400">{fmt(r.rojos)}</td>
                            <td className="px-6 py-3.5 text-right text-yellow-400">
                              {fmt(r.amarillos)}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  isHigh
                                    ? 'bg-red-900/30 text-red-400'
                                    : 'bg-[#1E1E1E] text-[#aaa]'
                                }`}
                              >
                                {pctRiesgo}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                !errors.resumen && (
                  <div className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-8 text-center text-[#555] text-sm">
                    Sin datos de ramos disponibles.
                  </div>
                )
              )}
            </section>

            {/* ── Section 5: Recomendaciones ───────────────────── */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-4">
                Recomendaciones
              </h2>
              <div className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-6 space-y-4">
                {[
                  {
                    id: '01',
                    text: `Priorizar revisión de los ${fmt(casosRojos)} casos en nivel Rojo Alto — concentran el mayor monto en riesgo (${fmtUSD(montoRiesgo)}).`,
                  },
                  {
                    id: '02',
                    text: 'Investigar a los proveedores en lista restrictiva: auditar relaciones contractuales y patrones de facturación inusual.',
                  },
                  {
                    id: '03',
                    text: 'Implementar verificación documental obligatoria en los primeros 90 días de vigencia de póliza para reducir la regla RF-01.',
                  },
                  {
                    id: '04',
                    text: `Revisar los ${fmt(resumen?.casos_rojos_ultimos_30_dias ?? 0)} casos rojos de los últimos 30 días con carácter urgente antes del cierre de período.`,
                  },
                  {
                    id: '05',
                    text: 'Reforzar el proceso de validación de identidad del conductor y propietario del vehículo en siniestros con historial múltiple.',
                  },
                ].map((rec) => (
                  <div key={rec.id} className="flex items-start gap-4">
                    <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-[#C8FF00]/10 border border-[#C8FF00]/30 flex items-center justify-center text-[10px] font-bold text-[#C8FF00]">
                      {rec.id}
                    </span>
                    <p className="text-sm text-[#ccc] leading-relaxed">{rec.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Footer note ─────────────────────────────────── */}
            <div className="flex items-center gap-2 text-xs text-[#444] pb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C8FF00]/40" />
              Este reporte es una herramienta de apoyo a la toma de decisiones. Las alertas de
              riesgo requieren revisión humana antes de cualquier acción sobre el siniestro.
              FraudIA nunca acusa fraude ni rechaza siniestros automáticamente.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
