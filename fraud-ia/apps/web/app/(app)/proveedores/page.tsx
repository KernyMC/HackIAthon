'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  Building2, AlertTriangle, RefreshCw, TrendingUp,
  ShieldAlert, Shield, MapPin,
} from 'lucide-react'
import { getProveedoresRiesgo } from '@/lib/api'
import type { Proveedor } from '@/lib/types'
import { formatMoney, formatScore } from '@/lib/utils'

// Score → color using orange as the primary "attention" color, red only for extreme
const scoreColor = (s: number) =>
  s >= 75 ? '#ef4444' : s >= 55 ? '#FF6500' : s >= 40 ? '#eab308' : '#22c55e'

// Concentration % → color (orange scale, never raw red for bars)
const concColor = (pct: number) =>
  pct >= 70 ? '#ef4444' : pct >= 40 ? '#FF6500' : pct >= 20 ? '#eab308' : '#22c55e'

// Rank accent colors — neon + orange palette, no red for rank
const RANK = [
  { accent: '#C8FF00', label: '1°' },
  { accent: '#FF6500', label: '2°' },
  { accent: '#eab308', label: '3°' },
]

export default function ProveedoresPage() {
  const [items, setItems]   = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    getProveedoresRiesgo(30)
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const askAI = (q: string) =>
    window.dispatchEvent(new CustomEvent('fraudia:ask', { detail: q }))

  const topThree  = items.slice(0, 3)
  const maxRojos  = Math.max(items[0]?.casos_rojos ?? 1, 1)

  return (
    <div className="p-8 animate-fade-in bg-[#111111] min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-1">Riesgo</p>
          <h1 className="text-4xl font-bold text-white leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
            PROVEEDORES
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Ranking por concentración de alertas · {items.length} proveedores
          </p>
        </div>
        <button
          onClick={() => askAI('¿Qué proveedores concentran más alertas y qué significa eso para la aseguradora?')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C8FF00] hover:bg-[#d4ff33] text-black font-bold rounded-xl text-sm transition-colors cursor-pointer"
        >
          <Image src="/logo.png" alt="FraudSweep" width={18} height={18} style={{ filter: 'brightness(0)' }} />
          Analizar con IA
        </button>
      </div>

      {/* ── Disclaimer — muted, informational ─────────────────────────────── */}
      <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
        <Shield className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-neutral-500 leading-relaxed">
          Alta concentración de alertas es una señal de posible riesgo, no una confirmación de fraude.
          Toda investigación requiere revisión humana especializada.
        </p>
      </div>

      {/* ── Top 3 cards ────────────────────────────────────────────────────── */}
      {!loading && topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {topThree.map((p, i) => {
            const total    = p.total_siniestros || 1
            const rojos    = Number(p.casos_rojos)    || 0
            const amarillos= Number(p.casos_amarillos) || 0
            const verdes   = Math.max(0, total - rojos - amarillos)
            const pctRojo  = Math.round((rojos / total) * 100)
            const pctAm    = Math.round((amarillos / total) * 100)
            const pctVerde = Math.round((verdes / total) * 100)
            const sc       = Number(p.score_promedio) || 0
            const rank     = RANK[i]

            return (
              <div
                key={p.id_proveedor}
                className="rounded-2xl bg-[#161616] border border-[#242424] overflow-hidden hover:border-[#333] transition-all duration-200 cursor-pointer group"
                style={{ borderLeft: `3px solid ${rank.accent}` }}
                onClick={() => askAI(`Analiza el proveedor ${p.nombre_proveedor || p.id_proveedor} y sus casos de alto riesgo`)}
              >
                <div className="p-5">
                  {/* Rank + name */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-white text-sm leading-tight truncate group-hover:text-neutral-100 transition-colors">
                        {p.nombre_proveedor || p.id_proveedor}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                        <p className="text-[11px] text-neutral-600 truncate">{p.tipo || '—'}</p>
                        {p.ciudad_proveedor && (
                          <>
                            <span className="text-neutral-700">·</span>
                            <MapPin className="w-3 h-3 text-neutral-700 flex-shrink-0" />
                            <p className="text-[11px] text-neutral-600 truncate">{p.ciudad_proveedor}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                      style={{ background: `${rank.accent}18`, color: rank.accent }}
                    >
                      {rank.label}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-[#1e1e1e] rounded-xl p-2.5 text-center">
                      <p className="text-lg font-black tabular-nums" style={{ color: rojos > 0 ? '#FF6500' : '#555' }}>
                        {rojos}
                      </p>
                      <p className="text-[9px] text-neutral-600 uppercase tracking-wider mt-0.5">Alertas</p>
                    </div>
                    <div className="bg-[#1e1e1e] rounded-xl p-2.5 text-center">
                      <p className="text-lg font-black tabular-nums text-neutral-300">{amarillos}</p>
                      <p className="text-[9px] text-neutral-600 uppercase tracking-wider mt-0.5">Revisión</p>
                    </div>
                    <div className="bg-[#1e1e1e] rounded-xl p-2.5 text-center">
                      <p className="text-lg font-black tabular-nums" style={{ color: scoreColor(sc) }}>
                        {formatScore(sc)}
                      </p>
                      <p className="text-[9px] text-neutral-600 uppercase tracking-wider mt-0.5">Score</p>
                    </div>
                  </div>

                  {/* Segmented bar: rojos | amarillos | verdes */}
                  <div>
                    <div className="flex justify-between text-[9px] text-neutral-600 mb-1.5">
                      <span>Distribución de casos</span>
                      <span style={{ color: concColor(pctRojo) }} className="font-bold">{pctRojo}% críticos</span>
                    </div>
                    <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden flex gap-px">
                      {pctRojo > 0 && (
                        <div className="h-full rounded-l-full" style={{ width: `${pctRojo}%`, background: '#FF6500' }} />
                      )}
                      {pctAm > 0 && (
                        <div className="h-full" style={{ width: `${pctAm}%`, background: '#eab308' }} />
                      )}
                      {pctVerde > 0 && (
                        <div className="h-full rounded-r-full" style={{ width: `${pctVerde}%`, background: '#22c55e40' }} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista restrictiva — bottom stripe, only when true */}
                {p.en_lista_restrictiva && (
                  <div className="flex items-center gap-2 px-5 py-2 bg-red-500/8 border-t border-red-500/15">
                    <ShieldAlert className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">En lista restrictiva</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Full ranking table ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#161616] border border-[#242424] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#222]">
          <TrendingUp className="w-4 h-4 text-[#C8FF00]" />
          <h2 className="font-semibold text-white text-sm">Ranking completo</h2>
          <span className="text-xs text-neutral-600">ordenado por alertas críticas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f1f] bg-[#111111]">
                {['#', 'Proveedor', 'Tipo', 'Ciudad', 'Distribución', 'Críticos', 'Revisión', 'Total', 'Score', 'Monto total', ''].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] font-bold text-neutral-600 uppercase tracking-wider whitespace-nowrap">
                    {h}
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
                  <td colSpan={11} className="py-12 text-center text-neutral-500 text-sm">{error}</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-neutral-600 text-sm">
                    No hay datos de proveedores
                  </td>
                </tr>
              ) : (
                items.map((p, i) => {
                  const total     = p.total_siniestros || 1
                  const rojos     = Number(p.casos_rojos)     || 0
                  const amarillos = Number(p.casos_amarillos) || 0
                  const verdes    = Math.max(0, total - rojos - amarillos)
                  const pctRojo   = Math.round((rojos / total) * 100)
                  const pctAm     = Math.round((amarillos / total) * 100)
                  const pctVerde  = Math.round((verdes / total) * 100)
                  const barRojos  = Math.round((rojos / maxRojos) * 100)
                  const sc        = Number(p.score_promedio) || 0
                  const isTop3    = i < 3

                  return (
                    <tr
                      key={p.id_proveedor}
                      className="border-b border-[#1a1a1a] hover:bg-[#1c1c1c] transition-colors duration-100"
                    >
                      {/* Rank */}
                      <td className="py-3 px-4">
                        <span className={`text-xs font-mono tabular-nums ${isTop3 ? 'text-white font-bold' : 'text-neutral-600'}`}>
                          {i + 1}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-semibold text-white text-sm truncate">
                          {p.nombre_proveedor || p.id_proveedor}
                        </div>
                        <div className="text-neutral-600 text-[10px] font-mono mt-0.5 truncate">{p.id_proveedor}</div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-4 text-neutral-500 text-xs whitespace-nowrap">{p.tipo || '—'}</td>

                      {/* Ciudad */}
                      <td className="py-3 px-4 text-neutral-500 text-xs whitespace-nowrap">{p.ciudad_proveedor || '—'}</td>

                      {/* Segmented bar */}
                      <td className="py-3 px-4 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#252525] rounded-full overflow-hidden flex gap-px">
                            {pctRojo > 0 && (
                              <div className="h-full" style={{ width: `${pctRojo}%`, background: `${concColor(pctRojo)}` }} />
                            )}
                            {pctAm > 0 && (
                              <div className="h-full" style={{ width: `${pctAm}%`, background: '#eab30870' }} />
                            )}
                            {pctVerde > 0 && (
                              <div className="h-full rounded-r-full" style={{ width: `${pctVerde}%`, background: '#22c55e30' }} />
                            )}
                          </div>
                          <span
                            className="text-[10px] font-bold tabular-nums w-9 text-right"
                            style={{ color: concColor(pctRojo) }}
                          >
                            {pctRojo}%
                          </span>
                        </div>
                      </td>

                      {/* Críticos (was Rojos) */}
                      <td className="py-3 px-4">
                        <span
                          className="font-bold text-sm tabular-nums"
                          style={{ color: rojos > 5 ? '#FF6500' : rojos > 0 ? '#eab308' : '#444' }}
                        >
                          {rojos}
                        </span>
                      </td>

                      {/* Revisión (was Amarillos) */}
                      <td className="py-3 px-4">
                        <span className="text-sm tabular-nums text-neutral-500">{amarillos}</span>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-neutral-400 text-sm tabular-nums">{total}</td>

                      {/* Score */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-sm tabular-nums" style={{ color: scoreColor(sc) }}>
                          {sc > 0 ? formatScore(sc) : '—'}
                        </span>
                      </td>

                      {/* Monto */}
                      <td className="py-3 px-4 text-neutral-400 text-sm tabular-nums whitespace-nowrap">
                        {p.monto_total_reclamado != null ? formatMoney(Number(p.monto_total_reclamado)) : '—'}
                      </td>

                      {/* Lista restrictiva — icon only, no big badge */}
                      <td className="py-3 px-4">
                        {p.en_lista_restrictiva ? (
                          <div className="flex items-center gap-1.5" title="En lista restrictiva">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                            <span className="text-[10px] text-red-400 font-semibold">Restringido</span>
                          </div>
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

      {/* Legend */}
      <div className="mt-4 flex items-center gap-5 flex-wrap">
        {[
          { color: '#FF6500', label: 'Concentración crítica ≥40%' },
          { color: '#eab308', label: 'Requiere seguimiento' },
          { color: '#22c55e', label: 'Riesgo bajo' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="text-[11px] text-neutral-600">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <AlertTriangle className="w-3 h-3 text-neutral-700" />
          <span className="text-[11px] text-neutral-700">
            Señales de revisión · no implica fraude confirmado
          </span>
        </div>
      </div>

    </div>
  )
}
