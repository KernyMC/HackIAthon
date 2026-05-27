'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  Search, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle,
  Filter, MessageSquare,
} from 'lucide-react'
import { getSiniestros } from '@/lib/api'
import type { Siniestro, SiniestrosParams } from '@/lib/types'
import { formatMoney, formatScore, truncate } from '@/lib/utils'
import { RiskBadge } from '@/components/ui/risk-badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE = 20

const columns: ColumnDef<Siniestro>[] = [
  {
    accessorKey: 'id_siniestro',
    header: 'ID',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-[#C8FF00] font-semibold">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'ramo',
    header: 'Ramo',
    cell: ({ getValue }) => (
      <span className="text-neutral-300 text-xs">{getValue<string>() || '-'}</span>
    ),
  },
  {
    accessorKey: 'ciudad',
    header: 'Ciudad',
    cell: ({ getValue }) => (
      <span className="text-neutral-500 text-xs">{getValue<string>() || '-'}</span>
    ),
  },
  {
    accessorKey: 'nombre_proveedor',
    header: 'Proveedor',
    cell: ({ row }) => (
      <span className="text-neutral-300 text-xs">
        {truncate(row.original.nombre_proveedor || row.original.id_proveedor || '-', 22)}
      </span>
    ),
  },
  {
    accessorKey: 'monto_reclamado',
    header: 'Monto',
    cell: ({ getValue }) => (
      <span className="text-neutral-200 text-xs font-medium tabular-nums">
        {formatMoney(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: 'score_final',
    header: 'Score',
    cell: ({ getValue }) => {
      const score = getValue<number>()
      const color = score >= 70 ? '#ef4444' : score >= 40 ? '#eab308' : '#22c55e'
      return (
        <div className="flex items-center gap-2 min-w-[90px]">
          <span className="font-bold text-xs tabular-nums w-8 text-right" style={{ color }}>
            {formatScore(score)}
          </span>
          <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${score}%`, backgroundColor: color }}
            />
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'nivel_riesgo',
    header: 'Nivel',
    cell: ({ getValue }) => <RiskBadge nivel={getValue<string>()} />,
  },
  {
    accessorKey: 'alertas_activadas',
    header: 'Alertas',
    cell: ({ getValue }) => {
      const raw = getValue<unknown>()
      const alertas: string[] = Array.isArray(raw)
        ? (raw as string[]).filter(Boolean)
        : typeof raw === 'string'
          ? raw.split('|').map(s => s.trim()).filter(Boolean)
          : []
      if (alertas.length === 0) return <span className="text-neutral-700 text-xs">—</span>
      return (
        <span className="text-xs text-neutral-500" title={alertas.join('\n')}>
          {truncate(alertas[0], 28)}
          {alertas.length > 1 && (
            <span className="ml-1 text-[10px] font-medium text-neutral-700 bg-[#2A2A2A] px-1.5 py-0.5 rounded-full">
              +{alertas.length - 1}
            </span>
          )}
        </span>
      )
    },
  },
]

export default function SiniestrosPage() {
  const router = useRouter()
  const [data, setData] = useState<Siniestro[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [nivelRiesgo, setNivelRiesgo] = useState('all')
  const [ramo, setRamo] = useState('')
  const [search, setSearch] = useState('')
  const [scoreMin, setScoreMin] = useState('')

  const stats = useMemo(() => {
    const rojos = data.filter(s => s.nivel_riesgo === 'Rojo Alto').length
    const amarillos = data.filter(s => s.nivel_riesgo === 'Amarillo Medio').length
    const verdes = data.filter(s => s.nivel_riesgo === 'Verde Bajo').length
    const monto = data.reduce((sum, s) => sum + Number(s.monto_reclamado || 0), 0)
    const scoreAvg = data.length > 0
      ? data.reduce((sum, s) => sum + Number(s.score_final || 0), 0) / data.length
      : 0
    return { rojos, amarillos, verdes, monto, scoreAvg }
  }, [data])

  const fetchData = useCallback(async (pg: number) => {
    setLoading(true)
    setError(null)
    try {
      const params: SiniestrosParams = { limit: PAGE_SIZE, offset: pg * PAGE_SIZE }
      if (nivelRiesgo !== 'all') params.nivel_riesgo = nivelRiesgo
      if (ramo) params.ramo = ramo
      if (search) params.search = search
      if (scoreMin) params.score_min = Number(scoreMin)
      const result = await getSiniestros(params)
      setData(result.items)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando siniestros')
    } finally {
      setLoading(false)
    }
  }, [nivelRiesgo, ramo, search, scoreMin])

  useEffect(() => { setPage(0); fetchData(0) }, [nivelRiesgo, ramo, scoreMin])

  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); fetchData(0) }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchData(newPage)
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / PAGE_SIZE),
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const askAI = (q: string) => {
    window.dispatchEvent(new CustomEvent('fraudia:ask', { detail: q }))
  }

  return (
    <div className="p-8 animate-fade-in bg-[#111111] min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Casos</p>
          <h1
            className="text-4xl font-bold text-white leading-none"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            SINIESTROS
          </h1>
          {total > 0 && (
            <p className="text-neutral-500 text-sm mt-1">
              {total.toLocaleString('es-EC')} casos registrados
            </p>
          )}
        </div>
        <button
          onClick={() => askAI('¿Cuáles son los 10 siniestros con mayor riesgo de fraude?')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C8FF00] hover:bg-[#d4ff33] text-black font-semibold rounded-xl text-sm transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Analizar con IA
        </button>
      </div>

      {/* KPI strip */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-5 gap-2.5 mb-4">
          {[
            {
              label: 'Rojo Alto',
              value: stats.rojos,
              color: '#ef4444',
              bg: 'bg-red-500/5',
              border: 'border-red-500/20',
            },
            {
              label: 'Amarillo Medio',
              value: stats.amarillos,
              color: '#eab308',
              bg: 'bg-yellow-500/5',
              border: 'border-yellow-500/20',
            },
            {
              label: 'Verde Bajo',
              value: stats.verdes,
              color: '#22c55e',
              bg: 'bg-green-600/5',
              border: 'border-green-600/20',
            },
            {
              label: 'Score promedio',
              value: stats.scoreAvg.toFixed(1),
              color: stats.scoreAvg >= 70 ? '#ef4444' : stats.scoreAvg >= 40 ? '#eab308' : '#22c55e',
              bg: 'bg-[#1C1C1C]',
              border: 'border-[#2A2A2A]',
            },
            {
              label: 'Monto (página)',
              value: formatMoney(stats.monto),
              color: '#C8FF00',
              bg: 'bg-[#C8FF00]/5',
              border: 'border-[#C8FF00]/20',
            },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={`rounded-xl ${bg} border ${border} px-4 py-3 text-center`}>
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-lg font-bold tabular-nums" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 mb-4 p-3.5 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A]">
        <div className="flex items-center gap-2 text-neutral-600 text-xs self-center">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros</span>
        </div>
        <div className="w-44">
          <Select value={nivelRiesgo} onValueChange={setNivelRiesgo}>
            <SelectTrigger className="h-8 text-xs bg-[#242424] border-[#333] text-white">
              <SelectValue placeholder="Nivel de riesgo" />
            </SelectTrigger>
            <SelectContent className="bg-[#1C1C1C] border-[#2A2A2A] text-white">
              <SelectItem value="all">Todos los niveles</SelectItem>
              <SelectItem value="Verde Bajo">🟢 Verde Bajo</SelectItem>
              <SelectItem value="Amarillo Medio">🟡 Amarillo Medio</SelectItem>
              <SelectItem value="Rojo Alto">🔴 Rojo Alto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Ramo..."
          value={ramo}
          onChange={(e) => setRamo(e.target.value)}
          className="h-8 text-xs w-32 bg-[#242424] border-[#333] text-white placeholder:text-neutral-600"
        />
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-600" />
          <Input
            placeholder="Buscar por descripción o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs pl-8 bg-[#242424] border-[#333] text-white placeholder:text-neutral-600"
          />
        </div>
        <Input
          type="number"
          placeholder="Score mín."
          value={scoreMin}
          onChange={(e) => setScoreMin(e.target.value)}
          min={0}
          max={100}
          className="h-8 text-xs w-28 bg-[#242424] border-[#333] text-white placeholder:text-neutral-600"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-[#C8FF00] animate-spin mr-3" />
            <p className="text-neutral-500 text-sm">Cargando siniestros...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="w-7 h-7 text-red-400 mb-3" />
            <p className="text-neutral-400 text-sm">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-[#222] bg-[#191919]">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left py-3 px-4 text-[10px] font-semibold text-neutral-600 uppercase tracking-wider whitespace-nowrap"
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center text-neutral-600 text-sm">
                      No se encontraron siniestros con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const nivel = row.original.nivel_riesgo
                    const lBorder = nivel === 'Rojo Alto'
                      ? 'border-l-red-500'
                      : nivel === 'Amarillo Medio'
                        ? 'border-l-yellow-500'
                        : 'border-l-green-700'
                    return (
                      <tr
                        key={row.id}
                        onClick={() => router.push(`/siniestros/${row.original.id_siniestro}`)}
                        className={`border-b border-[#1E1E1E] border-l-2 ${lBorder} hover:bg-[#1E1E1E] cursor-pointer transition-colors duration-100`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-2.5 px-4">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && total > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#222] bg-[#191919]">
            <p className="text-xs text-neutral-600">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total.toLocaleString('es-EC')} casos
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-white hover:bg-[#242424] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-7 h-7 rounded-lg text-xs transition-colors ${p === page ? 'bg-[#C8FF00] text-black font-bold' : 'text-neutral-500 hover:text-white hover:bg-[#242424]'}`}
                  >
                    {p + 1}
                  </button>
                )
              })}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-white hover:bg-[#242424] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-neutral-700 text-xs mt-4 text-center">
        Las alertas son señales de revisión. La decisión final corresponde al analista humano.
      </p>
    </div>
  )
}
