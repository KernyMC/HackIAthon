// apps/web/app/evaluar/page.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import {
  ShieldAlert, ShieldCheck, ShieldQuestion,
  Upload, FileText, X, Loader2, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { evaluarSiniestro } from '@/lib/api'
import type { EvaluarResult } from '@/lib/types'

const RAMOS = ['Automóvil', 'Salud', 'Vida', 'Hogar', 'Responsabilidad Civil', 'Robo']

const NIVEL_CONFIG = {
  'Verde Bajo': {
    color: '#22c55e',
    bg: 'bg-green-500/10 border-green-500/30',
    Icon: ShieldCheck,
    label: 'Riesgo Bajo',
  },
  'Amarillo Medio': {
    color: '#eab308',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    Icon: ShieldQuestion,
    label: 'Riesgo Medio',
  },
  'Rojo Alto': {
    color: '#ef4444',
    bg: 'bg-red-500/10 border-red-500/30',
    Icon: ShieldAlert,
    label: 'Riesgo Alto',
  },
}

export default function EvaluarPage() {
  const [form, setForm] = useState({
    ramo: 'Automóvil',
    ciudad: '',
    monto_reclamado: '',
    descripcion: '',
    nombre_proveedor: '',
    dias_desde_inicio_poliza: '',
    dias_entre_ocurrencia_reporte: '',
    documentos_completos: true,
  })
  const [pdfFile, setPdfFile]     = useState<File | null>(null)
  const [loading, setLoading]     = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult]       = useState<EvaluarResult | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef  = useRef<HTMLInputElement>(null)
  const dragRef  = useRef(0) // counter to handle enter/leave on children

  const acceptFile = useCallback((file: File) => {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setPdfFile(file)
    }
  }, [])

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragRef.current++
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragRef.current--
    if (dragRef.current === 0) setIsDragging(false)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragRef.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) acceptFile(file)
  }, [acceptFile])

  const set = (k: string, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  const LOADING_STEPS = [
    'Verificando datos del siniestro...',
    'Aplicando reglas de fraude...',
    'Calculando score de riesgo...',
    pdfFile ? 'Indexando documento PDF...' : 'Registrando siniestro...',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingStep(0)
    setError(null)
    setResult(null)

    const fd = new FormData()
    fd.append('ramo', form.ramo)
    fd.append('ciudad', form.ciudad)
    fd.append('monto_reclamado', form.monto_reclamado)
    fd.append('descripcion', form.descripcion)
    fd.append('nombre_proveedor', form.nombre_proveedor)
    if (form.dias_desde_inicio_poliza)
      fd.append('dias_desde_inicio_poliza', form.dias_desde_inicio_poliza)
    if (form.dias_entre_ocurrencia_reporte)
      fd.append('dias_entre_ocurrencia_reporte', form.dias_entre_ocurrencia_reporte)
    fd.append('documentos_completos', String(form.documentos_completos))
    if (pdfFile) fd.append('pdf_file', pdfFile)

    // Cycle loading step messages every 2s while waiting for the API
    const stepTimer = setInterval(() =>
      setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1))
    , 2000)

    // Abort after 90s so the UI never hangs indefinitely
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90_000)

    try {
      const res = await evaluarSiniestro(fd, controller.signal)
      setResult(res)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('La evaluación tardó demasiado. Intenta de nuevo.')
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    } finally {
      clearInterval(stepTimer)
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  const cfg = result ? NIVEL_CONFIG[result.nivel_riesgo] : null

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pl-16">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Evaluar nuevo siniestro</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Ingresa los datos del caso para obtener un score de riesgo inmediato.
            El documento PDF (opcional) queda indexado para consulta con el agente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Form */}
          <form data-tour="evaluar-form" onSubmit={handleSubmit} className="space-y-4">

            {/* Ramo */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Ramo *</label>
              <select
                value={form.ramo}
                onChange={e => set('ramo', e.target.value)}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40"
              >
                {RAMOS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Ciudad */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Ciudad *</label>
              <input
                required
                value={form.ciudad}
                onChange={e => set('ciudad', e.target.value)}
                placeholder="Ej: Quito"
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600"
              />
            </div>

            {/* Monto */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Monto reclamado (USD) *</label>
              <input
                required
                type="number"
                min="1"
                value={form.monto_reclamado}
                onChange={e => set('monto_reclamado', e.target.value)}
                placeholder="Ej: 45000000"
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600"
              />
            </div>

            {/* Proveedor */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Nombre del proveedor *</label>
              <input
                required
                value={form.nombre_proveedor}
                onChange={e => set('nombre_proveedor', e.target.value)}
                placeholder="Ej: Taller Automotriz Norte"
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600"
              />
            </div>

            {/* Días desde inicio póliza */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Días desde inicio de póliza</label>
              <input
                type="number"
                min="0"
                value={form.dias_desde_inicio_poliza}
                onChange={e => set('dias_desde_inicio_poliza', e.target.value)}
                placeholder="Ej: 45"
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600"
              />
            </div>

            {/* Días entre ocurrencia y reporte */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Días entre ocurrencia y reporte</label>
              <input
                type="number"
                min="0"
                value={form.dias_entre_ocurrencia_reporte}
                onChange={e => set('dias_entre_ocurrencia_reporte', e.target.value)}
                placeholder="Ej: 3"
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Descripción del siniestro *</label>
              <textarea
                required
                rows={3}
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Describe brevemente cómo ocurrió el siniestro..."
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600 resize-none"
              />
            </div>

            {/* Documentos completos */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.documentos_completos}
                onChange={e => set('documentos_completos', e.target.checked)}
                className="w-4 h-4 accent-[#C8FF00]"
              />
              <span className="text-sm text-neutral-300">Documentación completa</span>
            </label>

            {/* PDF upload — drag & drop */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Peritaje / informe (PDF, opcional)</label>

              {pdfFile ? (
                <div className="flex items-center gap-2 bg-[#141414] border border-[#C8FF00]/30 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-[#C8FF00] flex-shrink-0" />
                  <span className="text-sm text-white truncate flex-1">{pdfFile.name}</span>
                  <span className="text-[10px] text-neutral-600 flex-shrink-0">
                    {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <button type="button" onClick={() => setPdfFile(null)} className="cursor-pointer">
                    <X className="w-4 h-4 text-neutral-500 hover:text-white transition-colors" />
                  </button>
                </div>
              ) : (
                <div
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={[
                    'w-full border-2 border-dashed rounded-xl px-4 py-6 text-center transition-all duration-150 cursor-pointer select-none',
                    isDragging
                      ? 'border-[#C8FF00] bg-[#C8FF00]/8 scale-[1.01]'
                      : 'border-[#2A2A2A] hover:border-[#C8FF00]/40 hover:bg-[#C8FF00]/4',
                  ].join(' ')}
                >
                  <Upload
                    className={`w-7 h-7 mx-auto mb-2 transition-colors duration-150 ${
                      isDragging ? 'text-[#C8FF00]' : 'text-neutral-600'
                    }`}
                  />
                  {isDragging ? (
                    <>
                      <p className="text-sm font-bold text-[#C8FF00]">Suelta el archivo aquí</p>
                      <p className="text-xs text-[#C8FF00]/60 mt-0.5">Solo archivos PDF</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-neutral-400">
                        Arrastra un PDF aquí, o{' '}
                        <span className="text-[#C8FF00] font-semibold">haz clic para seleccionar</span>
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">PDF · máx. 10 MB</p>
                    </>
                  )}
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f) }}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C8FF00] hover:bg-[#d4ff33] disabled:bg-[#2A2A2A] disabled:text-neutral-600 text-black font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Evaluando...</>
              ) : (
                'Evaluar siniestro'
              )}
            </button>
          </form>

          {/* Result card */}
          <div>
            {!result && !loading && (
              <div className="h-full flex items-center justify-center text-center text-neutral-600 border border-dashed border-[#2A2A2A] rounded-2xl p-8">
                <div>
                  <ShieldQuestion className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">El resultado aparecerá aquí</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="h-full flex items-center justify-center border border-[#2A2A2A] rounded-2xl p-8">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#C8FF00] mx-auto mb-4" />
                  <p className="text-sm text-neutral-400 transition-all duration-300">
                    {LOADING_STEPS[loadingStep]}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    {LOADING_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className="h-1 rounded-full transition-all duration-500"
                        style={{
                          width: i <= loadingStep ? 20 : 8,
                          background: i <= loadingStep ? '#C8FF00' : '#2A2A2A',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {result && cfg && (
              <div className={`border rounded-2xl p-6 space-y-5 ${cfg.bg}`}>
                {/* Siniestro ID */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Caso registrado</span>
                  <a
                    href={`/siniestros/${result.id_siniestro}`}
                    className="text-xs font-mono font-bold text-[#C8FF00] hover:underline"
                  >
                    {result.id_siniestro} →
                  </a>
                </div>

                {/* Score header */}
                <div className="flex items-center gap-3">
                  <cfg.Icon className="w-8 h-8" style={{ color: cfg.color }} />
                  <div>
                    <div className="text-xs text-neutral-400">Score de riesgo</div>
                    <div className="text-3xl font-bold" style={{ color: cfg.color }}>
                      {result.score_final}
                      <span className="text-base font-normal text-neutral-400 ml-1">/100</span>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: `${cfg.color}20`, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full bg-[#1A1A1A] rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${result.score_final}%`, background: cfg.color }}
                  />
                </div>

                {/* Proveedor */}
                {result.proveedor_restringido && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-red-300">Proveedor en lista restrictiva</span>
                  </div>
                )}

                {/* Alertas */}
                {result.alertas.length > 0 && (
                  <div>
                    <div className="text-xs text-neutral-400 mb-2 font-medium">Alertas activadas</div>
                    <ul className="space-y-1.5">
                      {result.alertas.map((a, i) => (
                        <li key={i} className="flex gap-2 text-xs text-neutral-300">
                          <span className="text-[#C8FF00] flex-shrink-0 mt-0.5">◆</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Acción sugerida */}
                <div className="bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-2">
                  <div className="text-xs text-neutral-500 mb-0.5">Acción sugerida</div>
                  <div className="text-sm font-medium text-white">{result.accion_sugerida}</div>
                </div>

                {/* Documento indexado */}
                {result.mensaje_documento && (
                  <div className="flex items-start gap-2 bg-[#C8FF00]/5 border border-[#C8FF00]/20 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C8FF00] flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-300">{result.mensaje_documento}</span>
                  </div>
                )}

                {/* CTA al chat */}
                <button
                  onClick={() => {
                    const msg = result.documento_indexado
                      ? `Analiza el peritaje ${result.documento_indexado} e identifica inconsistencias con el siniestro reportado.`
                      : `El siniestro de ${form.ramo} en ${form.ciudad} tiene score ${result.score_final}. ¿Cuáles son las reglas de fraude aplicables?`
                    window.dispatchEvent(new CustomEvent('fraudia:ask', { detail: msg }))
                  }}
                  className="w-full border border-[#C8FF00]/30 hover:border-[#C8FF00] text-[#C8FF00] text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  Consultar al agente sobre este caso →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
