'use client'

import * as React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
import { lineClasses } from '@mui/x-charts/LineChart'
import { chartsAxisHighlightClasses } from '@mui/x-charts/ChartsAxisHighlight'
import { PieChart, pieClasses } from '@mui/x-charts/PieChart'
import { useDrawingArea } from '@mui/x-charts/hooks'
import { styled } from '@mui/material/styles'
import { BarChart } from '@mui/x-charts/BarChart'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { getKpis, getSiniestros } from '@/lib/api'
import type { KPIs, Siniestro } from '@/lib/types'
import { formatScore } from '@/lib/utils'

// ── Dark MUI theme ──────────────────────────────────────────────────────────
const dark = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#111111', paper: '#1C1C1C' },
    text: { primary: '#fff', secondary: '#888' },
  },
})

// ── Gauge center label ──────────────────────────────────────────────────────
function GaugeCenter({ value }: { value: number }) {
  const { width, height, left, top } = useDrawingArea()
  return (
    <>
      <text x={left + width / 2} y={top + height / 2 - 12}
        textAnchor="middle" dominantBaseline="central"
        style={{ fill: '#C8FF00', fontSize: 30, fontWeight: 700 }}>
        {value}
      </text>
      <text x={left + width / 2} y={top + height / 2 + 14}
        textAnchor="middle" dominantBaseline="central"
        style={{ fill: '#666', fontSize: 11 }}>
        / 100 pts.
      </text>
    </>
  )
}

// ── Pie center label ────────────────────────────────────────────────────────
const StyledPieLabel = styled('text')(() => ({
  fill: '#666', textAnchor: 'middle', dominantBaseline: 'central', fontSize: 11,
}))
function PieCenterLabel({ children }: { children: React.ReactNode }) {
  const { width, height, left, top } = useDrawingArea()
  return <StyledPieLabel x={left + width / 2} y={top + height / 2}>{children}</StyledPieLabel>
}

// ── Static sections ─────────────────────────────────────────────────────────
const stackSections = [
  { title: 'Frontend',        color: '#3b82f6', items: ['Next.js 15 + TypeScript','Tailwind CSS dark','TanStack Table','MUI X Charts v9','shadcn/ui'] },
  { title: 'Backend API',     color: '#a855f7', items: ['Python 3.11 + FastAPI','SQLAlchemy 2.x ORM','psycopg 3','Pydantic v2','Uvicorn ASGI'] },
  { title: 'Agente IA',       color: '#22c55e', items: ['Google ADK','Gemini 2.5 Flash','7 function tools','RAG + SQL','Español nativo'] },
  { title: 'Infraestructura', color: '#FF6500', items: ['AlloyDB PostgreSQL 16','vector 768d','Cloud Run (x2)','Artifact Registry','Secret Manager'] },
]
const agentTools = [
  { name: 'buscar_conocimiento_negocio',                type: 'RAG',     desc: 'Base vectorial: reglas, glosario, ética' },
  { name: 'listar_siniestros_mayor_riesgo',             type: 'SQL',     desc: 'Top N por score_final con alertas' },
  { name: 'explicar_siniestro',                         type: 'SQL+RAG', desc: 'Detalle completo + docs + proveedor' },
  { name: 'analizar_proveedores_alertas',               type: 'SQL',     desc: 'Ranking por concentración de Rojo Alto' },
  { name: 'listar_documentos_faltantes_casos_criticos', type: 'SQL',     desc: 'Docs faltantes en casos críticos' },
  { name: 'listar_casos_cerca_inicio_poliza',           type: 'SQL',     desc: 'Siniestros en primeros 90 días' },
  { name: 'generar_resumen_ejecutivo',                  type: 'SQL',     desc: 'KPIs + top casos + recomendaciones' },
]

// ── Custom Heatmap ───────────────────────────────────────────────────────────
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
      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `60px repeat(${ciudades.length}, 1fr)`, width: '100%' }}>
        <div />
        {ciudades.map(c => (
          <div key={c} className="text-[9px] text-neutral-500 text-center truncate px-0.5 pb-1">{c}</div>
        ))}
        {ramos.map((ramo, ry) => (
          <React.Fragment key={ramo}>
            <div className="text-[9px] text-neutral-500 flex items-center truncate pr-1">{ramo.slice(0, 14)}</div>
            {ciudades.map((_, cx) => {
              const cell = data.find(d => d.x === cx && d.y === ry)
              const v = cell?.v ?? 0
              return (
                <div
                  key={`${cx}-${ry}`}
                  className="rounded flex items-center justify-center text-[10px] font-bold"
                  style={{ height: 38, background: v > 0 ? getColor(v) : '#1A1A1A', color: '#fff', opacity: v > 0 ? 0.85 : 0.4 }}
                  title={`${ramo} · ${ciudades[cx]}: ${v}`}
                >
                  {v > 0 ? v : '—'}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-2">
        <div className="w-14 h-2 rounded" style={{ background: 'linear-gradient(to right, #22c55e, #ef4444)' }} />
        <span className="text-[9px] text-neutral-600">Score bajo → alto</span>
      </div>
    </div>
  )
}

const NIVEL_COLORS: Record<string, string> = {
  'Verde Bajo': '#22c55e', 'Amarillo Medio': '#eab308', 'Rojo Alto': '#ef4444',
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function ArquitecturaPage() {
  const [kpis, setKpis]           = React.useState<KPIs | null>(null)
  const [siniestros, setSiniestros] = React.useState<Siniestro[]>([])
  const [loading, setLoading]     = React.useState(true)
  const [error, setError]         = React.useState<string | null>(null)
  const [semIdx, setSemIdx]       = React.useState<number | null>(null)

  React.useEffect(() => {
    Promise.all([getKpis(), getSiniestros({ limit: 1000, offset: 0 })])
      .then(([k, s]) => { setKpis(k); setSiniestros(s.items) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // ── Derived data ──────────────────────────────────────────────────────────

  // Monthly groups for SparkLine + RadialBar
  const monthlyGroups = React.useMemo(() => {
    const map: Record<string, { total: number; rojos: number; amarillos: number; verdes: number }> = {}
    siniestros.forEach(s => {
      const m = s.fecha_ocurrencia?.slice(0, 7)
      if (!m) return
      if (!map[m]) map[m] = { total: 0, rojos: 0, amarillos: 0, verdes: 0 }
      map[m].total++
      if (s.nivel_riesgo === 'Rojo Alto')      map[m].rojos++
      else if (s.nivel_riesgo === 'Amarillo Medio') map[m].amarillos++
      else                                      map[m].verdes++
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
  }, [siniestros])

  const monthLabels   = monthlyGroups.map(([m]) => m.replace('-', '/'))
  const monthTotals   = monthlyGroups.map(([, v]) => v.total)
  const monthRojos    = monthlyGroups.map(([, v]) => v.rojos)
  const monthAmarillos = monthlyGroups.map(([, v]) => v.amarillos)
  const monthVerdes   = monthlyGroups.map(([, v]) => v.verdes)

  // Nested Pie: inner = nivel riesgo, outer = ramo within each nivel
  const { innerPie, outerPie } = React.useMemo(() => {
    if (!kpis) return { innerPie: [], outerPie: [] }
    const innerPie = [
      { id: 'verde',    label: 'Verde Bajo',    value: kpis.casos_verdes,    color: '#22c55e' },
      { id: 'amarillo', label: 'Amarillo Medio', value: kpis.casos_amarillos, color: '#eab308' },
      { id: 'rojo',     label: 'Rojo Alto',     value: kpis.casos_rojos,     color: '#ef4444' },
    ]
    // Count siniestros by ramo within each nivel
    const ramoByNivel: Record<string, Record<string, number>> = {
      'Verde Bajo': {}, 'Amarillo Medio': {}, 'Rojo Alto': {},
    }
    siniestros.forEach(s => {
      if (!ramoByNivel[s.nivel_riesgo]) return
      ramoByNivel[s.nivel_riesgo][s.ramo] = (ramoByNivel[s.nivel_riesgo][s.ramo] ?? 0) + 1
    })
    const shades: Record<string, string[]> = {
      'Verde Bajo':    ['#16a34a','#15803d','#166534','#14532d'],
      'Amarillo Medio': ['#ca8a04','#a16207','#854d0e','#713f12'],
      'Rojo Alto':     ['#dc2626','#b91c1c','#991b1b','#7f1d1d'],
    }
    let shadeIdx: Record<string, number> = {}
    const outerPie = (Object.entries(ramoByNivel) as [string, Record<string, number>][]).flatMap(([nivel, ramos]) => {
      shadeIdx[nivel] = 0
      return Object.entries(ramos)
        .sort(([, a], [, b]) => b - a).slice(0, 3)
        .map(([ramo, count]) => ({
          id: `${nivel}-${ramo}`,
          label: ramo,
          value: count,
          color: shades[nivel]?.[shadeIdx[nivel]++] ?? '#333',
        }))
    })
    return { innerPie, outerPie }
  }, [kpis, siniestros])

  // Heatmap: score_promedio by top5 ciudades × top4 ramos
  const heatmapData = React.useMemo(() => {
    if (!siniestros.length) return { ciudades: [], ramos: [], data: [] }
    const ciudadCount: Record<string, number> = {}
    const ramoCount: Record<string, number> = {}
    siniestros.forEach(s => {
      if (s.ciudad) ciudadCount[s.ciudad] = (ciudadCount[s.ciudad] ?? 0) + 1
      if (s.ramo)   ramoCount[s.ramo]     = (ramoCount[s.ramo] ?? 0) + 1
    })
    const ciudades = Object.entries(ciudadCount).sort(([, a], [, b]) => b - a).slice(0, 5).map(([c]) => c)
    const ramos    = Object.entries(ramoCount).sort(([, a], [, b]) => b - a).slice(0, 4).map(([r]) => r)
    const scoreMap: Record<string, number[]> = {}
    siniestros.forEach(s => {
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
  }, [siniestros])

  // Ramos por % Rojo Alto — datos reales
  const ramoRisk = React.useMemo(() => {
    const map: Record<string, { total: number; rojos: number }> = {}
    siniestros.forEach(s => {
      if (!s.ramo) return
      if (!map[s.ramo]) map[s.ramo] = { total: 0, rojos: 0 }
      map[s.ramo].total++
      if (s.nivel_riesgo === 'Rojo Alto') map[s.ramo].rojos++
    })
    return Object.entries(map)
      .map(([ramo, { total, rojos }]) => ({
        ramo, total, rojos,
        pctRojo: total > 0 ? Math.round((rojos / total) * 100) : 0,
      }))
      .sort((a, b) => b.pctRojo - a.pctRojo)
      .slice(0, 6)
  }, [siniestros])

  const highlightScope = { highlight: 'item', fade: 'global' } as const

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#111111]">
      <RefreshCw className="w-6 h-6 text-[#C8FF00] animate-spin mr-3" />
      <p className="text-neutral-500 text-sm">Cargando datos...</p>
    </div>
  )
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#111111] gap-3">
      <AlertTriangle className="w-8 h-8 text-red-400" />
      <p className="text-neutral-400 text-sm">{error}</p>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={dark}>
      <div className="p-8 bg-[#111111] min-h-screen max-w-6xl">

        {/* Header */}
        <div className="mb-7">
          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-1">Sistema</p>
          <h1 className="text-4xl font-bold text-white leading-none">ESTADÍSTICAS & ARQUITECTURA</h1>
          <p className="text-neutral-500 text-sm mt-1">
            FraudIA Claims Assistant · {kpis?.total_siniestros.toLocaleString('es-EC')} siniestros analizados
          </p>
        </div>

        {/* ── ROW 1: Gauge · SparkLine · Nested Pie ─────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-4">

          {/* Gauge — score promedio real */}
          <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
            <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider mb-1">
              Score Promedio del Sistema
            </p>
            <Gauge
              value={kpis ? Math.round(kpis.score_promedio) : 0}
              startAngle={-110}
              endAngle={110}
              height={185}
              sx={{
                [`& .${gaugeClasses.valueArc}`]: { fill: '#eab308' },
                [`& .${gaugeClasses.referenceArc}`]: { fill: '#2A2A2A' },
              }}
            >
              <GaugeCenter value={kpis ? Math.round(kpis.score_promedio) : 0} />
            </Gauge>
            <p className="text-center text-[11px] text-neutral-500 -mt-2">
              {kpis && kpis.score_promedio >= 70 ? 'Nivel Rojo · escalar' :
               kpis && kpis.score_promedio >= 40 ? 'Nivel Amarillo · revisión' :
               'Nivel Verde · flujo normal'}
            </p>
          </div>

          {/* SparkLine — siniestros por mes (datos reales) */}
          <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5 flex flex-col">
            <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider mb-3">
              Siniestros · tendencia mensual
            </p>
            <div
              role="button" tabIndex={0} className="outline-none flex-1 flex flex-col justify-between"
              onKeyDown={e => {
                if (e.key === 'ArrowLeft') setSemIdx(p => p === null ? monthLabels.length - 1 : (monthLabels.length + p - 1) % monthLabels.length)
                if (e.key === 'ArrowRight') setSemIdx(p => p === null ? 0 : (p + 1) % monthLabels.length)
              }}
              onFocus={() => setSemIdx(p => p ?? 0)}
            >
              <div>
                <p className="text-neutral-500 text-xs mb-0.5">
                  {semIdx === null ? 'Últimos 12 meses' : monthLabels[semIdx]}
                </p>
                <div className="flex items-end justify-between border-b border-[#eab308]/25 pb-2 mb-3">
                  <span className="text-2xl font-bold text-white">
                    {monthTotals[semIdx ?? monthTotals.length - 1] ?? 0}
                    <span className="text-xs text-neutral-500 ml-1">casos</span>
                  </span>
                  <SparkLineChart
                    data={monthTotals}
                    height={52}
                    width={160}
                    area showHighlight
                    color="#eab308"
                    onHighlightedAxisChange={items => setSemIdx(items[0]?.dataIndex ?? null)}
                    highlightedAxis={semIdx === null ? [] : [{ axisId: 'mes-axis', dataIndex: semIdx }]}
                    xAxis={{ id: 'mes-axis', data: monthLabels }}
                    yAxis={{ domainLimit: (_, max) => ({ min: -max / 6, max }) }}
                    axisHighlight={{ x: 'line' }}
                    margin={{ bottom: 0, top: 4, left: 4, right: 0 }}
                    baseline="min"
                    sx={{
                      [`& .${lineClasses.area}`]: { opacity: 0.15 },
                      [`& .${lineClasses.line}`]: { strokeWidth: 2.5 },
                      [`& .${chartsAxisHighlightClasses.root}`]: {
                        stroke: '#eab308', strokeDasharray: 'none', strokeWidth: 1.5,
                      },
                    }}
                    slotProps={{ lineHighlight: { r: 4 } }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-[11px] text-neutral-500">
                    Rojos: <span className="text-red-400 font-semibold">
                      {monthRojos[semIdx ?? monthRojos.length - 1] ?? 0}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-[11px] text-neutral-500">
                    Amarillos: <span className="text-yellow-400 font-semibold">
                      {monthAmarillos[semIdx ?? monthAmarillos.length - 1] ?? 0}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nested Pie — distribución riesgo × ramo (datos reales) */}
          <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
            <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider mb-1">
              Riesgo × Ramo
            </p>
            <PieChart
              series={[
                {
                  innerRadius: 45, outerRadius: 88,
                  data: innerPie,
                  highlightScope: { fade: 'global', highlight: 'item' },
                  cornerRadius: 3, paddingAngle: 2,
                  arcLabel: item => `${Math.round((item.value / (kpis?.total_siniestros ?? 1)) * 100)}%`,
                },
                {
                  innerRadius: 93, outerRadius: 113,
                  data: outerPie,
                  highlightScope: { fade: 'global', highlight: 'item' },
                  cornerRadius: 2, paddingAngle: 1,
                },
              ]}
              sx={{ [`& .${pieClasses.arcLabel}`]: { fontSize: 10, fill: '#fff' } }}
              height={220}
              hideLegend
            >
              <PieCenterLabel>{kpis?.total_siniestros ?? '...'}{'\n'}casos</PieCenterLabel>
            </PieChart>
            <div className="flex justify-center gap-3 mt-1">
              {innerPie.map(d => (
                <div key={d.id} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-[10px] text-neutral-500">{d.label.split(' ')[0]}</span>
                  <span className="text-[10px] font-semibold" style={{ color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 2: Heatmap · Funnel ───────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-4">

          {/* Heatmap — score promedio real por ciudad × ramo */}
          <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
            <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider mb-3">
              Score Promedio · Ciudad × Ramo
            </p>
            {heatmapData.ciudades.length > 0 && (
              <CustomHeatmap
                ciudades={heatmapData.ciudades}
                ramos={heatmapData.ramos}
                data={heatmapData.data}
              />
            )}
          </div>

          {/* Ramos por % Rojo Alto — datos reales */}
          <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
            <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider mb-3">
              Ramos · % Riesgo Rojo Alto (datos reales)
            </p>
            <div className="flex flex-col gap-3">
              {ramoRisk.map((r, i) => (
                <div key={r.ramo}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-neutral-600 w-3">{i + 1}</span>
                      <span className="text-[11px] text-white font-medium">{r.ramo}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-neutral-500">{r.rojos}/{r.total} casos</span>
                      <span className="text-[11px] font-bold w-10 text-right"
                        style={{ color: r.pctRojo >= 15 ? '#ef4444' : r.pctRojo >= 8 ? '#eab308' : '#22c55e' }}>
                        {r.pctRojo}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#2A2A2A] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${r.pctRojo}%`,
                        background: r.pctRojo >= 15 ? '#ef4444' : r.pctRojo >= 8 ? '#eab308' : '#22c55e',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 3: RadialBarChart — alertas mensuales reales ─────────── */}
        <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5 mb-5">
          <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider mb-3">
            Alertas por Nivel · distribución mensual (últimos {monthlyGroups.length} meses)
          </p>
          {monthTotals.length > 0 && (
            <BarChart
              xAxis={[{ scaleType: 'band', data: monthLabels, tickLabelStyle: { fill: '#555', fontSize: 9 } }]}
              yAxis={[{ tickLabelStyle: { fill: '#555', fontSize: 9 } }]}
              series={[
                { data: monthRojos,     label: 'Rojo Alto',      color: '#ef4444', stack: 'niveles', highlightScope },
                { data: monthAmarillos, label: 'Amarillo Medio', color: '#eab308', stack: 'niveles', highlightScope },
                { data: monthVerdes,    label: 'Verde Bajo',     color: '#22c55e', stack: 'niveles', highlightScope },
              ]}
              height={260}
              borderRadius={3}
              hideLegend
              sx={{
                '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: 'transparent' },
                '& .MuiChartsGrid-line': { stroke: '#222', strokeDasharray: '3 3' },
              }}
            />
          )}
        </div>

        {/* ── Stack + Agent Tools ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider mb-3">Stack Tecnológico</p>
            <div className="grid grid-cols-2 gap-2">
              {stackSections.map(s => (
                <div key={s.title} className="rounded-xl bg-[#191919] border border-[#2A2A2A] p-3">
                  <p className="text-xs font-bold mb-2" style={{ color: s.color }}>{s.title}</p>
                  <ul className="space-y-1">
                    {s.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider mb-3">Tools del Agente ADK</p>
            <div className="rounded-xl bg-[#191919] border border-[#2A2A2A] p-3 space-y-2.5">
              {agentTools.map(t => (
                <div key={t.name} className="flex items-start gap-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono flex-shrink-0 mt-0.5 ${
                    t.type === 'RAG'     ? 'bg-green-900/40  text-green-400  border border-green-800' :
                    t.type === 'SQL+RAG' ? 'bg-purple-900/40 text-purple-400 border border-purple-800' :
                    'bg-blue-900/40 text-blue-400 border border-blue-800'}`}>
                    {t.type}
                  </span>
                  <div>
                    <p className="text-[11px] font-mono text-white leading-tight">{t.name}</p>
                    <p className="text-[10px] text-neutral-600">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl bg-[#FF6500]/5 border border-[#FF6500]/20 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#FF6500] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-400 leading-relaxed">
            <span className="font-semibold text-[#FF6500]">Principio ético central:</span>{' '}
            FraudIA genera <strong className="text-white">alertas de revisión</strong>, nunca acusaciones.
            Ningún siniestro es rechazado automáticamente. Toda decisión final recae en analistas humanos calificados.
            Datos del demo 100% sintéticos.
          </p>
        </div>

      </div>
    </ThemeProvider>
  )
}
