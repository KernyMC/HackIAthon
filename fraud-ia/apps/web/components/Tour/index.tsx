'use client'

import { TourProvider, useTour, type StepType } from '@reactour/tour'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'

// ── Step content component ────────────────────────────────────────────────────
function Step({ title, body, tip }: { title: string; body: string; tip?: string }) {
  return (
    <div className="space-y-2">
      <p className="font-black text-sm text-white leading-tight">{title}</p>
      <p className="text-[13px] text-neutral-300 leading-relaxed">{body}</p>
      {tip && (
        <p className="text-[11px] text-[#C8FF00] font-semibold border-t border-[#2a2a2a] pt-2 mt-2">
          💡 {tip}
        </p>
      )}
    </div>
  )
}

// ── Step definitions ─────────────────────────────────────────────────────────
type AppStep = StepType & {
  route: string
  /** Optional sentinel: poll until this element also exists before showing tooltip.
   *  Use when the target element shifts position after async content loads nearby. */
  readySelector?: string
}

export const TOUR_STEPS: AppStep[] = [
  // ── 1: Landing (solo el hero) ─────────────────────────────────────────────
  {
    selector: '[data-tour="landing-hero"]',
    route: '/',
    content: (
      <Step
        title="Bienvenido a FraudSweep"
        body="Sistema de apoyo para análisis de posible fraude en siniestros de Aseguradora del Sur. Nunca acusa ni rechaza automáticamente — genera alertas para revisión humana."
        tip="El sistema analiza 1.000 siniestros sintéticos del mercado ecuatoriano. Haz clic en → para continuar el tour por el Dashboard."
      />
    ),
  },

  // ── 2–4: Dashboard ────────────────────────────────────────────────────────
  // readySelector waits for GridStack to finish layout before @reactour
  // measures element position (prevents the tooltip appearing at 0,0).
  {
    selector: '[data-tour="dashboard-kpis"]',
    route: '/dashboard',
    readySelector: '[data-tour-ready="dashboard-ready"]',
    content: (
      <Step
        title="KPIs del portafolio"
        body="4 métricas clave: total de siniestros, distribución por nivel de riesgo (Verde/Amarillo/Rojo), monto total reclamado y score promedio del sistema."
        tip="Cada KPI tiene un ícono ? al hover que explica qué mide."
      />
    ),
  },
  {
    selector: '[data-tour="dashboard-criticos"]',
    route: '/dashboard',
    readySelector: '[data-tour-ready="dashboard-ready"]',
    content: (
      <Step
        title="Casos críticos — revisar hoy"
        body="Siniestros con score ≥ 70 (Rojo Alto) ordenados por riesgo. Cada card muestra el ID, las alertas activadas y botones de acción rápida."
        tip="El botón 'IA' inyecta el contexto del siniestro directamente al agente."
      />
    ),
  },
  {
    selector: '[data-tour="dashboard-ai-btn"]',
    route: '/dashboard',
    readySelector: '[data-tour-ready="dashboard-ready"]',
    content: (
      <Step
        title="Agente IA — resumen ejecutivo"
        body="Pregunta al agente sobre el estado del portafolio en lenguaje natural. Genera KPIs, hallazgos y recomendaciones en segundos usando 8 herramientas SQL + RAG."
        tip="Prueba: '¿Cuáles son los 5 siniestros con mayor riesgo?'"
      />
    ),
  },

  // ── 5–6: Siniestros ───────────────────────────────────────────────────────
  {
    selector: '[data-tour="siniestros-filtros"]',
    route: '/siniestros',
    readySelector: '[data-tour-ready="siniestros-kpis"]',
    content: (
      <Step
        title="Filtros de búsqueda"
        body="Filtra por nivel de riesgo, ramo, texto libre (ID o descripción) y score mínimo. Los filtros se combinan y la tabla se actualiza al instante."
      />
    ),
  },
  {
    selector: '[data-tour="siniestros-tabla"]',
    route: '/siniestros',
    readySelector: '[data-tour-ready="siniestros-kpis"]',
    content: (
      <Step
        title="Tabla de siniestros"
        body="Todos los casos paginados con columnas ordenables. Haz clic en cualquier fila para ver el detalle completo con score, alertas y documentos."
        tip="Las columnas tienen flechas ↕ — puedes ordenar por score, monto, etc."
      />
    ),
  },

  // ── 7: Evaluar ───────────────────────────────────────────────────────────
  {
    selector: '[data-tour="evaluar-form"]',
    route: '/evaluar',
    content: (
      <Step
        title="Evaluar nuevo siniestro"
        body="Ingresa un caso recién reportado (6–8 campos) y obtén un score de riesgo en segundos. Adjunta opcionalmente un PDF de peritaje para indexarlo en el RAG del agente."
        tip="El siniestro se persiste con ID SIN-EVAL-XXXXXX y aparece en el Dashboard."
      />
    ),
  },

  // ── 8: Proveedores ────────────────────────────────────────────────────────
  {
    selector: '[data-tour="proveedores-top3"]',
    route: '/proveedores',
    content: (
      <Step
        title="Proveedores de mayor riesgo"
        body="Top 3 proveedores con mayor concentración de alertas. La barra segmentada muestra: naranja = críticos, ámbar = revisión, verde = seguros."
        tip="Haz clic en una card para preguntarle al agente IA sobre ese proveedor."
      />
    ),
  },

  // ── 9: Chat ───────────────────────────────────────────────────────────────
  {
    selector: '[data-tour="chat-input"]',
    route: '/chat',
    content: (
      <Step
        title="Agente IA conversacional"
        body="Powered by Google ADK + Gemini 2.5 Flash. Responde en español, usa 8 herramientas SQL + RAG y cita las fuentes."
        tip="Después de subir un PDF en /evaluar, pregunta: 'Analiza el peritaje_XXXXXXXX'"
      />
    ),
  },
]

// ── Navigator: cross-page routing + wait for element ─────────────────────────
//
// KEY FIX: `isOpen` is intentionally excluded from the dependency array.
// If included, calling setIsOpen(false) inside the effect would trigger a
// re-run → cleanup clears pollRef → poll dies → setIsOpen(true) never fires.
// Instead we track `isOpen` in a ref so we can read the latest value without
// adding it as a reactive dependency.
//
function TourNavigator() {
  const { currentStep, isOpen, setIsOpen } = useTour()
  const router     = useRouter()
  const pathname   = usePathname()
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const isOpenRef  = useRef(isOpen)
  isOpenRef.current = isOpen   // Keep ref in sync on every render

  useEffect(() => {
    // Stop any previous poll before doing anything else
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }

    if (!isOpenRef.current) return

    const step          = TOUR_STEPS[currentStep]
    if (!step) return
    const selector      = typeof step.selector === 'string' ? step.selector : null
    const readySelector = step.readySelector ?? null

    // ── 1. Wrong route → navigate, then wait for pathname to update ───────
    if (step.route !== pathname) {
      router.push(step.route)
      return
    }

    // ── 2. Correct route → ALWAYS hide + poll before repositioning ─────────
    // Even if the element already exists, @reactour measures position before
    // the page finishes painting after a route change → (0,0) coordinates.
    // The poll also waits for readySelector (e.g. async KPI strip) so that
    // nearby content shifting after data loads doesn't misplace the tooltip.
    setIsOpen(false)

    let attempts = 0
    let allReadySince = 0   // tick count since both selectors were first satisfied
    pollRef.current = setInterval(() => {
      attempts++
      const targetOk = selector      ? Boolean(document.querySelector(selector))      : true
      const readyOk  = readySelector ? Boolean(document.querySelector(readySelector)) : true
      const timedOut = attempts >= 80   // 8 s hard limit

      if (timedOut) {
        clearInterval(pollRef.current!); pollRef.current = null; setIsOpen(true); return
      }

      if (targetOk && readyOk) {
        allReadySince++
        // Wait 4 extra ticks (400 ms) after all elements are ready so the
        // browser has time to apply any final layout shifts before @reactour
        // measures the target element's position (GridStack animate ~300ms).
        if (allReadySince >= 4) {
          clearInterval(pollRef.current!); pollRef.current = null; setIsOpen(true)
        }
      } else {
        allReadySince = 0   // reset if something disappears
      }
    }, 100)

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, pathname])

  return null
}

// ── Dark-theme styles ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StyleFn = (base: any, state?: any) => any

const tourStyles: Record<string, StyleFn> = {
  popover: (base) => ({
    ...base,
    background: '#111111',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    color: '#ffffff',
    padding: '20px 22px',
    maxWidth: '320px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
  }),
  dot: (base, state) => ({
    ...base,
    background: state?.current ? '#C8FF00' : '#2a2a2a',
    border:     state?.current ? 'none'     : '1px solid #3a3a3a',
    width: 8,
    height: 8,
  }),
  arrow: (base, state) => ({
    ...base,
    color: state?.disabled ? '#2a2a2a' : '#C8FF00',
  }),
  badge: (base) => ({
    ...base,
    background: '#C8FF00',
    color: '#000000',
    fontWeight: 900,
    fontSize: 11,
  }),
  close: (base) => ({
    ...base,
    color: '#555',
    top: 12,
    right: 12,
  }),
  maskArea:    (base) => ({ ...base, rx: 12 }),
  maskWrapper: (base) => ({ ...base, color: 'rgba(0,0,0,0.72)' }),
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppTourProvider({ children }: { children: ReactNode }) {
  return (
    <TourProvider
      steps={TOUR_STEPS}
      styles={tourStyles}
      padding={{ mask: 8, popover: [10, 10] }}
      showNavigation
      showDots
      showBadge
      scrollSmooth
    >
      <TourNavigator />
      {children}
    </TourProvider>
  )
}

export { useTour } from '@reactour/tour'
