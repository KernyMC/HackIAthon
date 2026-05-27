'use client'

import { useEffect, useState } from 'react'
import { Building2, AlertTriangle, RefreshCw, MessageSquare, TrendingUp } from 'lucide-react'
import { getProveedoresRiesgo } from '@/lib/api'
import type { Proveedor } from '@/lib/types'
import { formatMoney, formatScore } from '@/lib/utils'

export default function ProveedoresPage() {
  const [items, setItems] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProveedoresRiesgo(30)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const askAI = (q: string) => {
    window.dispatchEvent(new CustomEvent('fraudia:ask', { detail: q }))
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#ef4444'
    if (score >= 40) return '#eab308'
    return '#22c55e'
  }

  const topThree = items.slice(0, 3)
  const maxRojos = items[0]?.casos_rojos ?? 1
  const RANK_COLORS = ['#FF6500', '#ef4444', '#eab308']

  return (
    <div className="p-8 animate-fade-in bg-[#111111] min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Riesgo</p>
          <h1
            className="text-4xl font-bold text-white leading-none"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            PROVEEDORES
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Ranking por concentración de alertas · {items.length} proveedores
          </p>
        </div>
        <button
          onClick={() => askAI('¿Qué proveedores concentran más alertas rojas y qué significa eso para la aseguradora?')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C8FF00] hover:bg-[#d4ff33] text-black font-semibold rounded-xl text-sm transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Analizar con IA
        </button>
      </div>

      {/* Disclaimer */}
      <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-[#FF6500]/5 border border-[#FF6500]/20">
        <AlertTriangle className="w-4 h-4 text-[#FF6500] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-neutral-400 leading-relaxed">
          Alta concentración de alertas rojas es una señal de posible riesgo, no una confirmación de fraude.
          Toda investigación requiere revisión humana especializada.
        </p>
      </div>

      {/* Top 3 cards */}
      {!loading && topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {topThree.map((p, i) => {
            const pctRojo = p.total_siniestros > 0
              ? Math.round((Number(p.casos_rojos) / p.total_siniestros) * 100)
              : 0
            const scoreColor = getScoreColor(Number(p.score_promedio))
            const rankColor = RANK_COLORS[i]
            return (
              <div
                key={p.id_proveedor}
                className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5 relative overflow-hidden cursor-pointer hover:border-[#3A3A3A] transition-colors"
                onClick={() => askAI(`Analiza el proveedor ${p.nombre_proveedor || p.id_proveedor} y sus casos de alto riesgo`)}
              >
                {/* Rank badge */}
                <div
                  className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ backgroundColor: `${rankColor}25`, color: rankColor }}
                >
                  #{i + 1}
                </div>

                <Building2 className="w-4 h-4 mb-3" style={{ color: rankColor }} />

                <p className="font-semibold text-white text-sm leading-tight pr-10 truncate">
                  {p.nombre_proveedor || p.id_proveedor}
                </p>
                <p className="text-[10px] text-neutral-600 mt-0.5 mb-4">
                  {p.tipo || '—'} · {p.ciudad_proveedor || '—'}
                </p>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-red-400 tabular-nums">{p.casos_rojos ?? 0}</p>
                    <p className="text-[9px] text-neutral-700 mt-0.5">Rojos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-yellow-400 tabular-nums">{p.casos_amarillos ?? 0}</p>
                    <p className="text-[9px] text-neutral-700 mt-0.5">Amarillos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold tabular-nums" style={{ color: scoreColor }}>
                      {formatScore(Number(p.score_promedio))}
                    </p>
                    <p className="text-[9px] text-neutral-700 mt-0.5">Score</p>
                  </div>
                </div>

                {/* Risk bar */}
                <div>
                  <div className="flex justify-between text-[9px] text-neutral-600 mb-1">
                    <span>% casos rojos</span>
                    <span className="text-red-400 font-semibold">{pctRojo}%</span>
                  </div>
                  <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${pctRojo}%` }}
                    />
                  </div>
                </div>

                {p.en_lista_restrictiva && (
                  <div className="mt-3 text-[10px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1 text-center">
                    ⚠ Lista restrictiva
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Full ranking table */}
      <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2A2A2A]">
          <TrendingUp className="w-4 h-4 text-[#FF6500]" />
          <h2 className="font-semibold text-white text-sm">Ranking completo</h2>
          <span className="text-xs text-neutral-600">ordenado por alertas rojas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] bg-[#191919]">
                {[
                  '#', 'Proveedor', 'Tipo', 'Ciudad',
                  'Concentración rojos', 'Rojos', 'Amarillos', 'Total',
                  'Score', 'Monto total', 'Lista rest.',
                ].map((label) => (
                  <th
                    key={label}
                    className="text-left py-2.5 px-4 text-[10px] font-semibold text-neutral-600 uppercase tracking-wider whitespace-nowrap"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-neutral-500">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#C8FF00]" />
                      <span className="text-sm">Cargando proveedores...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-red-400 text-sm">{error}</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-neutral-600 text-sm">
                    No hay datos de proveedores
                  </td>
                </tr>
              ) : (
                items.map((p, i) => {
                  const pctRojo = p.total_siniestros > 0
                    ? (Number(p.casos_rojos) / p.total_siniestros) * 100
                    : 0
                  const barWidth = Number(maxRojos) > 0
                    ? (Number(p.casos_rojos) / Number(maxRojos)) * 100
                    : 0
                  return (
                    <tr
                      key={p.id_proveedor}
                      className="border-b border-[#1E1E1E] hover:bg-[#1E1E1E] transition-colors"
                    >
                      <td className="py-3 px-4 text-neutral-600 text-xs font-mono">{i + 1}</td>
                      <td className="py-3 px-4 max-w-[180px]">
                        <div className="font-medium text-white text-xs truncate">
                          {p.nombre_proveedor || p.id_proveedor}
                        </div>
                        <div className="text-neutral-600 text-[10px] font-mono mt-0.5">{p.id_proveedor}</div>
                      </td>
                      <td className="py-3 px-4 text-neutral-500 text-xs">{p.tipo || '—'}</td>
                      <td className="py-3 px-4 text-neutral-500 text-xs">{p.ciudad_proveedor || '—'}</td>
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-red-500/70"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-red-400 font-medium w-8 text-right tabular-nums">
                            {Math.round(pctRojo)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-xs tabular-nums" style={{ color: Number(p.casos_rojos) > 0 ? '#ef4444' : '#555' }}>
                          {p.casos_rojos ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs tabular-nums" style={{ color: Number(p.casos_amarillos) > 0 ? '#eab308' : '#555' }}>
                          {p.casos_amarillos ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400 text-xs tabular-nums">
                        {p.total_siniestros ?? 0}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="font-semibold text-xs tabular-nums"
                          style={{ color: getScoreColor(Number(p.score_promedio)) }}
                        >
                          {p.score_promedio != null ? formatScore(Number(p.score_promedio)) : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400 text-xs tabular-nums">
                        {p.monto_total_reclamado != null ? formatMoney(Number(p.monto_total_reclamado)) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {p.en_lista_restrictiva ? (
                          <span className="text-red-400 font-bold text-[10px] bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                            SÍ
                          </span>
                        ) : (
                          <span className="text-neutral-700 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-neutral-700 text-xs mt-4">
        Señales de posible concentración de riesgo. No implica determinación de fraude.
        Requiere revisión humana especializada.
      </p>
    </div>
  )
}
