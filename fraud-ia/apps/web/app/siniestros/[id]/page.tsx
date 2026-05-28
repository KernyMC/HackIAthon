'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Building2,
  FileText,
  MessageSquare,
  RefreshCw,
  Shield,
  Calendar,
  DollarSign,
  User,
  Car,
  Info,
  Bot,
  X,
  Send,
  UserCheck,
  Loader2,
} from 'lucide-react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge'
import { BarChart } from '@mui/x-charts/BarChart'
import { MarkdownContent } from '@/components/ui/markdown-content'
import { getSiniestro, chat, enviarARevision } from '@/lib/api'
import type { SiniestroDetail, RevisionResult } from '@/lib/types'
import { RiskBadge } from '@/components/ui/risk-badge'
import { formatMoney, formatScore, formatDate } from '@/lib/utils'

const darkTheme = createTheme({ palette: { mode: 'dark' } })

const RF_CODES: Record<string, { label: string; impact: string; isRojo: boolean }> = {
  'RF-01': { label: 'Cobertura Pérdida Total por Robo (PTxRB)',                   impact: 'Rojo automático',   isRojo: true  },
  'RF-02': { label: 'Falsificación o Adulteración Documental',                     impact: 'Rojo automático',   isRojo: true  },
  'RF-03': { label: 'Asegurado/Beneficiario/Proveedor en Lista Restrictiva',       impact: 'Rojo automático',   isRojo: true  },
  'RF-04': { label: 'Dinámica del Accidente Físicamente Imposible',                impact: 'Rojo automático',   isRojo: true  },
  'RF-05': { label: 'Siniestro al Borde de Vigencia (<48 horas)',                  impact: 'Amarillo mínimo',   isRojo: false },
  'RF-06': { label: 'Demora Atípica en Denuncia de Robo (>4 días)',                impact: 'Amarillo mínimo',   isRojo: false },
  'RF-07': { label: 'Narrativa Clonada o Idéntica (>85% similitud)',               impact: 'Amarillo mínimo',   isRojo: false },
}

function parseListField(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return (value as string[]).filter(Boolean)
  if (typeof value === 'string') return value.split('|').map(s => s.trim()).filter(Boolean)
  return []
}

export default function SiniestroDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()

  const [siniestro, setSiniestro] = useState<SiniestroDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // AI panel
  const [aiOpen, setAiOpen]       = useState(false)
  const [aiAnswer, setAiAnswer]   = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [followUp, setFollowUp]   = useState('')
  const [followLoading, setFollowLoading] = useState(false)
  const [messages, setMessages]   = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const sessionId = useRef(`detail-${id}-${Date.now()}`)
  const aiBottomRef = useRef<HTMLDivElement>(null)

  const [showRevModal, setShowRevModal] = useState(false)
  const [revLoading, setRevLoading]     = useState(false)
  const [revResult, setRevResult]       = useState<RevisionResult | null>(null)
  const [revError, setRevError]         = useState<string | null>(null)

  const handleEnviarRevision = async () => {
    setRevLoading(true)
    setRevError(null)
    try {
      const res = await enviarARevision(id)
      setRevResult(res)
    } catch (err: unknown) {
      setRevError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setRevLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getSiniestro(id)
      .then(setSiniestro)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiLoading])

  const handleExplainWithAI = async () => {
    if (!id) return
    setAiOpen(true)
    setAiLoading(true)
    setAiAnswer(null)
    setMessages([])
    try {
      const resp = await chat(sessionId.current, `Explica el siniestro ${id} detalladamente: ¿por qué tiene este nivel de riesgo, qué reglas activó y qué debe revisar el analista?`)
      setAiAnswer(resp.answer)
      setMessages([{ role: 'assistant', content: resp.answer }])
    } catch {
      const err = 'Error al consultar el agente IA. Por favor intente de nuevo.'
      setAiAnswer(err)
      setMessages([{ role: 'assistant', content: err }])
    } finally {
      setAiLoading(false)
    }
  }

  const handleFollowUp = async () => {
    const t = followUp.trim()
    if (!t || followLoading) return
    setFollowUp('')
    setFollowLoading(true)
    setMessages(m => [...m, { role: 'user', content: t }])
    try {
      const resp = await chat(sessionId.current, t)
      setMessages(m => [...m, { role: 'assistant', content: resp.answer }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Error al consultar.' }])
    } finally {
      setFollowLoading(false)
    }
  }

  const closeAiPanel = () => {
    setAiOpen(false)
    setAiAnswer(null)
    setMessages([])
  }

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#111111]">
      <RefreshCw className="w-6 h-6 text-[#C8FF00] animate-spin mr-3" />
      <p className="text-neutral-500">Cargando siniestro...</p>
    </div>
  )

  if (error || !siniestro) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#111111] gap-4">
      <AlertTriangle className="w-10 h-10 text-red-400" />
      <p className="text-white font-semibold text-lg">No se pudo cargar el siniestro</p>
      <p className="text-neutral-500">{error}</p>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1C] text-neutral-300 rounded-xl hover:bg-[#242424] border border-[#2A2A2A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>
    </div>
  )

  const s              = siniestro
  const alertas        = parseListField(s.alertas_activadas)
  const reglasCriticas = parseListField(s.reglas_criticas_activadas)
  const documentos     = s.documentos || []
  const scoreNum       = Number(s.score_final) || 0
  const scoreColor     = scoreNum >= 70 ? '#ef4444' : scoreNum >= 40 ? '#eab308' : '#22c55e'

  return (
    <div className={`flex bg-[#111111] animate-fade-in ${aiOpen ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>

      {/* ══ LEFT: Siniestro data ════════════════════════════════════════════ */}
      <div className={`${aiOpen ? 'flex-[3] overflow-y-auto' : 'flex-1'} p-8`}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-600 hover:text-white mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a siniestros</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-1">Caso</p>
              <h1 className="text-4xl font-bold text-white font-mono leading-none">{s.id_siniestro}</h1>
              <p className="text-neutral-500 mt-1.5">{s.ramo} · {s.cobertura} · {s.ciudad}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Botón enviar a revisión */}
              {siniestro?.estado_revision !== 'En revisión' ? (
                <button
                  onClick={() => setShowRevModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 rounded-lg transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Enviar a revisión humana
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg">
                  <UserCheck className="w-3.5 h-3.5" />
                  En revisión humana
                </span>
              )}
              <RiskBadge nivel={s.nivel_riesgo} className="text-sm px-3 py-1.5" />
              <button
                onClick={aiOpen ? closeAiPanel : handleExplainWithAI}
                disabled={aiLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#C8FF00] hover:bg-[#d4ff33] disabled:opacity-60 text-black font-bold rounded-xl transition-colors cursor-pointer"
              >
                {aiLoading
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : aiOpen
                    ? <X className="w-4 h-4" />
                    : <MessageSquare className="w-4 h-4" />
                }
                {aiOpen ? 'Cerrar IA' : 'Explicar con IA'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Score Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">

          {/* Gauge */}
          <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5 flex flex-col items-center justify-center">
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-2">Score Final</p>
            <ThemeProvider theme={darkTheme}>
              <Gauge
                value={scoreNum}
                valueMin={0}
                valueMax={100}
                startAngle={-110}
                endAngle={110}
                innerRadius="68%"
                outerRadius="100%"
                cornerRadius="50%"
                width={180}
                height={130}
                text={({ value }) => `${value}`}
                sx={{
                  [`& .${gaugeClasses.valueText}`]: {
                    fontSize: 36,
                    fontWeight: 900,
                    fill: scoreColor,
                  },
                  [`& .${gaugeClasses.valueArc}`]: { fill: scoreColor },
                  [`& .${gaugeClasses.referenceArc}`]: { fill: '#2A2A2A' },
                }}
              />
            </ThemeProvider>
            <p className="text-xs text-neutral-700 -mt-1">/ 100 pts</p>
          </div>

          {/* Desglose con BarChart */}
          <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-1">Desglose del score</p>
            <div className="flex justify-between text-[10px] text-neutral-600 mb-0 px-1">
              <span>Score final = 60% reglas + 40% modelo</span>
            </div>
            <ThemeProvider theme={darkTheme}>
              <BarChart
                layout="horizontal"
                height={130}
                margin={{ left: 95, right: 40, top: 12, bottom: 24 }}
                yAxis={[{
                  scaleType: 'band',
                  data: ['Reglas (×0.6)', 'Modelo (×0.4)'],
                  tickLabelStyle: { fontSize: 11, fill: '#888' },
                }]}
                xAxis={[{ min: 0, max: 100, tickLabelStyle: { fontSize: 10, fill: '#666' } }]}
                series={[{
                  data: [Number(s.score_reglas) || 0, Number(s.score_modelo_simulado) || 0],
                  barLabel: ({ value }) => value != null ? `${value}` : '',
                  color: scoreColor,
                }]}
                borderRadius={6}
                grid={{ vertical: true }}
                sx={{
                  '& .MuiChartsGrid-line': { stroke: '#2A2A2A' },
                  '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: '#333' },
                  '& .MuiBarLabel-root': { fill: '#fff', fontWeight: 700, fontSize: 12 },
                }}
              />
            </ThemeProvider>
            <div className="flex justify-between text-xs px-1 mt-1">
              <span className="text-neutral-500">Score final</span>
              <span className="font-black text-base" style={{ color: scoreColor }}>{formatScore(s.score_final)}</span>
            </div>
          </div>

          {/* Acción sugerida */}
          <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-6">
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-3">Acción sugerida</p>
            <div className="flex items-start gap-2.5 mt-2">
              <Shield className="w-5 h-5 text-[#C8FF00] flex-shrink-0 mt-0.5" />
              <p className="text-neutral-300 leading-relaxed">{s.accion_sugerida || 'Sin acción registrada'}</p>
            </div>
            <p className="text-xs text-neutral-700 mt-4 italic">Decisión final a cargo del analista humano</p>
          </div>
        </div>

        {/* ── Alertas + Reglas ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h2 className="font-bold text-white">Alertas activadas ({alertas.length})</h2>
            </div>
            {alertas.length === 0 ? (
              <p className="text-neutral-600">Sin alertas activadas</p>
            ) : (
              <ul className="space-y-2">
                {alertas.map((alerta, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-neutral-300">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                    {alerta}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-red-400" />
              <h2 className="font-bold text-white">Reglas críticas ({reglasCriticas.length})</h2>
            </div>
            {reglasCriticas.length === 0 ? (
              <p className="text-neutral-600">Sin reglas críticas activadas</p>
            ) : (
              <ul className="space-y-3">
                {reglasCriticas.map((regla, i) => {
                  const info = RF_CODES[regla]
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${info?.isRojo ? 'bg-red-400' : 'bg-yellow-400'}`} />
                      <div>
                        <span className="font-mono font-bold text-neutral-300">{regla}</span>
                        {info && (
                          <>
                            <span className="text-neutral-600 mx-2">—</span>
                            <span className="text-neutral-300">{info.label}</span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${info.isRojo ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                              {info.impact}
                            </span>
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Detail cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            {
              icon: DollarSign, label: 'Montos', accent: '#C8FF00',
              rows: [
                { k: 'Reclamado', v: formatMoney(s.monto_reclamado) },
                { k: 'Estimado',  v: formatMoney(s.monto_estimado)  },
                { k: 'Pagado',    v: formatMoney(s.monto_pagado)    },
                { k: 'Suma aseg.',v: formatMoney(s.suma_asegurada)  },
              ],
            },
            {
              icon: Calendar, label: 'Fechas', accent: '#C8FF00',
              rows: [
                { k: 'Ocurrencia',    v: formatDate(s.fecha_ocurrencia) },
                { k: 'Reporte',       v: formatDate(s.fecha_reporte)    },
                { k: 'Días ocur→rep', v: String(s.dias_entre_ocurrencia_reporte ?? '-'), warn: s.dias_entre_ocurrencia_reporte > 7  },
                { k: 'Días inicio',   v: String(s.dias_desde_inicio_poliza ?? '-'),      danger: s.dias_desde_inicio_poliza < 30 },
              ],
            },
            {
              icon: Building2, label: 'Proveedor', accent: '#FF6500',
              rows: [
                { k: 'Nombre',      v: s.nombre_proveedor || s.id_proveedor || '-' },
                { k: 'Tipo',        v: s.tipo_proveedor || '-'                     },
                { k: 'Lista rest.', v: s.en_lista_restrictiva ? '⚠ Sí' : 'No', danger: s.en_lista_restrictiva },
              ],
            },
            {
              icon: FileText, label: 'Póliza', accent: '#C8FF00',
              rows: [
                { k: 'ID',    v: s.id_poliza || '-'       },
                { k: 'Inicio',v: formatDate(s.fecha_inicio) },
                { k: 'Canal', v: s.canal_venta || '-'     },
              ],
            },
          ].map(({ icon: Icon, label, accent, rows }) => (
            <div key={label} className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
                <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest">{label}</p>
              </div>
              <div className="space-y-2.5">
                {rows.map(({ k, v, warn, danger }: { k: string; v: string; warn?: boolean; danger?: boolean }) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-neutral-600 text-sm">{k}</span>
                    <span className={`font-semibold text-sm truncate ${danger ? 'text-red-400' : warn ? 'text-yellow-400' : 'text-neutral-300'}`}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Historial ────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-neutral-600" />
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Historial de siniestros previos</p>
          </div>
          <p className="text-[10px] text-neutral-700 mb-1 ml-6">Número de siniestros registrados antes del caso actual. Valores en amarillo superan el umbral de alerta.</p>
          <ThemeProvider theme={darkTheme}>
            <BarChart
              layout="horizontal"
              height={140}
              margin={{ left: 110, right: 60, top: 8, bottom: 24 }}
              yAxis={[{
                scaleType: 'band',
                data: ['Asegurado', 'Vehículo', 'Conductor'],
                tickLabelStyle: { fontSize: 12, fill: '#888' },
              }]}
              xAxis={[{
                min: 0,
                tickLabelStyle: { fontSize: 10, fill: '#666' },
                tickNumber: 5,
              }]}
              series={[{
                data: [
                  s.historial_siniestros_asegurado ?? 0,
                  s.historial_siniestros_vehiculo  ?? 0,
                  s.historial_siniestros_conductor ?? 0,
                ],
                barLabel: ({ value }) => value != null ? `${value} siniest.` : '',
                colorMap: {
                  type: 'piecewise',
                  thresholds: [2, 3],
                  colors: ['#22c55e', '#eab308', '#ef4444'],
                },
              }]}
              borderRadius={8}
              grid={{ vertical: true }}
              sx={{
                '& .MuiChartsGrid-line': { stroke: '#2A2A2A' },
                '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: '#333' },
                '& .MuiBarLabel-root': { fill: '#fff', fontWeight: 600, fontSize: 11 },
              }}
            />
          </ThemeProvider>
        </div>

        {/* ── Narrativa ────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-neutral-600" />
            <h2 className="font-bold text-white">Narrativa del reclamo</h2>
            <span className="text-xs text-neutral-700">(datos sintéticos)</span>
          </div>
          <p className="text-neutral-400 leading-relaxed">{s.descripcion || 'Sin descripción registrada.'}</p>
        </div>

        {/* ── Documentos ───────────────────────────────────────────────────── */}
        {documentos.length > 0 && (
          <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] overflow-hidden mb-4">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-[#222]">
              <FileText className="w-5 h-5 text-neutral-600" />
              <h2 className="font-bold text-white">Documentos ({documentos.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#191919] border-b border-[#222]">
                    {['Tipo documento', 'Entregado', 'Legible', 'Inconsistencia', 'Observación'].map(h => (
                      <th key={h} className="text-left py-3 px-5 text-xs font-bold text-neutral-600 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documentos.map(doc => (
                    <tr key={doc.id_documento} className="border-b border-[#1E1E1E] hover:bg-[#1E1E1E] transition-colors">
                      <td className="py-3 px-5 text-neutral-300 font-medium">{doc.tipo_documento}</td>
                      <td className="py-3 px-5">
                        {doc.entregado   ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                      </td>
                      <td className="py-3 px-5">
                        {doc.legible     ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                      </td>
                      <td className="py-3 px-5">
                        {doc.inconsistencia_detectada
                          ? <span className="text-sm text-red-400 font-semibold">Detectada</span>
                          : <span className="text-sm text-neutral-700">—</span>
                        }
                      </td>
                      <td className="py-3 px-5 text-neutral-500 text-sm">{doc.observacion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ══ RIGHT: AI panel (2/5) ══════════════════════════════════════════ */}
      {aiOpen && (
        <div className="flex-[2] border-l border-[#2A2A2A] bg-[#0d0d0d] flex flex-col h-full overflow-hidden">

          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-[#0f0f0f] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#C8FF00]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Explicación del Agente IA</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">FraudSweep · {s.id_siniestro}</p>
              </div>
              {aiLoading && <RefreshCw className="w-3.5 h-3.5 text-[#C8FF00] animate-spin" />}
            </div>
            <button
              onClick={closeAiPanel}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1C1C1C] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-neutral-500 hover:text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {aiLoading && messages.length === 0 && (
              <div className="flex items-center gap-3 text-neutral-500">
                <RefreshCw className="w-4 h-4 animate-spin text-[#C8FF00]" />
                <span className="text-sm">Consultando al agente...</span>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-neutral-600 uppercase tracking-wider px-1">
                  {m.role === 'user' ? 'Analista' : 'Agente IA'}
                </span>
                {m.role === 'user' ? (
                  <div className="max-w-[90%] bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] px-4 py-2.5 rounded-xl rounded-tr-sm text-sm leading-relaxed">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[95%] bg-[#1a1a1a] border border-[#252525] px-4 py-3 rounded-xl rounded-tl-sm overflow-hidden">
                    <MarkdownContent content={m.content} className="text-sm" />
                  </div>
                )}
              </div>
            ))}

            {followLoading && (
              <div className="flex items-center gap-2 text-neutral-500">
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-1.5 h-1.5 bg-[#C8FF00] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <span className="text-xs">Analizando...</span>
              </div>
            )}
            <div ref={aiBottomRef} />
          </div>

          {/* Follow-up input */}
          {!aiLoading && aiAnswer && (
            <div className="flex-shrink-0 p-4 border-t border-[#2A2A2A] bg-[#0f0f0f]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFollowUp() } }}
                  placeholder="Pregunta de seguimiento..."
                  disabled={followLoading}
                  className="flex-1 bg-[#1C1C1C] text-white text-sm px-4 py-2.5 rounded-xl border border-[#2A2A2A] focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600 transition-colors"
                />
                <button
                  onClick={handleFollowUp}
                  disabled={followLoading || !followUp.trim()}
                  className="w-10 h-10 bg-[#C8FF00] hover:bg-[#d4ff33] disabled:bg-[#1C1C1C] disabled:text-neutral-700 text-black rounded-xl flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal revisión humana */}
      {showRevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Enviar a revisión humana</h3>
                <p className="text-xs text-neutral-400">Se asignará automáticamente por ramo</p>
              </div>
            </div>

            {!revResult ? (
              <>
                <p className="text-xs text-neutral-300 mb-5">
                  El siniestro <span className="font-mono text-[#C8FF00]">{id}</span> pasará
                  a estado <strong className="text-amber-400">En revisión</strong> y se asignará
                  a un analista según el ramo <strong className="text-white">{siniestro?.ramo}</strong>.
                </p>
                {revError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
                    {revError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRevModal(false)}
                    className="flex-1 py-2 text-xs text-neutral-400 hover:text-white border border-[#2A2A2A] hover:border-[#3A3A3A] rounded-lg transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEnviarRevision}
                    disabled={revLoading}
                    className="flex-1 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 text-black disabled:text-amber-800 rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    {revLoading ? <><Loader2 className="w-3 h-3 animate-spin" />Asignando...</> : 'Confirmar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-4">
                  <p className="text-xs text-amber-400 font-semibold mb-2">✓ Asignado correctamente</p>
                  <p className="text-xs text-neutral-300"><span className="text-neutral-500">Revisor:</span> {revResult.revisor.nombre}</p>
                  <p className="text-xs text-neutral-300"><span className="text-neutral-500">Especialidad:</span> {revResult.revisor.especialidad}</p>
                  <p className="text-xs text-neutral-300"><span className="text-neutral-500">Casos activos:</span> {revResult.revisor.casos_activos}</p>
                </div>
                <button
                  onClick={() => { setShowRevModal(false); setRevResult(null) }}
                  className="w-full py-2 text-xs font-semibold bg-[#C8FF00] text-black rounded-lg hover:bg-[#d4ff33] transition-all"
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
