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
  ChevronDown,
  Bot,
} from 'lucide-react'
import { MarkdownContent } from '@/components/ui/markdown-content'
import { getSiniestro, chat } from '@/lib/api'
import type { SiniestroDetail } from '@/lib/types'
import { RiskBadge } from '@/components/ui/risk-badge'
import { formatMoney, formatScore, formatDate } from '@/lib/utils'

const RF_CODES: Record<string, { label: string; impact: string; isRojo: boolean }> = {
  'RF-01': { label: 'Cobertura Pérdida Total por Robo (PTxRB)', impact: 'Rojo automático', isRojo: true },
  'RF-02': { label: 'Falsificación o Adulteración Documental', impact: 'Rojo automático', isRojo: true },
  'RF-03': { label: 'Asegurado/Beneficiario/Proveedor en Lista Restrictiva', impact: 'Rojo automático', isRojo: true },
  'RF-04': { label: 'Dinámica del Accidente Físicamente Imposible', impact: 'Rojo automático', isRojo: true },
  'RF-05': { label: 'Siniestro al Borde de Vigencia (<48 horas)', impact: 'Amarillo mínimo', isRojo: false },
  'RF-06': { label: 'Demora Atípica en Denuncia de Robo (>4 días)', impact: 'Amarillo mínimo', isRojo: false },
  'RF-07': { label: 'Narrativa Clonada o Idéntica (>85% similitud)', impact: 'Amarillo mínimo', isRojo: false },
}

function parseListField(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return (value as string[]).filter(Boolean)
  if (typeof value === 'string') return value.split('|').map(s => s.trim()).filter(Boolean)
  return []
}

export default function SiniestroDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [siniestro, setSiniestro] = useState<SiniestroDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiExpanded, setAiExpanded] = useState(false)
  const sessionId = useRef(`detail-${id}-${Date.now()}`)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getSiniestro(id)
      .then(setSiniestro)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleExplainWithAI = async () => {
    if (!id) return
    setAiLoading(true)
    setAiAnswer(null)
    try {
      const resp = await chat(sessionId.current, `Explica el siniestro ${id}`)
      setAiAnswer(resp.answer)
      setAiExpanded(true)
    } catch {
      setAiAnswer('Error al consultar el agente IA. Por favor intente de nuevo.')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111111]">
        <RefreshCw className="w-6 h-6 text-[#C8FF00] animate-spin mr-3" />
        <p className="text-neutral-500 text-sm">Cargando siniestro...</p>
      </div>
    )
  }

  if (error || !siniestro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#111111] gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-white font-semibold">No se pudo cargar el siniestro</p>
        <p className="text-neutral-500 text-sm">{error}</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1C] text-neutral-300 rounded-xl hover:bg-[#242424] border border-[#2A2A2A] transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>
    )
  }

  const s = siniestro
  const alertas = parseListField(s.alertas_activadas)
  const reglasCriticas = parseListField(s.reglas_criticas_activadas)
  const documentos = s.documentos || []
  const scoreNum = Number(s.score_final) || 0
  const scoreColor = scoreNum >= 70 ? '#ef4444' : scoreNum >= 40 ? '#eab308' : '#22c55e'

  return (
    <div className="p-8 animate-fade-in bg-[#111111] min-h-screen max-w-6xl">
      {/* Back + Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-600 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a siniestros
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-1">Caso</p>
            <h1
              className="text-3xl font-bold text-white font-mono leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {s.id_siniestro}
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              {s.ramo} · {s.cobertura} · {s.ciudad}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge nivel={s.nivel_riesgo} className="text-sm px-3 py-1" />
            <button
              onClick={handleExplainWithAI}
              disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#C8FF00] hover:bg-[#d4ff33] disabled:opacity-60 text-black font-semibold rounded-xl text-sm transition-colors"
            >
              {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              Explicar con IA
            </button>
          </div>
        </div>
      </div>

      {/* AI Answer — collapsible pill */}
      {(aiAnswer || aiLoading) && (
        <div className="mb-6 rounded-2xl border border-[#C8FF00]/20 bg-[#C8FF00]/5 overflow-hidden">
          <button
            onClick={() => setAiExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#C8FF00]/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#C8FF00]" />
              <span className="text-sm font-semibold text-[#C8FF00]">Explicación del Agente IA</span>
              {aiLoading && <RefreshCw className="w-3 h-3 text-[#C8FF00] animate-spin" />}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#C8FF00] transition-transform duration-200 ${aiExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          {aiExpanded && (
            <div className="px-5 pb-5 border-t border-[#C8FF00]/10">
              {aiLoading ? (
                <div className="flex items-center gap-2 text-neutral-500 text-sm pt-4">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Consultando al agente...
                </div>
              ) : (
                <div className="pt-4">
                  <MarkdownContent content={aiAnswer || ''} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Score Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5 flex flex-col items-center justify-center">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2 font-semibold">Score Final</p>
          <p className="text-5xl font-bold leading-none" style={{ color: scoreColor, fontFamily: 'var(--font-heading)' }}>
            {formatScore(s.score_final)}
          </p>
          <p className="text-xs text-neutral-700 mt-1">/ 100 puntos</p>
        </div>
        <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-3 font-semibold">Desglose</p>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Por reglas</span>
              <span className="font-semibold" style={{ color: Number(s.score_reglas) >= 70 ? '#ef4444' : Number(s.score_reglas) >= 40 ? '#eab308' : '#22c55e' }}>
                {formatScore(s.score_reglas)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Modelo simulado</span>
              <span className="font-semibold" style={{ color: Number(s.score_modelo_simulado) >= 70 ? '#ef4444' : Number(s.score_modelo_simulado) >= 40 ? '#eab308' : '#22c55e' }}>
                {formatScore(s.score_modelo_simulado)}
              </span>
            </div>
            <div className="h-px bg-[#2A2A2A]" />
            <div className="flex justify-between text-sm">
              <span className="text-white font-medium">Score final</span>
              <span className="font-bold" style={{ color: scoreColor }}>{formatScore(s.score_final)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2 font-semibold">Acción sugerida</p>
          <div className="flex items-start gap-2 mt-2">
            <Shield className="w-4 h-4 text-[#C8FF00] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-neutral-300 leading-relaxed">{s.accion_sugerida || 'Sin acción registrada'}</p>
          </div>
          <p className="text-xs text-neutral-700 mt-3 italic">Decisión final a cargo del analista humano</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h2 className="font-semibold text-white text-sm">Alertas activadas ({alertas.length})</h2>
          </div>
          {alertas.length === 0 ? (
            <p className="text-neutral-600 text-sm">Sin alertas activadas</p>
          ) : (
            <ul className="space-y-1.5">
              {alertas.map((alerta, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                  {alerta}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-red-400" />
            <h2 className="font-semibold text-white text-sm">Reglas críticas ({reglasCriticas.length})</h2>
          </div>
          {reglasCriticas.length === 0 ? (
            <p className="text-neutral-600 text-sm">Sin reglas críticas activadas</p>
          ) : (
            <ul className="space-y-2">
              {reglasCriticas.map((regla, i) => {
                const info = RF_CODES[regla]
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${info?.isRojo ? 'bg-red-400' : 'bg-yellow-400'}`} />
                    <div>
                      <span className="text-xs font-mono font-bold text-neutral-400">{regla}</span>
                      {info && (
                        <>
                          <span className="text-xs text-neutral-600 mx-1.5">—</span>
                          <span className="text-xs text-neutral-300">{info.label}</span>
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${info.isRojo ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          {
            icon: DollarSign, label: 'Montos', accent: '#C8FF00',
            rows: [
              { k: 'Reclamado', v: formatMoney(s.monto_reclamado) },
              { k: 'Estimado', v: formatMoney(s.monto_estimado) },
              { k: 'Pagado', v: formatMoney(s.monto_pagado) },
              { k: 'Suma aseg.', v: formatMoney(s.suma_asegurada) },
            ],
          },
          {
            icon: Calendar, label: 'Fechas', accent: '#C8FF00',
            rows: [
              { k: 'Ocurrencia', v: formatDate(s.fecha_ocurrencia) },
              { k: 'Reporte', v: formatDate(s.fecha_reporte) },
              { k: 'Días ocur→rep', v: String(s.dias_entre_ocurrencia_reporte ?? '-'), warn: s.dias_entre_ocurrencia_reporte > 7 },
              { k: 'Días inicio', v: String(s.dias_desde_inicio_poliza ?? '-'), danger: s.dias_desde_inicio_poliza < 30 },
            ],
          },
          {
            icon: Building2, label: 'Proveedor', accent: '#FF6500',
            rows: [
              { k: 'Nombre', v: s.nombre_proveedor || s.id_proveedor || '-' },
              { k: 'Tipo', v: s.tipo_proveedor || '-' },
              { k: 'Lista rest.', v: s.en_lista_restrictiva ? '⚠ Sí' : 'No', danger: s.en_lista_restrictiva },
            ],
          },
          {
            icon: FileText, label: 'Póliza', accent: '#C8FF00',
            rows: [
              { k: 'ID', v: s.id_poliza || '-' },
              { k: 'Inicio', v: formatDate(s.fecha_inicio) },
              { k: 'Canal', v: s.canal_venta || '-' },
            ],
          },
        ].map(({ icon: Icon, label, accent, rows }) => (
          <div key={label} className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent }} />
              <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">{label}</p>
            </div>
            <div className="space-y-1.5">
              {rows.map(({ k, v, warn, danger }: { k: string; v: string; warn?: boolean; danger?: boolean }) => (
                <div key={k} className="flex justify-between gap-2 text-xs">
                  <span className="text-neutral-600">{k}</span>
                  <span className={`font-medium truncate ${danger ? 'text-red-400' : warn ? 'text-yellow-400' : 'text-neutral-300'}`}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: User, label: 'Historial asegurado', value: s.historial_siniestros_asegurado ?? 0, threshold: 2, accent: '#C8FF00' },
          { icon: Car, label: 'Historial vehículo', value: s.historial_siniestros_vehiculo ?? 0, threshold: 1, accent: '#C8FF00' },
          { icon: User, label: 'Historial conductor', value: s.historial_siniestros_conductor ?? 0, threshold: 1, accent: '#C8FF00' },
        ].map(({ icon: Icon, label, value, threshold }) => (
          <div key={label} className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-4 text-center">
            <Icon className="w-4 h-4 text-neutral-600 mx-auto mb-2" />
            <p className="text-[10px] text-neutral-600 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${value > threshold ? 'text-yellow-400' : 'text-white'}`} style={{ fontFamily: 'var(--font-heading)' }}>
              {value}
            </p>
            <p className="text-[10px] text-neutral-700 mt-0.5">siniestros prev.</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-neutral-600" />
          <h2 className="font-semibold text-white text-sm">Narrativa del reclamo</h2>
          <span className="text-[10px] text-neutral-700">(datos sintéticos)</span>
        </div>
        <p className="text-sm text-neutral-400 leading-relaxed">{s.descripcion || 'Sin descripción registrada.'}</p>
      </div>

      {documentos.length > 0 && (
        <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#222]">
            <FileText className="w-4 h-4 text-neutral-600" />
            <h2 className="font-semibold text-white text-sm">Documentos ({documentos.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#191919] border-b border-[#222]">
                  {['Tipo documento', 'Entregado', 'Legible', 'Inconsistencia', 'Observación'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc) => (
                  <tr key={doc.id_documento} className="border-b border-[#1E1E1E] hover:bg-[#1E1E1E] transition-colors">
                    <td className="py-2.5 px-4 text-neutral-300 font-medium text-xs">{doc.tipo_documento}</td>
                    <td className="py-2.5 px-4">
                      {doc.entregado ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    </td>
                    <td className="py-2.5 px-4">
                      {doc.legible ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    </td>
                    <td className="py-2.5 px-4">
                      {doc.inconsistencia_detectada ? (
                        <span className="text-xs text-red-400 font-medium">Detectada</span>
                      ) : (
                        <span className="text-xs text-neutral-700">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-500 text-xs">{doc.observacion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
