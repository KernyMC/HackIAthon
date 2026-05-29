'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Wrench, BookOpen, AlertTriangle, ChevronDown, BarChart2 } from 'lucide-react'
import { chat, getSiniestros, getProveedoresRiesgo, getKpis } from '@/lib/api'
import type { ChatMessage, ChartData } from '@/lib/types'
import { MarkdownContent } from '@/components/ui/markdown-content'
import { BarChart, BarPlot } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { ChartsContainer } from '@mui/x-charts/ChartsContainer'
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis'
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis'
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip'
import { ThemeProvider, createTheme } from '@mui/material/styles'

const muiDark = createTheme({ palette: { mode: 'dark' } })

const RISK_COLORS: Record<string, string> = {
  'Verde Bajo': '#22c55e',
  'Amarillo Medio': '#eab308',
  'Rojo Alto': '#ef4444',
}

const SUGGESTED_QUESTIONS = [
  '¿Cuáles son los 10 siniestros con mayor riesgo?',
  '¿Qué proveedores concentran más alertas rojas?',
  '¿Qué documentos faltan en los casos críticos?',
  '¿Qué siniestros ocurrieron cerca del inicio de la póliza?',
  'Genera un resumen ejecutivo de los casos críticos.',
  '¿Qué significa riesgo amarillo?',
  '¿Cuál es la diferencia entre score de reglas y score del modelo?',
  '¿Qué limitaciones éticas tiene el modelo?',
  '¿Cómo detectan narrativas similares?',
  'Recomienda qué casos debería revisar primero el analista.',
  '¿Cuántos siniestros hay en nivel rojo?',
  '¿Qué patrones se repiten en los reclamos sospechosos?',
]

// Fetch chart data based on which tools the agent used
async function buildChartFromTools(tools: string[]): Promise<ChartData | undefined> {
  try {
    if (tools.includes('listar_siniestros_mayor_riesgo') || tools.includes('explicar_siniestro')) {
      const res = await getSiniestros({ limit: 10, offset: 0 })
      return {
        type: 'bar',
        title: 'Top 10 siniestros por score de riesgo',
        data: res.items.map(s => ({
          name: s.id_siniestro.replace('SIN-', ''),
          value: Number(s.score_final),
          color: RISK_COLORS[s.nivel_riesgo] ?? '#C8FF00',
        })),
      }
    }

    if (tools.includes('analizar_proveedores_alertas')) {
      const provs = await getProveedoresRiesgo(8)
      return {
        type: 'bar',
        title: 'Proveedores por alertas rojas',
        data: provs.map(p => ({
          name: (p.nombre_proveedor || p.id_proveedor).slice(0, 20),
          value: p.casos_rojos,
          color: '#ef4444',
        })),
      }
    }

    if (tools.includes('generar_resumen_ejecutivo') || tools.includes('listar_documentos_faltantes_casos_criticos')) {
      const kpis = await getKpis()
      return {
        type: 'pie',
        title: 'Distribución por nivel de riesgo',
        data: [
          { name: 'Verde Bajo',    value: kpis.casos_verdes,    color: '#22c55e' },
          { name: 'Amarillo Medio', value: kpis.casos_amarillos, color: '#eab308' },
          { name: 'Rojo Alto',     value: kpis.casos_rojos,     color: '#ef4444' },
        ],
      }
    }

    if (tools.includes('listar_casos_cerca_inicio_poliza')) {
      const res = await getSiniestros({ limit: 10, offset: 0, score_min: 40 })
      return {
        type: 'bar',
        title: 'Casos sospechosos cerca del inicio de póliza',
        data: res.items.map(s => ({
          name: s.id_siniestro.replace('SIN-', ''),
          value: s.dias_desde_inicio_poliza ?? 0,
          color: '#eab308',
        })),
      }
    }
  } catch {
    // silently skip chart on error
  }
  return undefined
}

function MiniChart({ chart }: { chart: ChartData }) {
  return (
    <div className="mt-3 rounded-xl bg-[#161616] border border-[#2A2A2A] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#222]">
        <BarChart2 className="w-3.5 h-3.5 text-[#C8FF00]" />
        <p className="text-[11px] font-semibold text-neutral-400">{chart.title}</p>
      </div>
      <div className="px-2 pb-1">
        <ThemeProvider theme={muiDark}>
          {chart.type === 'bar' ? (
            <ChartsContainer
              xAxis={[{
                data: chart.data.map(d => d.name),
                scaleType: 'band',
                tickLabelStyle: { fill: '#555', fontSize: 8 },
              }]}
              yAxis={[{ tickLabelStyle: { fill: '#555', fontSize: 8 } }]}
              series={[{ type: 'bar', data: chart.data.map(d => d.value), color: 'url(#chatBarGrad)', label: 'Valor' }]}
              height={165}
              margin={{ top: 8, right: 10, bottom: 26, left: 32 }}
              sx={{ '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: 'transparent' } }}
            >
              <defs>
                <linearGradient id="chatBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eab308" stopOpacity={1} />
                  <stop offset="100%" stopColor="#92400e" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <BarPlot borderRadius={4} />
              <ChartsXAxis />
              <ChartsYAxis />
              <ChartsTooltip />
            </ChartsContainer>
          ) : (
            <>
              <PieChart
                series={[{
                  data: chart.data.map(d => ({ id: d.name, value: d.value, label: d.name, color: d.color ?? '#C8FF00' })),
                  innerRadius: '30%',
                  outerRadius: '60%',
                  paddingAngle: 3,
                  highlightScope: { fade: 'global', highlight: 'item' },
                }]}
                height={145}
                slots={{ legend: () => null }}
              />
              <div className="flex justify-center gap-3 pb-2 flex-wrap">
                {chart.data.map(d => (
                  <div key={d.name} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color ?? '#C8FF00' }} />
                    <span className="text-[10px] text-neutral-500">{d.name.split(' ')[0]}</span>
                    <span className="text-[10px] font-semibold" style={{ color: d.color ?? '#C8FF00' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ThemeProvider>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hola, soy FraudIA Claims Assistant. Puedo ayudarte a analizar siniestros, identificar señales de posible riesgo, consultar la base de conocimiento y generar resúmenes ejecutivos con gráficas. ¿En qué puedo ayudarte hoy?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasSentInitial = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-send message from URL param ?q=
  useEffect(() => {
    if (hasSentInitial.current) return
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) {
      hasSentInitial.current = true
      sendMessage(q)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setMessages(m => [...m, { role: 'user', content: trimmed, timestamp: new Date().toISOString() }])
    setInput('')
    setLoading(true)

    try {
      const res = await chat(sessionId, trimmed)

      // Build chart based on tools the agent used
      const chart = await buildChartFromTools(res.tools_used ?? [])

      setMessages(m => [...m, {
        role: 'assistant',
        content: res.answer,
        tools_used: res.tools_used,
        citations: res.citations,
        timestamp: new Date().toISOString(),
        chart,
      }])
    } catch {
      setMessages(m => [...m, {
        role: 'assistant',
        content: 'Error al conectar con el agente. Verifica que la API esté disponible.',
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const suggestions = showAllSuggestions ? SUGGESTED_QUESTIONS : SUGGESTED_QUESTIONS.slice(0, 5)

  return (
    <div className="flex flex-col h-screen bg-[#111111]">

      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-[#2A2A2A] bg-[#0F0F0F]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C8FF00] flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-black" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">FraudIA Claims Assistant</h1>
            <p className="text-[10px] text-neutral-600">Agente IA · RAG + SQL · Gemini · Gráficas automáticas</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} slide-in`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-[#C8FF00] flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                <MessageSquare className="w-3.5 h-3.5 text-black" />
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[#C8FF00] text-black rounded-br-none font-medium'
                  : 'bg-[#1C1C1C] text-neutral-200 rounded-bl-none border border-[#2A2A2A]'
              }`}
            >
              {msg.role === 'assistant' ? (
                <>
                  <MarkdownContent content={msg.content} />

                  {/* Inline chart */}
                  {msg.chart && <MiniChart chart={msg.chart} />}

                  {/* Tools used */}
                  {msg.tools_used && msg.tools_used.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#2A2A2A]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Wrench className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                        {msg.tools_used.map((tool, j) => (
                          <span key={j} className="text-[10px] text-neutral-400 bg-[#242424] px-2 py-0.5 rounded-full border border-[#333]">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <BookOpen className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                      {msg.citations.map((c, j) => (
                        <span key={j} className="text-[10px] text-[#C8FF00] bg-[#C8FF00]/10 px-2 py-0.5 rounded-full border border-[#C8FF00]/20">
                          {c.source}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-[#C8FF00] flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
              <MessageSquare className="w-3.5 h-3.5 text-black" />
            </div>
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-2xl rounded-bl-none px-4 py-3">
              <div className="flex gap-1.5 items-center">
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="w-2 h-2 bg-[#C8FF00] rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
                <span className="text-xs text-neutral-600 ml-1">Consultando al agente...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      <div className="flex-none px-6 pb-2 border-t border-[#2A2A2A] pt-3 bg-[#111111]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider">Preguntas sugeridas</p>
          <button
            onClick={() => setShowAllSuggestions(v => !v)}
            className="text-xs text-[#C8FF00] hover:text-white transition-colors flex items-center gap-1"
          >
            {showAllSuggestions ? 'Menos' : 'Ver todas'}
            <ChevronDown className={`w-3 h-3 transition-transform ${showAllSuggestions ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="text-xs bg-[#1C1C1C] hover:bg-[#242424] text-neutral-400 hover:text-white px-3 py-1.5 rounded-full border border-[#2A2A2A] hover:border-[#C8FF00]/30 transition-all disabled:opacity-40 whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div data-tour="chat-input" className="flex-none px-6 py-4 border-t border-[#2A2A2A] bg-[#0F0F0F]">
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Pregunta sobre siniestros, proveedores, reglas de negocio..."
            className="flex-1 bg-[#1C1C1C] text-white rounded-xl px-4 py-3 text-sm border border-[#2A2A2A] focus:outline-none focus:border-[#C8FF00]/50 focus:ring-1 focus:ring-[#C8FF00]/20 placeholder:text-neutral-600 transition-colors"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-11 h-11 bg-[#C8FF00] hover:bg-[#d4ff33] disabled:bg-[#1C1C1C] disabled:text-neutral-700 text-black rounded-xl transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <AlertTriangle className="w-3 h-3 text-[#FF6500]" />
          <p className="text-neutral-700 text-xs">El agente genera alertas de revisión. No confirma ni determina fraude.</p>
        </div>
      </div>
    </div>
  )
}
