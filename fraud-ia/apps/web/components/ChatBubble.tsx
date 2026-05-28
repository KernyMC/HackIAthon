'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, Send, Minimize2 } from 'lucide-react'
import { chat } from '@/lib/api'
import { MarkdownContent } from '@/components/ui/markdown-content'

interface Msg { role: 'user' | 'assistant'; content: string }

const QUICK = [
  '¿Cuáles son los 10 casos con mayor riesgo?',
  '¿Qué proveedores concentran más alertas rojas?',
  'Genera un resumen ejecutivo.',
  '¿Qué documentos faltan en casos críticos?',
]

const BUBBLE_SIZE = 56 // w-14 h-14

export default function ChatBubble() {
  const [open, setOpen]         = useState(false)
  const [minimized, setMin]     = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hola, soy FraudSweep. Pregúntame sobre siniestros, proveedores o casos críticos.' },
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [sessionId]         = useState(() => `bubble-${Date.now()}`)

  // ── Drag state (vertical only — always attached to right edge) ────────────
  const RIGHT_FIXED     = 24
  const [bottom, setBottom] = useState(24)
  const [dragging, setDragging] = useState(false)
  const isDragging      = useRef(false)
  const hasDragged      = useRef(false)
  const dragOffsetY     = useRef(0) // cursor offset from button's bottom edge

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100) }
  }, [open])

  useEffect(() => {
    if (open && !minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, minimized])

  // External trigger from dashboard "Explicar IA" buttons
  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      setOpen(true); setMin(false); send(e.detail)
    }
    window.addEventListener('fraudia:ask' as any, handler)
    return () => window.removeEventListener('fraudia:ask' as any, handler)
  }, []) // eslint-disable-line

  const send = async (text: string) => {
    const t = text.trim()
    if (!t || loading) return
    setMessages(m => [...m, { role: 'user', content: t }])
    setInput('')
    setLoading(true)
    try {
      const res = await chat(sessionId, t)
      setMessages(m => [...m, { role: 'assistant', content: res.answer }])
      if (!open) setUnread(u => u + 1)
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Error al conectar con el agente. Verifica que la API esté disponible.' }])
    } finally {
      setLoading(false)
    }
  }

  // ── Drag handlers (vertical only) ──────────────────────────────────────────
  const startDrag = useCallback((_clientX: number, clientY: number) => {
    isDragging.current = true
    hasDragged.current = false
    setDragging(true)
    dragOffsetY.current = window.innerHeight - clientY - bottom
  }, [bottom])

  const moveDrag = useCallback((_clientX: number, clientY: number) => {
    if (!isDragging.current) return
    hasDragged.current = true
    const newBottom = window.innerHeight - clientY - dragOffsetY.current
    setBottom(Math.max(8, Math.min(window.innerHeight - BUBBLE_SIZE - 8, newBottom)))
  }, [])

  const endDrag = useCallback(() => {
    isDragging.current = false
    setDragging(false)
  }, [])

  // Global mouse listeners
  useEffect(() => {
    const onMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY)
    const onUp   = () => endDrag()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [moveDrag, endDrag])

  // Global touch listeners
  useEffect(() => {
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) moveDrag(t.clientX, t.clientY)
    }
    const onEnd = () => endDrag()
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend',  onEnd)
    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend',  onEnd)
    }
  }, [moveDrag, endDrag])

  // Click fires only when the user didn't drag
  const handleBubbleClick = () => {
    if (hasDragged.current) return
    setOpen(v => !v)
    setMin(false)
  }

  return (
    <div
      className="fixed z-50 flex flex-col items-end gap-3"
      style={{ bottom, right: RIGHT_FIXED }}
    >
      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="flex flex-col bg-[#111111] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200"
          style={{ width: 340, height: minimized ? 52 : 460 }}
        >
          {/* Header — drag handle for the panel */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-[#0F0F0F] border-b border-[#2A2A2A] flex-shrink-0 cursor-ns-resize select-none"
            onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
            onTouchStart={e => { const t = e.touches[0]; if (t) startDrag(t.clientX, t.clientY) }}
            title="Arrastra para mover"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0">
                <Image src="/logo.png" alt="FraudSweep" width={24} height={24} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-bold text-white">FraudSweep Assistant</span>
              <span className="text-[9px] text-neutral-600">· Agente IA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => setMin(v => !v)}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#1C1C1C] transition-colors cursor-pointer"
              >
                <Minimize2 className="w-3 h-3 text-neutral-500 hover:text-white" />
              </button>
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#1C1C1C] transition-colors cursor-pointer"
              >
                <X className="w-3 h-3 text-neutral-500 hover:text-white" />
              </button>
            </div>
          </div>

          {!minimized && (<>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 mt-0.5 mr-1.5">
                      <Image src="/logo.png" alt="FraudSweep" width={20} height={20} className="w-full h-full object-cover" />
                    </div>
                  )}
                  {m.role === 'user' ? (
                    <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed bg-[#C8FF00] text-black rounded-br-none font-medium">
                      {m.content}
                    </div>
                  ) : (
                    <div className="max-w-[90%] px-3 py-2 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] rounded-bl-none overflow-hidden">
                      <MarkdownContent content={m.content} className="text-xs" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 mt-0.5 mr-1.5">
                    <Image src="/logo.png" alt="FraudSweep" width={20} height={20} className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-[#1C1C1C] border border-[#2A2A2A] px-3 py-2 rounded-xl rounded-bl-none">
                    <div className="flex gap-1 items-center">
                      {[0, 150, 300].map(d => (
                        <div key={d} className="w-1.5 h-1.5 bg-[#C8FF00] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick questions */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex flex-col gap-1 flex-shrink-0">
                {QUICK.map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    disabled={loading}
                    className="text-left text-[10px] text-neutral-400 hover:text-white bg-[#1A1A1A] hover:bg-[#222] border border-[#2A2A2A] hover:border-[#C8FF00]/20 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex-none px-3 py-2.5 border-t border-[#2A2A2A] bg-[#0F0F0F] flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
                placeholder="Pregunta sobre siniestros..."
                className="flex-1 bg-[#1C1C1C] text-white text-xs px-3 py-2 rounded-lg border border-[#2A2A2A] focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600 transition-colors"
                disabled={loading}
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="w-8 h-8 bg-[#C8FF00] hover:bg-[#d4ff33] disabled:bg-[#1C1C1C] disabled:text-neutral-700 text-black rounded-lg flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </>)}
        </div>
      )}

      {/* ── Bubble button ───────────────────────────────────────────────────── */}
      <button
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
        onTouchStart={e => { const t = e.touches[0]; if (t) startDrag(t.clientX, t.clientY) }}
        onMouseUp={handleBubbleClick}
        onTouchEnd={handleBubbleClick}
        className={[
          'relative w-14 h-14 bg-[#0f0f0f] border-2 border-[#C8FF00]/60 text-white rounded-full shadow-2xl',
          'flex items-center justify-center transition-colors duration-200',
          'select-none touch-none',
          dragging ? 'cursor-ns-resize scale-95 border-[#C8FF00]' : 'cursor-ns-resize hover:bg-[#161616] hover:border-[#C8FF00] hover:scale-105',
        ].join(' ')}
        title="Arrastra para mover · Click para abrir"
      >
        {open && !dragging
          ? <X className="w-5 h-5 text-[#C8FF00]" />
          : <Image src="/logo.png" alt="FraudSweep" width={34} height={34} className="rounded-full object-cover pointer-events-none" />
        }
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
        {!open && !dragging && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#C8FF00] rounded-full animate-ping opacity-60" />
        )}
      </button>
    </div>
  )
}
