'use client'

import { useEffect, useRef, useState, useCallback, useMemo, Fragment } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

// MUI X Charts — community
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
import { lineClasses } from '@mui/x-charts/LineChart'
import { chartsAxisHighlightClasses } from '@mui/x-charts/ChartsAxisHighlight'
import { PieChart, pieClasses } from '@mui/x-charts/PieChart'
import { useDrawingArea } from '@mui/x-charts/hooks'
import { styled } from '@mui/material/styles'
import { BarChart } from '@mui/x-charts/BarChart'

import {
  ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp, DollarSign, Activity, RefreshCw, RotateCcw, MessageSquare, ExternalLink, UserCheck, Info, ChevronRight, Check, XCircle,
} from 'lucide-react'
import { getKpis, getSiniestros, getProveedoresRiesgo, getNarrativasSimilares, getColaRevision, getKanban, resolverRevision, getRevisores } from '@/lib/api'
import type { KPIs, Siniestro, Proveedor, NarrativasSimilaresResponse, ColaRevisionItem, KanbanColumn, RevisionAccionPayload, Revisor } from '@/lib/types'
import { formatMoney, formatScore } from '@/lib/utils'
import Link from 'next/link'

// ── Dark theme ───────────────────────────────────────────────────────────────
const muiDark = createTheme({ palette: { mode: 'dark' } })

// ── Pie center label ─────────────────────────────────────────────────────────
const StyledPieLabel = styled('text')(() => ({
  fill: '#666', textAnchor: 'middle', dominantBaseline: 'central', fontSize: 10,
}))
function PieCenterLabel({ children }: { children: React.ReactNode }) {
  const { width, height, left, top } = useDrawingArea()
  return <StyledPieLabel x={left + width / 2} y={top + height / 2}>{children}</StyledPieLabel>
}

// ── Custom Heatmap (community replacement) ────────────────────────────────────
function CustomHeatmap({ ciudades, ramos, data }: {
  ciudades: string[]; ramos: string[]; data: Array<{ x: number; y: number; v: number }>
}) {
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)
  const getColor = (v: number) => {
    const t = Math.max(0, Math.min(1, (v - 15) / 65))
    return `rgb(${lerp(34, 239, t)},${lerp(197, 68, t)},${lerp(94, 68, t)})`
  }
  return (
    <div className="w-full overflow-auto">
      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `56px repeat(${ciudades.length}, 1fr)`, width: '100%' }}>
        <div />
        {ciudades.map(c => (
          <div key={c} className="text-[10px] text-neutral-500 text-center truncate px-0.5 pb-1">{c}</div>
        ))}
        {ramos.map((ramo, ry) => (
          <Fragment key={ramo}>
            <div className="text-[10px] text-neutral-500 flex items-center truncate pr-1">{ramo.slice(0, 14)}</div>
            {ciudades.map((_, cx) => {
              const cell = data.find(d => d.x === cx && d.y === ry)
              const v = cell?.v ?? 0
              return (
                <div
                  key={`${cx}-${ry}`}
                  className="rounded flex items-center justify-center text-[11px] font-bold"
                  style={{ height: 36, background: v > 0 ? getColor(v) : '#1A1A1A', color: '#fff', opacity: v > 0 ? 0.85 : 0.4 }}
                  title={`${ramo} · ${ciudades[cx]}: ${v}`}
                >
                  {v > 0 ? v : '—'}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-2">
        <div className="w-12 h-2 rounded" style={{ background: 'linear-gradient(to right, #22c55e, #ef4444)' }} />
        <span className="text-[10px] text-neutral-600">Bajo → Alto score</span>
      </div>
    </div>
  )
}

// ── Grid positions ───────────────────────────────────────────────────────────
const GRID_ITEMS = {
  'kpi-total':    { x: 0,  y: 0,  w: 2,  h: 2 },
  'kpi-niveles':  { x: 2,  y: 0,  w: 6,  h: 2 },
  'kpi-monto':    { x: 8,  y: 0,  w: 2,  h: 2 },
  'kpi-score':    { x: 10, y: 0,  w: 2,  h: 2 },
  'criticos':     { x: 0,  y: 2,  w: 3,  h: 4 },
  'donut':        { x: 3,  y: 2,  w: 3,  h: 4 },
  'ramos':        { x: 6,  y: 2,  w: 3,  h: 4 },
  'bar':          { x: 9,  y: 2,  w: 3,  h: 4 },
  'sparkline':    { x: 0,  y: 6,  w: 5,  h: 3 },
  'heatmap':      { x: 5,  y: 6,  w: 7,  h: 3 },
  'radialbar':    { x: 0,  y: 9,  w: 7,  h: 4 },
  'providers':    { x: 7,  y: 9,  w: 5,  h: 4 },
  'narrativas':   { x: 0,  y: 13, w: 12, h: 4 },
  'legend':       { x: 0,  y: 17, w: 12, h: 2 },
}

// ── Cluster metadata ──────────────────────────────────────────────────────────
const CLUSTER_META: Record<number, { label: string; color: string }> = {
  1: { label: 'Ring · Av. Universitaria',   color: '#f97316' },
  2: { label: 'Ring · Ruta E35',            color: '#ef4444' },
  3: { label: 'Taller · Automotriz Norte',  color: '#a855f7' },
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, subValue, icon: Icon, accent, pct, tooltip }: {
  label: string; value: string; subValue?: string; icon: React.ElementType; accent: string; pct?: number; tooltip?: string
}) {
  return (
    <div className="h-full rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-4 flex flex-col justify-between hover:border-[#333] transition-colors overflow-hidden relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: `radial-gradient(circle at 100% 0%, ${accent} 0%, transparent 60%)` }} />
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] text-neutral-600 font-semibold uppercase tracking-wider leading-tight">{label}</p>
          {tooltip && (
            <Tooltip
              title={<span style={{ fontSize: 11, lineHeight: 1.5 }}>{tooltip}</span>}
              placement="right" arrow
              slotProps={{ tooltip: { sx: { bgcolor: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 2, maxWidth: 220, p: 1.5 } }, arrow: { sx: { color: '#1A1A1A' } } }}
            >
              <Info className="w-2.5 h-2.5 text-neutral-700 hover:text-neutral-400 cursor-help transition-colors flex-shrink-0" />
            </Tooltip>
          )}
        </div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}20` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        {subValue && <p className="text-[11px] text-neutral-600 mt-0.5">{subValue}</p>}
      </div>
      {pct !== undefined && (
        <div className="mt-2">
          <div className="h-1 rounded-full bg-[#2A2A2A] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: accent }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ title, children, link, accent, tooltip }: {
  title: string; children: React.ReactNode; link?: { href: string; label: string }; accent?: string; tooltip?: string
}) {
  return (
    <div className="h-full rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#242424] flex-shrink-0">
        <div className="flex items-center gap-2">
          {accent && <div className="w-1 h-4 rounded-full" style={{ background: accent }} />}
          <h2 className="text-[13px] font-semibold text-white">{title}</h2>
          {tooltip && (
            <Tooltip
              title={<span style={{ fontSize: 11, lineHeight: 1.5 }}>{tooltip}</span>}
              placement="right"
              arrow
              slotProps={{
                tooltip: { sx: { bgcolor: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 2, maxWidth: 220, p: 1.5 } },
                arrow:   { sx: { color: '#1A1A1A' } },
              }}
            >
              <Info className="w-3 h-3 text-neutral-600 hover:text-neutral-400 cursor-help transition-colors" />
            </Tooltip>
          )}
        </div>
        {link && (
          <Link href={link.href} className="flex items-center gap-0.5 text-[12px] text-[#C8FF00] hover:text-white transition-colors">
            {link.label} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="flex-1 min-h-0 px-3 pb-3 pt-2">{children}</div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
function parseAlerta(v: unknown): string[] {
  if (!v) return []
  if (Array.isArray(v)) return (v as string[]).filter(Boolean)
  if (typeof v === 'string') return v.split('|').map(s => s.trim()).filter(Boolean)
  return []
}

export default function DashboardPage() {
  const gridRef  = useRef<HTMLDivElement>(null)
  const gridInst = useRef<import('gridstack').GridStack | null>(null)
  const [gridKey, setGridKey] = useState(0)

  const [kpis, setKpis]               = useState<KPIs | null>(null)
  const [topSin, setTopSin]           = useState<Siniestro[]>([])
  const [allSin, setAllSin]           = useState<Siniestro[]>([])
  const [proveedores, setProveedores]   = useState<Proveedor[]>([])
  const [narrativas, setNarrativas]   = useState<NarrativasSimilaresResponse | null>(null)
  const [cola, setCola]               = useState<ColaRevisionItem[]>([])
  const [kanban, setKanban]               = useState<KanbanColumn[]>([])
  const [revisores, setRevisores]         = useState<Revisor[]>([])
  const [kanbanLoading, setKanbanLoading] = useState(false)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [semIdx, setSemIdx]           = useState<number | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [k, top, all, p] = await Promise.all([
        getKpis(),
        getSiniestros({ limit: 10, offset: 0 }),
        getSiniestros({ limit: 1000, offset: 0 }),
        getProveedoresRiesgo(5),
      ])
      setKpis(k); setTopSin(top.items); setAllSin(all.items); setProveedores(p)
      setLastUpdated(new Date())
      // Narrativas: optional — won't fail dashboard if script hasn't run yet
      getNarrativasSimilares().then(setNarrativas).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    getColaRevision(4).then(setCola).catch(() => {})
  }, [])

  const fetchKanban = useCallback(async () => {
    try {
      const [cols, revs] = await Promise.all([getKanban(), getRevisores()])
      setKanban(cols)
      setRevisores(revs)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchKanban() }, [fetchKanban])

  const handleRevisionAccion = async (
    idSiniestro: string,
    accion: RevisionAccionPayload['accion'],
    idRevisorNuevo?: string,
  ) => {
    setKanbanLoading(true)
    try {
      await resolverRevision(idSiniestro, { accion, id_revisor_nuevo: idRevisorNuevo })
      await fetchKanban()
    } catch { /* silent */ } finally {
      setKanbanLoading(false)
    }
  }

  // GridStack init
  useEffect(() => {
    if (!kpis || !gridRef.current) return
    if (gridInst.current) { gridInst.current.destroy(false); gridInst.current = null }
    import('gridstack').then(({ GridStack }) => {
      if (!gridRef.current) return
      gridInst.current = GridStack.init(
        { float: false, column: 12, cellHeight: 80, margin: 5,
          resizable: { handles: 'se' }, draggable: { handle: '.gs-drag-handle' }, animate: true },
        gridRef.current
      )
    })
    return () => { if (gridInst.current) { gridInst.current.destroy(false); gridInst.current = null } }
  }, [kpis, gridKey])

  // ── Derived chart data ────────────────────────────────────────────────────

  // Monthly groups for SparkLine + RadialBar
  const monthlyGroups = useMemo(() => {
    const map: Record<string, { total: number; rojos: number; amarillos: number; verdes: number }> = {}
    allSin.forEach(s => {
      const m = s.fecha_ocurrencia?.slice(0, 7)
      if (!m) return
      if (!map[m]) map[m] = { total: 0, rojos: 0, amarillos: 0, verdes: 0 }
      map[m].total++
      if (s.nivel_riesgo === 'Rojo Alto')          map[m].rojos++
      else if (s.nivel_riesgo === 'Amarillo Medio') map[m].amarillos++
      else                                          map[m].verdes++
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
  }, [allSin])

  const monthLabels    = monthlyGroups.map(([m]) => m.replace('-', '/'))
  const monthTotals    = monthlyGroups.map(([, v]) => v.total)
  const monthRojos     = monthlyGroups.map(([, v]) => v.rojos)
  const monthAmarillos = monthlyGroups.map(([, v]) => v.amarillos)
  const monthVerdes    = monthlyGroups.map(([, v]) => v.verdes)

  // Nested Pie data
  const { innerPie, outerPie } = useMemo(() => {
    if (!kpis) return { innerPie: [], outerPie: [] }
    const inner = [
      { id: 'verde',    label: 'Verde',    value: kpis.casos_verdes,    color: '#22c55e' },
      { id: 'amarillo', label: 'Amarillo', value: kpis.casos_amarillos, color: '#eab308' },
      { id: 'rojo',     label: 'Rojo',     value: kpis.casos_rojos,     color: '#ef4444' },
    ]
    const shades: Record<string, string[]> = {
      'Verde Bajo':     ['#16a34a','#15803d','#166534'],
      'Amarillo Medio': ['#ca8a04','#a16207','#854d0e'],
      'Rojo Alto':      ['#dc2626','#b91c1c','#991b1b'],
    }
    const ramoByNivel: Record<string, Record<string, number>> = {
      'Verde Bajo': {}, 'Amarillo Medio': {}, 'Rojo Alto': {},
    }
    allSin.forEach(s => {
      if (ramoByNivel[s.nivel_riesgo])
        ramoByNivel[s.nivel_riesgo][s.ramo] = (ramoByNivel[s.nivel_riesgo][s.ramo] ?? 0) + 1
    })
    const outer = (Object.entries(ramoByNivel) as [string, Record<string, number>][])
      .flatMap(([nivel, ramos], ni) =>
        Object.entries(ramos).sort(([, a], [, b]) => b - a).slice(0, 3)
          .map(([ramo, count], ri) => ({
            id: `${nivel}-${ramo}`, label: ramo, value: count,
            color: shades[nivel]?.[ri] ?? '#333',
          }))
      )
    return { innerPie: inner, outerPie: outer }
  }, [kpis, allSin])

  // Heatmap
  const heatmapData = useMemo(() => {
    if (!allSin.length) return { ciudades: [], ramos: [], data: [] }
    const cCount: Record<string, number> = {}
    const rCount: Record<string, number> = {}
    allSin.forEach(s => {
      if (s.ciudad) cCount[s.ciudad] = (cCount[s.ciudad] ?? 0) + 1
      if (s.ramo)   rCount[s.ramo]   = (rCount[s.ramo]   ?? 0) + 1
    })
    const ciudades = Object.entries(cCount).sort(([, a], [, b]) => b - a).slice(0, 5).map(([c]) => c)
    const ramos    = Object.entries(rCount).sort(([, a], [, b]) => b - a).slice(0, 4).map(([r]) => r)
    const scoreMap: Record<string, number[]> = {}
    allSin.forEach(s => {
      const cx = ciudades.indexOf(s.ciudad)
      const ry = ramos.indexOf(s.ramo)
      if (cx < 0 || ry < 0) return
      const key = `${cx}-${ry}`
      if (!scoreMap[key]) scoreMap[key] = []
      scoreMap[key].push(Number(s.score_final))
    })
    const data = ciudades.flatMap((_, cx) =>
      ramos.map((_, ry) => {
        const scores = scoreMap[`${cx}-${ry}`] ?? []
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
        return { x: cx, y: ry, v: Math.round(avg) }
      })
    )
    return { ciudades, ramos, data }
  }, [allSin])

  // Top ramos por % casos Rojo Alto — datos reales
  const ramoRisk = useMemo(() => {
    const map: Record<string, { total: number; rojos: number; monto: number }> = {}
    allSin.forEach(s => {
      if (!s.ramo) return
      if (!map[s.ramo]) map[s.ramo] = { total: 0, rojos: 0, monto: 0 }
      map[s.ramo].total++
      map[s.ramo].monto += Number(s.monto_reclamado ?? 0)
      if (s.nivel_riesgo === 'Rojo Alto') map[s.ramo].rojos++
    })
    return Object.entries(map)
      .map(([ramo, { total, rojos, monto }]) => ({
        ramo,
        total,
        rojos,
        monto,
        pctRojo: total > 0 ? Math.round((rojos / total) * 100) : 0,
      }))
      .sort((a, b) => b.pctRojo - a.pctRojo)
      .slice(0, 6)
  }, [allSin])

  // Top 5 casos críticos Rojo Alto
  const criticalCases = useMemo(() =>
    allSin
      .filter(s => s.nivel_riesgo === 'Rojo Alto')
      .sort((a, b) => Number(b.score_final) - Number(a.score_final))
      .slice(0, 5)
  , [allSin])

  // Bar chart top 10
  const barData = topSin.map(s => ({
    id: s.id_siniestro.replace('SIN-', ''),
    score: Number(formatScore(s.score_final)),
  }))

  const pct = (n: number) => kpis ? `${Math.round((n / kpis.total_siniestros) * 100)}%` : ''
  const pos = (id: keyof typeof GRID_ITEMS) => GRID_ITEMS[id]
  const hl  = { highlight: 'item', fade: 'global' } as const

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#111111]">
      <RefreshCw className="w-6 h-6 text-[#C8FF00] animate-spin mr-3" />
      <p className="text-neutral-500 text-sm">Cargando dashboard...</p>
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-[#111111]">
      <div className="text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-white font-semibold mb-2">Error al cargar datos</p>
        <p className="text-neutral-500 text-sm mb-5">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-[#C8FF00] text-black font-semibold rounded-xl text-sm">Reintentar</button>
      </div>
    </div>
  )

  return (
    <ThemeProvider theme={muiDark}>
      <div className="bg-[#111111] min-h-screen pb-10">

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div>
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-1">Overview</p>
            <h1 className="text-4xl font-bold text-white leading-none">DASHBOARD</h1>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && <p className="text-[11px] text-neutral-600">{lastUpdated.toLocaleTimeString('es-EC')}</p>}
            <button onClick={() => setGridKey(k => k + 1)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#242424] text-neutral-500 text-xs border border-[#2A2A2A] transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Restablecer
            </button>
            <button onClick={loadData}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#242424] text-neutral-300 text-xs border border-[#2A2A2A] transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Actualizar
            </button>
          </div>
        </div>

        <div className="px-6">
          <div key={gridKey} ref={gridRef} className="grid-stack">

            {/* ── KPI cards ─────────────────────────────────────────────── */}
            {kpis && (<>
              {/* Total */}
              <div className="grid-stack-item" gs-x={pos('kpi-total').x} gs-y={pos('kpi-total').y} gs-w={pos('kpi-total').w} gs-h={pos('kpi-total').h}>
                <div className="grid-stack-item-content">
                  <KPICard label="Total siniestros" value={kpis.total_siniestros.toLocaleString('es-EC')} icon={Activity} accent="#C8FF00" pct={100} tooltip="Total de siniestros registrados en la base de datos. Incluye todos los niveles de riesgo y estados." />
                </div>
              </div>

              {/* Distribución Verde / Amarillo / Rojo — card unificada */}
              <div className="grid-stack-item" gs-x={pos('kpi-niveles').x} gs-y={pos('kpi-niveles').y} gs-w={pos('kpi-niveles').w} gs-h={pos('kpi-niveles').h}>
                <div className="grid-stack-item-content">
                  <div className="h-full rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] px-4 py-3 flex flex-col justify-between hover:border-[#333] transition-colors">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider">Distribución por nivel de riesgo</p>
                      <Tooltip
                        title={<span style={{ fontSize: 11, lineHeight: 1.5 }}>Desglose de todos los siniestros en Verde (score 0–39), Amarillo (40–69) y Rojo (70–100). Verde = flujo normal, Rojo = escalar a antifraude.</span>}
                        placement="right" arrow
                        slotProps={{ tooltip: { sx: { bgcolor: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 2, maxWidth: 220, p: 1.5 } }, arrow: { sx: { color: '#1A1A1A' } } }}
                      >
                        <Info className="w-2.5 h-2.5 text-neutral-700 hover:text-neutral-400 cursor-help transition-colors flex-shrink-0" />
                      </Tooltip>
                    </div>
                    <div className="flex gap-4 flex-1 items-center">
                      {[
                        { label: 'Verde Bajo',     count: kpis.casos_verdes,    color: '#22c55e', icon: ShieldCheck },
                        { label: 'Amarillo Medio', count: kpis.casos_amarillos, color: '#eab308', icon: AlertTriangle },
                        { label: 'Rojo Alto',      count: kpis.casos_rojos,     color: '#ef4444', icon: ShieldAlert },
                      ].map(({ label, count, color, icon: Icon }) => {
                        const p = Math.round((count / kpis.total_siniestros) * 100)
                        return (
                          <div key={label} className="flex-1 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                              <Icon className="w-3 h-3" style={{ color }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-lg font-bold text-white leading-none">{count.toLocaleString('es-EC')}</p>
                              <p className="text-[10px] font-semibold" style={{ color }}>{p}% · {label.split(' ')[0]}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Stacked bar */}
                    <div className="h-1.5 rounded-full overflow-hidden flex gap-0.5 mt-1">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round((kpis.casos_verdes / kpis.total_siniestros) * 100)}%`, background: '#22c55e' }} />
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round((kpis.casos_amarillos / kpis.total_siniestros) * 100)}%`, background: '#eab308' }} />
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round((kpis.casos_rojos / kpis.total_siniestros) * 100)}%`, background: '#ef4444' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Monto */}
              <div className="grid-stack-item" gs-x={pos('kpi-monto').x} gs-y={pos('kpi-monto').y} gs-w={pos('kpi-monto').w} gs-h={pos('kpi-monto').h}>
                <div className="grid-stack-item-content">
                  <KPICard label="Monto total" value={formatMoney(kpis.monto_total_reclamado)} icon={DollarSign} accent="#C8FF00" tooltip="Suma total de montos reclamados en todos los siniestros, expresado en USD." />
                </div>
              </div>

              {/* Score */}
              <div className="grid-stack-item" gs-x={pos('kpi-score').x} gs-y={pos('kpi-score').y} gs-w={pos('kpi-score').w} gs-h={pos('kpi-score').h}>
                <div className="grid-stack-item-content">
                  <KPICard label="Score promedio" value={formatScore(kpis.score_promedio)} subValue="/ 100 pts." icon={TrendingUp} accent="#FF6500" pct={Math.round(kpis.score_promedio)} tooltip="Score de riesgo promedio de todos los siniestros. Calculado como 60% reglas + 40% modelo simulado. Escala de 0 a 100." />
                </div>
              </div>
            </>)}

            {/* ── Casos Críticos — revisar hoy ─────────────────────────── */}
            <div className="grid-stack-item" gs-x={pos('criticos').x} gs-y={pos('criticos').y} gs-w={pos('criticos').w} gs-h={pos('criticos').h}>
              <div className="grid-stack-item-content">
                <Card title="Casos Críticos · Revisar Hoy" accent="#ef4444" tooltip="Siniestros con score ≥ 70 (Rojo Alto) que requieren atención inmediata hoy. Ordenados por score descendente.">
                  <div className="flex flex-col gap-1.5 h-full overflow-auto">
                    {criticalCases.map(s => {
                      const alertas = parseAlerta(s.alertas_activadas).slice(0, 2)
                      const q = `Explica el siniestro ${s.id_siniestro} detalladamente: ¿por qué tiene nivel Rojo Alto, qué reglas activó y qué debe revisar el analista?`
                      return (
                        <div key={s.id_siniestro} className="rounded-xl bg-[#191919] border border-[#2A2A2A] hover:border-[#ef4444]/30 px-3 py-2 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-mono font-bold text-white">{s.id_siniestro}</span>
                              <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                {formatScore(s.score_final)} pts
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => window.dispatchEvent(new CustomEvent('fraudia:ask', { detail: q }))}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#C8FF00]/10 hover:bg-[#C8FF00]/20 border border-[#C8FF00]/20 transition-colors"
                                title="Explicar con IA"
                              >
                                <MessageSquare className="w-2.5 h-2.5 text-[#C8FF00]" />
                                <span className="text-[10px] font-semibold text-[#C8FF00]">IA</span>
                              </button>
                              <Link
                                href={`/siniestros/${s.id_siniestro}`}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#1C1C1C] hover:bg-[#242424] border border-[#2A2A2A] transition-colors"
                                title="Ver detalle"
                              >
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </Link>
                            </div>
                          </div>
                          <p className="text-[12px] text-neutral-500 mb-1">{s.ramo} · {s.ciudad}</p>
                          <div className="flex flex-wrap gap-1">
                            {alertas.map(a => (
                              <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-900/40 truncate max-w-full">
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    {criticalCases.length === 0 && (
                      <p className="text-neutral-600 text-xs text-center mt-6">Sin casos críticos</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* ── Nested PieChart — riesgo × ramo ──────────────────────── */}
            <div className="grid-stack-item" gs-x={pos('donut').x} gs-y={pos('donut').y} gs-w={pos('donut').w} gs-h={pos('donut').h}>
              <div className="grid-stack-item-content">
                <Card title="Riesgo × Ramo" accent="#22c55e" tooltip="Distribución de todos los siniestros por nivel de riesgo (Verde/Amarillo/Rojo) agrupados por tipo de ramo.">
                  <div className="flex flex-col h-full">
                    <div className="flex-1 min-h-0">
                      <PieChart
                        series={[
                          {
                            innerRadius: 38, outerRadius: 80,
                            data: innerPie,
                            highlightScope: { fade: 'global', highlight: 'item' },
                            cornerRadius: 3, paddingAngle: 2,
                            arcLabel: item => `${Math.round((item.value / (kpis?.total_siniestros ?? 1)) * 100)}%`,
                          },
                          {
                            innerRadius: 85, outerRadius: 105,
                            data: outerPie,
                            highlightScope: { fade: 'global', highlight: 'item' },
                            cornerRadius: 2, paddingAngle: 1,
                          },
                        ]}
                        sx={{ [`& .${pieClasses.arcLabel}`]: { fontSize: 9, fill: '#fff' } }}
                        height={210}
                        hideLegend
                      >
                        <PieCenterLabel>{kpis?.total_siniestros ?? '...'}</PieCenterLabel>
                      </PieChart>
                    </div>
                    <div className="flex justify-center gap-3 pb-1 flex-shrink-0">
                      {innerPie.map(d => (
                        <div key={d.id} className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-[11px] text-neutral-500">{d.label}</span>
                          <span className="text-[11px] font-bold" style={{ color: d.color }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* ── Ramos por % Rojo Alto — datos reales ─────────────────── */}
            <div className="grid-stack-item" gs-x={pos('ramos').x} gs-y={pos('ramos').y} gs-w={pos('ramos').w} gs-h={pos('ramos').h}>
              <div className="grid-stack-item-content">
                <Card title="Ramos · % Riesgo Rojo" accent="#ef4444" tooltip="Porcentaje de casos Rojo Alto sobre el total de cada ramo. Un ramo con 100% indica que todos sus siniestros son de alto riesgo.">
                  <div className="flex flex-col gap-2 h-full overflow-auto">
                    {ramoRisk.map((r, i) => (
                      <div key={r.ramo}>
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-neutral-600 w-3">{i + 1}</span>
                            <span className="text-[10px] text-white font-medium truncate max-w-[120px]">{r.ramo}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[11px] text-neutral-500">{r.rojos}/{r.total}</span>
                            <span
                              className="text-[10px] font-bold w-8 text-right"
                              style={{ color: r.pctRojo >= 15 ? '#ef4444' : r.pctRojo >= 8 ? '#eab308' : '#22c55e' }}
                            >
                              {r.pctRojo}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#2A2A2A] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${r.pctRojo}%`,
                              background: r.pctRojo >= 15 ? '#ef4444' : r.pctRojo >= 8 ? '#eab308' : '#22c55e',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-neutral-700 mt-auto pt-2 border-t border-[#1A1A1A]">
                      % de casos Rojo Alto sobre total del ramo · Datos reales
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* ── Top 10 siniestros por score — lista horizontal ─────── */}
            <div className="grid-stack-item" gs-x={pos('bar').x} gs-y={pos('bar').y} gs-w={pos('bar').w} gs-h={pos('bar').h}>
              <div className="grid-stack-item-content">
                <Card title="Top 10 Siniestros · Mayor Score de Riesgo" accent="#eab308" tooltip="Los 10 siniestros con el score de riesgo más alto. Score = 60% reglas + 40% modelo simulado. Rojo ≥70, Amarillo ≥40.">
                  <div className="flex flex-col gap-1.5 h-full overflow-auto">
                    {barData.map((d, i) => {
                      const color = d.score >= 70 ? '#ef4444' : d.score >= 40 ? '#eab308' : '#22c55e'
                      return (
                        <div key={d.id}>
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-neutral-600 w-4 text-right">{i + 1}</span>
                              <span className="text-[11px] font-mono font-semibold text-white">{d.id}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
                              >
                                {d.score >= 70 ? 'Alto' : d.score >= 40 ? 'Medio' : 'Bajo'}
                              </span>
                              <span className="text-[13px] font-bold tabular-nums" style={{ color }}>{d.score}</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#2A2A2A] overflow-hidden ml-5">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${d.score}%`,
                                background: d.score >= 70
                                  ? 'linear-gradient(90deg,#ef4444,#b91c1c)'
                                  : d.score >= 40 ? '#eab308' : '#22c55e',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    <p className="text-[10px] text-neutral-700 mt-auto pt-1.5 border-t border-[#1A1A1A]">
                      Score 0–100 · Rojo ≥70 · Amarillo ≥40 · Verde &lt;40
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* ── SparkLine — tendencia mensual ─────────────────────────── */}
            <div className="grid-stack-item" gs-x={pos('sparkline').x} gs-y={pos('sparkline').y} gs-w={pos('sparkline').w} gs-h={pos('sparkline').h}>
              <div className="grid-stack-item-content">
                <Card title="Tendencia Mensual · Siniestros" accent="#C8FF00" tooltip="Evolución mensual del número de siniestros reportados. Permite identificar estacionalidad o picos de fraude en el tiempo.">
                  <div
                    role="button" tabIndex={0} className="outline-none h-full flex flex-col justify-between"
                    onKeyDown={e => {
                      if (e.key === 'ArrowLeft') setSemIdx(p => p === null ? monthLabels.length - 1 : (monthLabels.length + p - 1) % monthLabels.length)
                      if (e.key === 'ArrowRight') setSemIdx(p => p === null ? 0 : (p + 1) % monthLabels.length)
                    }}
                    onFocus={() => setSemIdx(p => p ?? 0)}
                  >
                    <div>
                      <p className="text-neutral-500 text-[10px]">{semIdx === null ? 'Últimos 12 meses' : monthLabels[semIdx]}</p>
                      <div className="flex items-end justify-between border-b border-[#eab308]/20 pb-1.5 mb-2">
                        <span className="text-xl font-bold text-white">
                          {monthTotals[semIdx ?? monthTotals.length - 1] ?? 0}
                          <span className="text-[10px] text-neutral-500 ml-1">casos</span>
                        </span>
                        <SparkLineChart
                          data={monthTotals}
                          height={50} width={180}
                          area showHighlight color="#eab308"
                          onHighlightedAxisChange={items => setSemIdx(items[0]?.dataIndex ?? null)}
                          highlightedAxis={semIdx === null ? [] : [{ axisId: 'mes', dataIndex: semIdx }]}
                          xAxis={{ id: 'mes', data: monthLabels }}
                          yAxis={{ domainLimit: (_, max) => ({ min: -max / 6, max }) }}
                          axisHighlight={{ x: 'line' }}
                          margin={{ bottom: 0, top: 4, left: 4, right: 0 }}
                          baseline="min"
                          sx={{
                            [`& .${lineClasses.area}`]: { opacity: 0.15 },
                            [`& .${lineClasses.line}`]: { strokeWidth: 2.5 },
                            [`& .${chartsAxisHighlightClasses.root}`]: { stroke: '#eab308', strokeDasharray: 'none', strokeWidth: 1.5 },
                          }}
                          slotProps={{ lineHighlight: { r: 4 } }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      {[
                        { label: 'Rojos',     data: monthRojos,     color: '#ef4444' },
                        { label: 'Amarillos', data: monthAmarillos, color: '#eab308' },
                        { label: 'Verdes',    data: monthVerdes,    color: '#22c55e' },
                      ].map(({ label, data, color }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-[10px] text-neutral-500">{label}:</span>
                          <span className="text-[10px] font-semibold" style={{ color }}>
                            {data[semIdx ?? data.length - 1] ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* ── Heatmap — score por ciudad × ramo ────────────────────── */}
            <div className="grid-stack-item" gs-x={pos('heatmap').x} gs-y={pos('heatmap').y} gs-w={pos('heatmap').w} gs-h={pos('heatmap').h}>
              <div className="grid-stack-item-content">
                <Card title="Score Promedio · Ciudad × Ramo" accent="#a855f7" tooltip="Score de riesgo promedio cruzado por ciudad y ramo. Ciudades con mayor valor concentran más siniestros de alto riesgo.">
                  {heatmapData.ciudades.length > 0 && (
                    <CustomHeatmap
                      ciudades={heatmapData.ciudades}
                      ramos={heatmapData.ramos}
                      data={heatmapData.data}
                    />
                  )}
                </Card>
              </div>
            </div>

            {/* ── RadialBarChart — alertas mensuales ───────────────────── */}
            <div className="grid-stack-item" gs-x={pos('radialbar').x} gs-y={pos('radialbar').y} gs-w={pos('radialbar').w} gs-h={pos('radialbar').h}>
              <div className="grid-stack-item-content">
                <Card title="Alertas por Nivel · Distribución Mensual" accent="#ef4444" tooltip="Distribución mensual de alertas activadas agrupadas por nivel de riesgo. Muestra si hay incremento de casos críticos.">
                  {monthTotals.length > 0 && (
                    <BarChart
                      xAxis={[{ scaleType: 'band', data: monthLabels, tickLabelStyle: { fill: '#4a4a4a', fontSize: 8 } }]}
                      yAxis={[{ tickLabelStyle: { fill: '#4a4a4a', fontSize: 8 } }]}
                      series={[
                        { data: monthRojos,     label: 'Rojo Alto',      color: '#ef4444', stack: 'niveles', highlightScope: hl },
                        { data: monthAmarillos, label: 'Amarillo Medio', color: '#eab308', stack: 'niveles', highlightScope: hl },
                        { data: monthVerdes,    label: 'Verde Bajo',     color: '#22c55e', stack: 'niveles', highlightScope: hl },
                      ]}
                      height={280}
                      borderRadius={3}
                      hideLegend
                      sx={{
                        '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: 'transparent' },
                        '& .MuiChartsGrid-line': { stroke: '#1E1E1E', strokeDasharray: '3 3' },
                      }}
                    />
                  )}
                </Card>
              </div>
            </div>

            {/* ── Providers table ───────────────────────────────────────── */}
            <div className="grid-stack-item" gs-x={pos('providers').x} gs-y={pos('providers').y} gs-w={pos('providers').w} gs-h={pos('providers').h}>
              <div className="grid-stack-item-content">
                <Card title="Top Proveedores · Alertas Rojas" link={{ href: '/proveedores', label: 'Ver todos' }} accent="#FF6500" tooltip="Proveedores con mayor concentración de siniestros Rojo Alto. Los marcados con ⚠ están en la lista restrictiva de la aseguradora.">
                  <div className="overflow-auto h-full">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#242424]">
                          {['Proveedor','Rojos','Score','Monto'].map(h => (
                            <th key={h} className="text-left pb-2 px-1 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {proveedores.map(p => {
                          const maxR = Math.max(...proveedores.map(x => x.casos_rojos), 1)
                          return (
                            <tr key={p.id_proveedor} className="border-b border-[#1A1A1A] hover:bg-[#212121] transition-colors">
                              <td className="py-2 px-1 font-medium text-white text-[12px]">{(p.nombre_proveedor || p.id_proveedor || '').slice(0, 18)}</td>
                              <td className="py-2 px-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-red-400 font-bold text-[10px] w-4 text-right">{p.casos_rojos}</span>
                                  <div className="w-12 h-1.5 rounded-full bg-[#2A2A2A]">
                                    <div className="h-full rounded-full bg-red-500" style={{ width: `${(p.casos_rojos / maxR) * 100}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-1 text-neutral-400 text-[12px]">{formatScore(p.score_promedio)}</td>
                              <td className="py-2 px-1 text-neutral-400 text-[12px]">{formatMoney(p.monto_total_reclamado)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>

            {/* ── Narrativas Similares · RF-07 ─────────────────────────── */}
            <div className="grid-stack-item" gs-x={pos('narrativas').x} gs-y={pos('narrativas').y} gs-w={pos('narrativas').w} gs-h={pos('narrativas').h}>
              <div className="grid-stack-item-content">
                <div className="h-full rounded-2xl bg-[#1C1C1C] border border-orange-500/30 flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#242424] flex-shrink-0" style={{ background: 'linear-gradient(90deg,rgba(249,115,22,0.08) 0%,transparent 60%)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-4 rounded-full bg-orange-500" />
                      <h2 className="text-[11px] font-semibold text-white">Narrativas Similares Detectadas · RF-07</h2>
                      <Tooltip
                        title={<span style={{ fontSize: 11, lineHeight: 1.5 }}>Pares de siniestros con descripciones casi idénticas detectadas por TF-IDF coseno. Activa la regla RF-07 que puede indicar fraude coordinado.</span>}
                        placement="right" arrow
                        slotProps={{ tooltip: { sx: { bgcolor: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 2, maxWidth: 220, p: 1.5 } }, arrow: { sx: { color: '#1A1A1A' } } }}
                      >
                        <Info className="w-3 h-3 text-neutral-600 hover:text-neutral-400 cursor-help transition-colors" />
                      </Tooltip>
                      {narrativas && narrativas.resumen.total_pares > 0 && (
                        <Chip
                          label={`${narrativas.resumen.total_clusters} redes · ${narrativas.resumen.casos_involucrados} casos`}
                          size="small"
                          sx={{ height: 18, fontSize: 9, fontWeight: 700, bgcolor: '#f9731620', color: '#fb923c', border: '1px solid #f9731640', animation: 'pulse 2s infinite', '& .MuiChip-label': { px: 1 } }}
                        />
                      )}
                    </div>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('fraudia:ask', { detail: '¿Qué siniestros tienen narrativas similares entre sí que podrían indicar fraude coordinado o un taller cómplice?' }))}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#C8FF00]/10 hover:bg-[#C8FF00]/20 border border-[#C8FF00]/20 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3 text-[#C8FF00]" />
                      <span className="text-[11px] font-semibold text-[#C8FF00]">Analizar IA</span>
                    </button>
                  </div>

                  {!narrativas || narrativas.resumen.total_pares === 0 ? (
                    <div className="flex-1 flex items-center justify-center flex-col gap-2">
                      <p className="text-neutral-600 text-xs">Sin datos de similitud</p>
                      <p className="text-neutral-700 text-[10px]">Ejecuta: python scripts/generate_fraud_narratives.py</p>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 flex flex-col">
                      {/* Alert banner */}
                      <div className="px-3 pt-2 pb-1.5 flex-shrink-0">
                        <Alert
                          severity="error"
                          icon={<ShieldAlert style={{ fontSize: 14 }} />}
                          sx={{
                            py: 0.5, px: 1.5,
                            bgcolor: '#7f1d1d18',
                            color: '#fca5a5',
                            border: '1px solid #ef444428',
                            borderRadius: '10px',
                            '& .MuiAlert-icon': { color: '#ef4444', fontSize: 14, mr: 1 },
                            '& .MuiAlert-message': { fontSize: 10 },
                          }}
                        >
                          <strong>Posible fraude coordinado:</strong> {narrativas.resumen.total_clusters} redes detectadas con {narrativas.resumen.total_pares} pares de narrativas similares — similitud promedio {Math.round(narrativas.resumen.similitud_promedio * 100)}%
                        </Alert>
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-h-0 flex gap-3 px-3 pb-3">
                        {/* Cluster cards */}
                        <div className="flex flex-col gap-2 w-52 flex-shrink-0">
                          {narrativas.clusters.slice(0, 3).map((c) => {
                            const meta = CLUSTER_META[c.cluster_narrativa] ?? { label: `Cluster ${c.cluster_narrativa}`, color: '#888' }
                            const simPct = Math.round(Number(c.similitud_promedio) * 100)
                            return (
                              <div key={c.cluster_narrativa} className="rounded-xl bg-[#191919] border border-[#242424] px-3 py-2.5 hover:border-orange-500/20 transition-colors">
                                <div className="flex items-center justify-between mb-1.5">
                                  <Chip
                                    label={meta.label}
                                    size="small"
                                    sx={{
                                      height: 16, fontSize: 8, fontWeight: 700, maxWidth: 130,
                                      bgcolor: `${meta.color}18`, color: meta.color,
                                      border: `1px solid ${meta.color}35`,
                                      '& .MuiChip-label': { px: 0.75, overflow: 'hidden', textOverflow: 'ellipsis' },
                                    }}
                                  />
                                  <Tooltip title={`Similitud coseno promedio: ${simPct}%`} placement="top" arrow>
                                    <span className="text-[12px] font-bold text-white tabular-nums cursor-default">{simPct}%</span>
                                  </Tooltip>
                                </div>
                                <LinearProgress
                                  variant="determinate"
                                  value={simPct}
                                  sx={{
                                    height: 5, borderRadius: 3, mb: 1.5,
                                    bgcolor: '#2A2A2A',
                                    '& .MuiLinearProgress-bar': { bgcolor: meta.color, borderRadius: 3 },
                                  }}
                                />
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-neutral-600">{c.total_pares} pares</span>
                                  <span className="text-[10px] text-neutral-600">{c.casos_aprox} casos</span>
                                </div>
                              </div>
                            )
                          })}
                          <p className="text-[10px] text-neutral-700 px-1 mt-auto leading-relaxed">
                            TF-IDF coseno · scikit-learn · Regla RF-07
                          </p>
                        </div>

                        {/* Pairs table — MUI Table */}
                        <div className="flex-1 overflow-auto">
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                {['Siniestro A', 'Siniestro B', 'Similitud', 'Cluster', 'Proveedor'].map(h => (
                                  <TableCell
                                    key={h}
                                    sx={{
                                      bgcolor: '#141414',
                                      color: '#525252',
                                      fontSize: 9,
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                      borderBottomColor: '#242424',
                                      py: 0.75,
                                      px: 1,
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {h}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {narrativas.pares.slice(0, 10).map((p) => {
                                const simPct = Math.round(Number(p.similitud) * 100)
                                const meta = CLUSTER_META[p.cluster_narrativa] ?? { label: `#${p.cluster_narrativa}`, color: '#888' }
                                return (
                                  <Tooltip
                                    key={p.id_par}
                                    title={
                                      <div style={{ fontSize: 10, maxWidth: 320, lineHeight: 1.5 }}>
                                        <div><strong style={{ color: '#C8FF00' }}>A:</strong> {(p.descripcion_a || '').slice(0, 130)}{(p.descripcion_a || '').length > 130 ? '…' : ''}</div>
                                        <div style={{ marginTop: 4 }}><strong style={{ color: '#C8FF00' }}>B:</strong> {(p.descripcion_b || '').slice(0, 130)}{(p.descripcion_b || '').length > 130 ? '…' : ''}</div>
                                      </div>
                                    }
                                    placement="left"
                                    arrow
                                    slotProps={{ tooltip: { sx: { bgcolor: '#1C1C1C', border: '1px solid #333', borderRadius: 2 } }, arrow: { sx: { color: '#1C1C1C' } } }}
                                  >
                                    <TableRow
                                      hover
                                      sx={{
                                        cursor: 'default',
                                        '&:hover': { bgcolor: '#1E1E1E !important' },
                                        '& td': { borderBottomColor: '#1A1A1A' },
                                      }}
                                    >
                                      <TableCell sx={{ py: 1, px: 1, fontFamily: 'monospace', fontSize: 9, color: '#C8FF00', whiteSpace: 'nowrap' }}>{p.id_siniestro_a}</TableCell>
                                      <TableCell sx={{ py: 1, px: 1, fontFamily: 'monospace', fontSize: 9, color: '#C8FF00', whiteSpace: 'nowrap' }}>{p.id_siniestro_b}</TableCell>
                                      <TableCell sx={{ py: 1, px: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <LinearProgress
                                            variant="determinate"
                                            value={simPct}
                                            sx={{
                                              height: 5, borderRadius: 3, width: 48, flexShrink: 0,
                                              bgcolor: '#2A2A2A',
                                              '& .MuiLinearProgress-bar': { bgcolor: '#f97316', borderRadius: 3 },
                                            }}
                                          />
                                          <span style={{ fontSize: 9, fontWeight: 700, color: '#fb923c', fontVariantNumeric: 'tabular-nums' }}>{simPct}%</span>
                                        </div>
                                      </TableCell>
                                      <TableCell sx={{ py: 1, px: 1 }}>
                                        <Chip
                                          label={meta.label.split(' · ')[0]}
                                          size="small"
                                          sx={{
                                            height: 14, fontSize: 8, fontWeight: 600,
                                            bgcolor: `${meta.color}18`, color: meta.color,
                                            border: `1px solid ${meta.color}35`,
                                            '& .MuiChip-label': { px: 0.75 },
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell sx={{ py: 1, px: 1, fontSize: 9, color: '#737373', maxWidth: 120 }}>
                                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {p.nombre_proveedor || '—'}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  </Tooltip>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Cola de Revisión Humana ───────────────────────────────── */}
            <div className="grid-stack-item" gs-x={0} gs-y={17} gs-w={12} gs-h={4}>
              <div className="grid-stack-item-content">
                <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-[13px] font-semibold text-white">Cola de Revisión Humana</span>
                      <Tooltip
                        title={<span style={{ fontSize: 11, lineHeight: 1.5 }}>Siniestros enviados a revisión humana con el analista asignado automáticamente por ramo.</span>}
                        placement="right" arrow
                        slotProps={{ tooltip: { sx: { bgcolor: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 2, maxWidth: 220, p: 1.5 } }, arrow: { sx: { color: '#1A1A1A' } } }}
                      >
                        <Info className="w-3 h-3 text-neutral-600 hover:text-neutral-400 cursor-help transition-colors" />
                      </Tooltip>
                    </div>
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      {cola.length} casos
                    </span>
                  </div>

                  {cola.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-neutral-600 text-xs">
                      No hay casos en revisión
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cola.map(item => (
                        <a
                          key={item.id_siniestro}
                          href={`/siniestros/${item.id_siniestro}`}
                          className="flex items-center gap-3 p-2.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#1E1E1E] hover:border-amber-500/20 rounded-xl transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-amber-400">
                              {item.revisor_nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono font-bold text-white truncate">{item.id_siniestro}</span>
                              {item.nivel_riesgo === 'Rojo Alto' && (
                                <span className="text-[9px] px-1 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded">Rojo</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-neutral-500 truncate">{item.revisor_nombre}</span>
                              <span className="text-[10px] text-neutral-700">·</span>
                              <span className="text-[10px] text-neutral-500">{item.ramo}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-[11px] font-bold text-white">{item.score_final ?? '—'}</div>
                            <div className="text-[9px] text-neutral-600">pts</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  <a
                    href="/siniestros?estado_revision=En+revisión"
                    className="flex items-center justify-center gap-1 mt-3 text-[10px] text-neutral-600 hover:text-amber-400 transition-colors"
                  >
                    Ver todos <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* ── Kanban Revisión por Revisor ─────────────────────────── */}
            <div className="grid-stack-item" gs-x={0} gs-y={21} gs-w={12} gs-h={6}>
              <div className="grid-stack-item-content">
                <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-2xl p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-[13px] font-semibold text-white">Tablero de Revisión · Por Analista</span>
                      <Tooltip
                        title={<span style={{ fontSize: 11, lineHeight: 1.5 }}>Casos en revisión agrupados por analista asignado. Aprueba, rechaza o reasigna sin salir del dashboard.</span>}
                        placement="right" arrow
                        slotProps={{ tooltip: { sx: { bgcolor: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 2, maxWidth: 220, p: 1.5 } }, arrow: { sx: { color: '#1A1A1A' } } }}
                      >
                        <Info className="w-3 h-3 text-neutral-600 hover:text-neutral-400 cursor-help transition-colors" />
                      </Tooltip>
                    </div>
                    <button
                      onClick={fetchKanban}
                      disabled={kanbanLoading}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1C1C1C] transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-neutral-500 ${kanbanLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="flex gap-3 overflow-x-auto flex-1 min-h-0 pb-1">
                    {kanban.map(col => (
                      <div
                        key={col.revisor.id_revisor}
                        className="flex-shrink-0 w-56 flex flex-col bg-[#141414] border border-[#1E1E1E] rounded-xl overflow-hidden"
                      >
                        <div className="px-3 py-2.5 border-b border-[#1E1E1E] bg-[#111] flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-[9px] font-bold text-amber-400">
                                  {col.revisor.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-white truncate">{col.revisor.nombre.split(' ')[0]}</p>
                                <p className="text-[9px] text-neutral-600 truncate">{col.revisor.especialidad}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              {col.casos.length}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                          {col.casos.length === 0 && (
                            <p className="text-[10px] text-neutral-700 text-center py-4">Sin casos asignados</p>
                          )}
                          {col.casos.map(card => {
                            const scoreColor = (card.score_final ?? 0) >= 70 ? '#ef4444'
                              : (card.score_final ?? 0) >= 40 ? '#eab308' : '#22c55e'
                            return (
                              <div key={card.id_siniestro} className="bg-[#1A1A1A] border border-[#252525] rounded-lg p-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <a
                                    href={`/siniestros/${card.id_siniestro}`}
                                    className="text-[10px] font-mono font-bold text-white hover:text-[#C8FF00] transition-colors truncate"
                                  >
                                    {card.id_siniestro}
                                  </a>
                                  <span className="text-[10px] font-bold flex-shrink-0" style={{ color: scoreColor }}>
                                    {card.score_final?.toFixed(0) ?? '—'}
                                  </span>
                                </div>
                                <div className="text-[9px] text-neutral-500 space-y-0.5">
                                  <p className="truncate">{card.ramo} · {card.ciudad ?? '—'}</p>
                                  <p>{card.dias_en_cola} día{card.dias_en_cola !== 1 ? 's' : ''} en cola</p>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleRevisionAccion(card.id_siniestro, 'aprobar')}
                                    className="flex-1 flex items-center justify-center gap-1 py-1 text-[9px] font-semibold bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 text-green-400 rounded transition-all"
                                  >
                                    <Check className="w-2.5 h-2.5" /> Aprobar
                                  </button>
                                  <button
                                    onClick={() => handleRevisionAccion(card.id_siniestro, 'rechazar')}
                                    className="flex-1 flex items-center justify-center gap-1 py-1 text-[9px] font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded transition-all"
                                  >
                                    <XCircle className="w-2.5 h-2.5" /> Rechazar
                                  </button>
                                </div>
                                <select
                                  defaultValue=""
                                  onChange={e => {
                                    if (e.target.value) {
                                      handleRevisionAccion(card.id_siniestro, 'reasignar', e.target.value)
                                      e.target.value = ''
                                    }
                                  }}
                                  className="w-full text-[9px] bg-[#111] border border-[#2A2A2A] text-neutral-500 rounded px-1.5 py-1 focus:outline-none focus:border-amber-500/40"
                                >
                                  <option value="">Reasignar a...</option>
                                  {revisores
                                    .filter(r => r.id_revisor !== col.revisor.id_revisor)
                                    .map(r => (
                                      <option key={r.id_revisor} value={r.id_revisor}>
                                        {r.nombre.split(' ')[0]} ({r.especialidad})
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <style>{`
          .grid-stack { background: transparent; }
          .grid-stack-item-content {
            background: transparent !important; border: none !important;
            border-radius: 0 !important; overflow: hidden; position: relative;
          }
          .ui-resizable-se {
            background: none; border-right: 2px solid #C8FF00; border-bottom: 2px solid #C8FF00;
            width: 10px; height: 10px; right: 4px; bottom: 4px; opacity: 0; transition: opacity 0.15s;
          }
          .grid-stack-item:hover .ui-resizable-se { opacity: 1; }
          .grid-stack-placeholder > .placeholder-content {
            background: rgba(200,255,0,0.07) !important;
            border: 1.5px dashed rgba(200,255,0,0.4) !important;
            border-radius: 16px !important;
          }
        `}</style>
      </div>
    </ThemeProvider>
  )
}
