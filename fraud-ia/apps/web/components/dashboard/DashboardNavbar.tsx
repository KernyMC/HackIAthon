'use client'

import Image from 'next/image'
import { RotateCcw, RefreshCw, Minimize2, LayoutDashboard } from 'lucide-react'

interface Props {
  lastUpdated:          Date | null
  totalSiniestros:      number
  loading:              boolean
  minimalista:          boolean
  onToggleMinimalista:  () => void
  onRefresh:            () => void
  onReset:              () => void
}

export default function DashboardNavbar({
  lastUpdated,
  totalSiniestros,
  loading,
  minimalista,
  onToggleMinimalista,
  onRefresh,
  onReset,
}: Props) {
  const askAI = () =>
    window.dispatchEvent(
      new CustomEvent('fraudia:ask', {
        detail: '¿Cuál es el resumen ejecutivo del estado actual de los siniestros? Incluye KPIs clave, casos más críticos y recomendaciones.',
      })
    )

  return (
    <div className="sticky top-0 z-20 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#1f1f1f]">
      <div className="flex items-center justify-between px-8 h-20">

        {/* ── Left: brand + live indicator ─────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-white font-black text-base tracking-widest uppercase leading-none">
                DASHBOARD
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
                <span className="text-[10px] text-green-400 font-black uppercase tracking-wider">En vivo</span>
              </div>
            </div>
            <p className="text-xs text-neutral-600 leading-none mt-1">
              {lastUpdated
                ? `Actualizado ${lastUpdated.toLocaleTimeString('es-EC')}`
                : 'Cargando datos...'}
            </p>
          </div>
        </div>

        {/* ── Center: summary stat ──────────────────────────────────────── */}
        {totalSiniestros > 0 && (
          <div className="hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#161616] border border-[#252525]">
            <span className="text-xs text-neutral-600">Total analizado:</span>
            <span className="text-sm font-black font-mono text-[#C8FF00] tabular-nums">
              {totalSiniestros.toLocaleString('es-EC')}
            </span>
            <span className="text-xs text-neutral-600">siniestros</span>
          </div>
        )}

        {/* ── Right: action buttons ─────────────────────────────────────── */}
        <div className="flex items-center gap-2.5">

          {/* Ask AI */}
          <button
            data-tour="dashboard-ai-btn"
            onClick={askAI}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C8FF00] hover:bg-[#d4ff33] text-black font-black rounded-xl text-sm transition-colors duration-150 cursor-pointer lime-glow"
          >
            <Image
              src="/logo.png"
              alt=""
              width={18}
              height={18}
              style={{ filter: 'brightness(0)' }}
            />
            Preguntar a la IA
          </button>

          {/* Minimalist toggle */}
          <button
            onClick={onToggleMinimalista}
            title={minimalista ? 'Ver todos los gráficos' : 'Modo minimalista — solo lo esencial'}
            className={[
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all duration-150 cursor-pointer font-semibold',
              minimalista
                ? 'bg-[#C8FF00]/10 border-[#C8FF00]/30 text-[#C8FF00]'
                : 'bg-[#1C1C1C] border-[#2A2A2A] text-neutral-400 hover:text-white hover:bg-[#242424]',
            ].join(' ')}
          >
            {minimalista
              ? <LayoutDashboard className="w-4 h-4" />
              : <Minimize2 className="w-4 h-4" />
            }
            <span>{minimalista ? 'Completo' : 'Minimalista'}</span>
          </button>

          {/* Reset grid */}
          <button
            onClick={onReset}
            title="Restablecer posiciones del grid"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#242424] text-neutral-400 text-sm border border-[#2A2A2A] transition-colors cursor-pointer font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>

          {/* Refresh data */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Recargar datos"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#242424] disabled:opacity-50 text-neutral-200 text-sm border border-[#2A2A2A] transition-colors cursor-pointer font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#C8FF00]' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
