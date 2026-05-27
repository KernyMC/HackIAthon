'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Search, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Filter } from 'lucide-react'
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
    header: 'ID Siniestro',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-blue-400 font-semibold">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'ramo',
    header: 'Ramo',
    cell: ({ getValue }) => (
      <span className="text-gray-300 text-xs">{getValue<string>() || '-'}</span>
    ),
  },
  {
    accessorKey: 'cobertura',
    header: 'Cobertura',
    cell: ({ getValue }) => (
      <span className="text-gray-400 text-xs">{truncate(getValue<string>() || '-', 20)}</span>
    ),
  },
  {
    accessorKey: 'ciudad',
    header: 'Ciudad',
    cell: ({ getValue }) => (
      <span className="text-gray-400 text-xs">{getValue<string>() || '-'}</span>
    ),
  },
  {
    accessorKey: 'nombre_proveedor',
    header: 'Proveedor',
    cell: ({ row }) => (
      <span className="text-gray-300 text-xs">
        {row.original.nombre_proveedor || row.original.id_proveedor || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'monto_reclamado',
    header: 'Monto reclamado',
    cell: ({ getValue }) => (
      <span className="text-gray-200 text-xs font-medium">
        {formatMoney(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: 'score_final',
    header: 'Score',
    cell: ({ getValue }) => {
      const score = getValue<number>()
      const color =
        score >= 70 ? 'text-red-400' : score >= 40 ? 'text-yellow-400' : 'text-green-400'
      return (
        <span className={`font-bold text-sm ${color}`}>{formatScore(score)}</span>
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
    header: 'Alertas principales',
    cell: ({ getValue }) => {
      const alertas = getValue<string[]>() || []
      if (alertas.length === 0) return <span className="text-gray-600 text-xs">—</span>
      return (
        <span className="text-xs text-gray-400" title={alertas.join(', ')}>
          {truncate(alertas[0], 30)}
          {alertas.length > 1 && (
            <span className="ml-1 text-gray-600">+{alertas.length - 1}</span>
          )}
        </span>
      )
    },
  },
  {
    accessorKey: 'accion_sugerida',
    header: 'Acción',
    cell: ({ getValue }) => (
      <span className="text-xs text-gray-400">{truncate(getValue<string>() || '-', 25)}</span>
    ),
  },
]

export default function SiniestrosPage() {
  const router = useRouter()
  const [data, setData] = useState<Siniestro[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  // Filters
  const [nivelRiesgo, setNivelRiesgo] = useState('all')
  const [ramo, setRamo] = useState('')
  const [search, setSearch] = useState('')
  const [scoreMin, setScoreMin] = useState('')

  const fetchData = useCallback(async (pg: number) => {
    setLoading(true)
    setError(null)
    try {
      const params: SiniestrosParams = {
        limit: PAGE_SIZE,
        offset: pg * PAGE_SIZE,
      }
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

  useEffect(() => {
    setPage(0)
    fetchData(0)
  }, [nivelRiesgo, ramo, scoreMin])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0)
      fetchData(0)
    }, 400)
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

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Siniestros</h1>
        <p className="text-gray-400 text-sm mt-1">
          {total > 0
            ? `${total.toLocaleString('es-EC')} casos registrados`
            : 'Tabla de casos y alertas'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 p-4 rounded-xl bg-[hsl(222,47%,13%)] border border-[hsl(217,33%,20%)]">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Filter className="w-4 h-4" />
          <span>Filtros:</span>
        </div>
        <div className="w-44">
          <Select value={nivelRiesgo} onValueChange={setNivelRiesgo}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Nivel de riesgo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              <SelectItem value="Verde Bajo">Verde Bajo</SelectItem>
              <SelectItem value="Amarillo Medio">Amarillo Medio</SelectItem>
              <SelectItem value="Rojo Alto">Rojo Alto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-36">
          <Input
            placeholder="Ramo..."
            value={ramo}
            onChange={(e) => setRamo(e.target.value)}
            className="h-9 text-xs pr-3"
          />
        </div>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <Input
            placeholder="Buscar por descripción o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-xs pl-9"
          />
        </div>
        <div className="w-32">
          <Input
            type="number"
            placeholder="Score mín."
            value={scoreMin}
            onChange={(e) => setScoreMin(e.target.value)}
            min={0}
            max={100}
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mr-3" />
            <p className="text-gray-400">Cargando siniestros...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
            <p className="text-gray-400">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr
                    key={hg.id}
                    className="border-b border-[hsl(217,33%,20%)] bg-[hsl(222,47%,12%)]"
                  >
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-16 text-center text-gray-500"
                    >
                      No se encontraron siniestros con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/siniestros/${row.original.id_siniestro}`)}
                      className="border-b border-[hsl(217,33%,17%)] hover:bg-[hsl(217,33%,17%)] cursor-pointer transition-colors duration-100"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-2.5 px-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(217,33%,20%)] bg-[hsl(222,47%,12%)]">
            <p className="text-xs text-gray-500">
              Mostrando {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, total)} de {total.toLocaleString('es-EC')} casos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 hover:bg-[hsl(217,33%,20%)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
              <span className="text-xs text-gray-500">
                Pág {page + 1} / {totalPages || 1}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 hover:bg-[hsl(217,33%,20%)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
