'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Wrench, BookOpen, AlertTriangle } from 'lucide-react'
import { chat } from '@/lib/api'
import type { ChatMessage } from '@/lib/types'

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

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hola, soy FraudIA Claims Assistant. Puedo ayudarte a analizar siniestros, identificar señales de posible riesgo, consultar la base de conocimiento y generar resúmenes ejecutivos. ¿En qué puedo ayudarte hoy?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg: ChatMessage = { role: 'user', content: trimmed, timestamp: new Date().toISOString() }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await chat(sessionId, trimmed)
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: res.answer,
          tools_used: res.tools_used,
          citations: res.citations,
          timestamp: new Date().toISOString(),
        },
      ])
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            'Error al conectar con el agente. Verifica que la API esté disponible en ' +
            (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'),
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const suggestions = showAllSuggestions ? SUGGESTED_QUESTIONS : SUGGESTED_QUESTIONS.slice(0, 6)

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-[hsl(217,33%,20%)] bg-[hsl(222,47%,11%)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">FraudIA Claims Assistant</h1>
            <p className="text-xs text-gray-500">Agente IA · RAG + SQL · Gemini</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} slide-in`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-[hsl(222,47%,17%)] text-gray-200 rounded-bl-none border border-[hsl(217,33%,22%)]'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

              {/* Tools used */}
              {msg.tools_used && msg.tools_used.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[hsl(217,33%,25%)]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Wrench className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    {msg.tools_used.map((tool, j) => (
                      <span
                        key={j}
                        className="text-xs text-gray-400 bg-[hsl(217,33%,20%)] px-2 py-0.5 rounded-full"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <BookOpen className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  {msg.citations.map((c, j) => (
                    <span
                      key={j}
                      className="text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-800/40"
                    >
                      {c.source}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-[hsl(222,47%,17%)] border border-[hsl(217,33%,22%)] rounded-2xl rounded-bl-none px-4 py-3">
              <div className="flex gap-1.5 items-center">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-1">Consultando al agente...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      <div className="flex-none px-6 pb-2 border-t border-[hsl(217,33%,20%)] pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 font-medium">Preguntas sugeridas</p>
          <button
            onClick={() => setShowAllSuggestions((v) => !v)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showAllSuggestions ? 'Mostrar menos' : 'Ver todas'}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="text-xs bg-[hsl(217,33%,17%)] hover:bg-[hsl(217,33%,22%)] text-gray-300 px-3 py-1.5 rounded-full border border-[hsl(217,33%,25%)] transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex-none px-6 py-4 border-t border-[hsl(217,33%,20%)] bg-[hsl(222,47%,11%)]">
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Pregunta sobre siniestros, proveedores, reglas de negocio..."
            className="flex-1 bg-[hsl(217,33%,14%)] text-white rounded-xl px-4 py-3 text-sm border border-[hsl(217,33%,25%)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 placeholder:text-gray-500 transition-colors"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-11 h-11 bg-blue-600 hover:bg-blue-500 disabled:bg-[hsl(217,33%,20%)] disabled:text-gray-600 text-white rounded-xl transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <AlertTriangle className="w-3 h-3 text-yellow-600" />
          <p className="text-gray-600 text-xs">
            El agente genera alertas de revisión. No confirma ni determina fraude.
          </p>
        </div>
      </div>
    </div>
  )
}
