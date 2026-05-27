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
} from 'lucide-react'
import { getSiniestro, chat } from '@/lib/api'
import type { SiniestroDetail } from '@/lib/types'
import { RiskBadge } from '@/components/ui/risk-badge'
import { formatMoney, formatScore, formatDate, getScoreColor } from '@/lib/utils'

export default function SiniestroDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [siniestro, setSiniestro] = useState<SiniestroDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
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
    } catch {
      setAiAnswer('Error al consultar el agente IA. Por favor intente de nuevo.')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mr-3" />
        <p className="text-gray-400">Cargando siniestro...</p>
      </div>
    )
  }

  if (error || !siniestro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-white font-semibold">No se pudo cargar el siniestro</p>
        <p className="text-gray-400 text-sm">{error}</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-[hsl(217,33%,17%)] text-gray-300 rounded-lg hover:bg-[hsl(217,33%,22%)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>
    )
  }

  const s = siniestro
  const alertas: string[] = Array.isArray(s.alertas_activadas) ? s.alertas_activadas : []
  const reglasCriticas: string[] = Array.isArray(s.reglas_criticas_activadas) ? s.reglas_criticas_activadas : []
  const documentos = s.documentos || []
  const scoreNum = Number(s.score_final) || 0

  return (
    <div className="p-8 animate-fade-in max-w-6xl">
      {/* Back button + Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-200 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a siniestros
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-mono">{s.id_siniestro}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {s.ramo} · {s.cobertura} · {s.ciudad}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge nivel={s.nivel_riesgo} className="text-sm px-3 py-1" />
            <button
              onClick={handleExplainWithAI}
              disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {aiLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              Explicar con IA
            </button>
          </div>
        </div>
      </div>

      {/* AI Answer */}
      {(aiAnswer || aiLoading) && (
        <div className="mb-6 p-5 rounded-xl bg-blue-900/20 border border-blue-800/50">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-semibold text-blue-300">Explicación del Agente IA</p>
          </div>
          {aiLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Consultando al agente...
            </div>
          ) : (
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
          )}
        </div>
      )}

      {/* Score + Risk Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-5 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Score Final</p>
          <p className={`text-5xl font-bold ${getScoreColor(scoreNum)}`}>
            {formatScore(s.score_final)}
          </p>
          <p className="text-xs text-gray-600 mt-1">de 100</p>
        </div>
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Desglose del score</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Score por reglas</span>
              <span className={`font-semibold ${getScoreColor(Number(s.score_reglas))}`}>
                {formatScore(s.score_reglas)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Score modelo simulado</span>
              <span className={`font-semibold ${getScoreColor(Number(s.score_modelo_simulado))}`}>
                {formatScore(s.score_modelo_simulado)}
              </span>
            </div>
            <div className="h-px bg-[hsl(217,33%,20%)] my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 font-medium">Score final</span>
              <span className={`font-bold ${getScoreColor(scoreNum)}`}>
                {formatScore(s.score_final)}
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Acción sugerida</p>
          <div className="flex items-start gap-2 mt-2">
            <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-200 leading-relaxed">
              {s.accion_sugerida || 'Sin acción registrada'}
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-3 italic">
            Decisión final a cargo del analista humano
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h2 className="font-semibold text-white text-sm">Alertas activadas ({alertas.length})</h2>
          </div>
          {alertas.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin alertas activadas</p>
          ) : (
            <ul className="space-y-1.5">
              {alertas.map((alerta, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                  {alerta}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-red-400" />
            <h2 className="font-semibold text-white text-sm">Reglas críticas activadas ({reglasCriticas.length})</h2>
          </div>
          {reglasCriticas.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin reglas críticas activadas</p>
          ) : (
            <ul className="space-y-1.5">
              {reglasCriticas.map((regla, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  {regla}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-green-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Montos</p>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Reclamado</span>
              <span className="text-gray-200 font-medium">{formatMoney(s.monto_reclamado)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Estimado</span>
              <span className="text-gray-200">{formatMoney(s.monto_estimado)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pagado</span>
              <span className="text-gray-200">{formatMoney(s.monto_pagado)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Suma asegurada</span>
              <span className="text-gray-200">{formatMoney(s.suma_asegurada)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Fechas</p>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Ocurrencia</span>
              <span className="text-gray-200">{formatDate(s.fecha_ocurrencia)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reporte</span>
              <span className="text-gray-200">{formatDate(s.fecha_reporte)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Días ocur→rep</span>
              <span className={`font-medium ${s.dias_entre_ocurrencia_reporte > 7 ? 'text-yellow-400' : 'text-gray-200'}`}>
                {s.dias_entre_ocurrencia_reporte ?? '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Días desde inicio</span>
              <span className={`font-medium ${s.dias_desde_inicio_poliza < 30 ? 'text-red-400' : 'text-gray-200'}`}>
                {s.dias_desde_inicio_poliza ?? '-'}
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-orange-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Proveedor</p>
          </div>
          <div className="space-y-1.5 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Nombre</p>
              <p className="text-gray-200 font-medium">{s.nombre_proveedor || s.id_proveedor || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Tipo</p>
              <p className="text-gray-300">{s.tipo_proveedor || '-'}</p>
            </div>
            {s.en_lista_restrictiva && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                En lista restrictiva
              </div>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Póliza</p>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ID</span>
              <span className="text-gray-200 font-mono text-xs">{s.id_poliza || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Inicio</span>
              <span className="text-gray-200">{formatDate(s.fecha_inicio)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Canal</span>
              <span className="text-gray-300">{s.canal_venta || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-4 text-center">
          <User className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">Historial asegurado</p>
          <p className={`text-2xl font-bold ${(s.historial_siniestros_asegurado || 0) > 2 ? 'text-yellow-400' : 'text-gray-200'}`}>
            {s.historial_siniestros_asegurado ?? 0}
          </p>
          <p className="text-xs text-gray-600">siniestros prev.</p>
        </div>
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-4 text-center">
          <Car className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">Historial vehículo</p>
          <p className={`text-2xl font-bold ${(s.historial_siniestros_vehiculo || 0) > 1 ? 'text-yellow-400' : 'text-gray-200'}`}>
            {s.historial_siniestros_vehiculo ?? 0}
          </p>
          <p className="text-xs text-gray-600">siniestros prev.</p>
        </div>
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-4 text-center">
          <User className="w-5 h-5 text-purple-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">Historial conductor</p>
          <p className={`text-2xl font-bold ${(s.historial_siniestros_conductor || 0) > 1 ? 'text-yellow-400' : 'text-gray-200'}`}>
            {s.historial_siniestros_conductor ?? 0}
          </p>
          <p className="text-xs text-gray-600">siniestros prev.</p>
        </div>
      </div>

      <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-white text-sm">Narrativa del reclamo</h2>
          <span className="text-xs text-gray-600">(datos sintéticos)</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          {s.descripcion || 'Sin descripción registrada.'}
        </p>
      </div>

      {documentos.length > 0 && (
        <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[hsl(217,33%,20%)]">
            <FileText className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-white text-sm">Documentos ({documentos.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[hsl(222,47%,12%)] border-b border-[hsl(217,33%,20%)]">
                  {['Tipo documento', 'Entregado', 'Legible', 'Inconsistencia', 'Observación'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc) => (
                  <tr key={doc.id_documento} className="border-b border-[hsl(217,33%,17%)] hover:bg-[hsl(217,33%,17%)] transition-colors">
                    <td className="py-2.5 px-4 text-gray-300 font-medium text-xs">{doc.tipo_documento}</td>
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
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-gray-400 text-xs">{doc.observacion || '—'}</td>
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
