'use client'

import { useEffect, useState } from 'react'
import { Building2, AlertTriangle, RefreshCw } from 'lucide-react'
import { getProveedoresRiesgo } from '@/lib/api'
import type { Proveedor } from '@/lib/types'
import { formatMoney, formatScore, getScoreColor } from '@/lib/utils'

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

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Proveedores</h1>
        <p className="text-gray-400 text-sm mt-1">
          Ranking por concentración de alertas — {items.length} proveedores cargados
        </p>
      </div>

      <div className="mb-5 p-4 rounded-xl bg-yellow-900/10 border border-yellow-800/40 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-200/70">
          Alta concentración de alertas rojas en un proveedor es una señal de posible riesgo,
          no una confirmación de fraude. Toda investigación requiere revisión humana especializada.
        </p>
      </div>

      <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[hsl(217,33%,20%)]">
          <Building2 className="w-4 h-4 text-orange-400" />
          <h2 className="font-semibold text-white text-sm">
            Proveedores ordenados por casos rojos
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(217,33%,20%)] bg-[hsl(222,47%,12%)]">
                {[
                  { label: '#', align: 'left' },
                  { label: 'Proveedor', align: 'left' },
                  { label: 'Tipo', align: 'left' },
                  { label: 'Ciudad', align: 'left' },
                  { label: 'Total', align: 'right' },
                  { label: 'Rojos', align: 'right' },
                  { label: 'Amarillos', align: 'right' },
                  { label: 'Score prom.', align: 'right' },
                  { label: 'Monto total', align: 'right' },
                  { label: 'Lista rest.', align: 'center' },
                ].map(({ label, align }) => (
                  <th
                    key={label}
                    className={`py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-${align}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Cargando proveedores...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-red-400">{error}</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500">
                    No hay datos de proveedores
                  </td>
                </tr>
              ) : (
                items.map((p, i) => (
                  <tr
                    key={p.id_proveedor}
                    className="border-b border-[hsl(217,33%,17%)] hover:bg-[hsl(217,33%,17%)] transition-colors"
                  >
                    <td className="py-3 px-3 text-gray-600 text-xs">{i + 1}</td>
                    <td className="py-3 px-3 max-w-[180px]">
                      <div className="font-medium text-white truncate">
                        {p.nombre_proveedor || p.id_proveedor}
                      </div>
                      <div className="text-gray-600 text-xs font-mono">{p.id_proveedor}</div>
                    </td>
                    <td className="py-3 px-3 text-gray-400 text-xs">{p.tipo || '—'}</td>
                    <td className="py-3 px-3 text-gray-400 text-xs">{p.ciudad || '—'}</td>
                    <td className="py-3 px-3 text-right text-gray-300">{p.total_siniestros ?? 0}</td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-bold text-sm ${
                          Number(p.casos_rojos) > 0 ? 'text-red-400' : 'text-gray-600'
                        }`}
                      >
                        {p.casos_rojos ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={Number(p.casos_amarillos) > 0 ? 'text-yellow-400' : 'text-gray-600'}
                      >
                        {p.casos_amarillos ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-semibold ${getScoreColor(Number(p.score_promedio))}`}>
                        {p.score_promedio != null ? formatScore(Number(p.score_promedio)) : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-300 text-xs">
                      {p.monto_total_reclamado != null
                        ? formatMoney(Number(p.monto_total_reclamado))
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.en_lista_restrictiva ? (
                        <span className="text-red-400 font-bold text-xs bg-red-900/30 px-2 py-1 rounded border border-red-800/50">
                          SÍ
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-gray-600 text-xs mt-4">
        Los datos muestran señales de posible concentración de riesgo. No implican determinación de
        fraude. Toda investigación requiere revisión humana especializada.
      </p>
    </div>
  )
}
