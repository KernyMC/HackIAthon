import Link from 'next/link'
import {
  ShieldAlert,
  BarChart3,
  MessageSquare,
  Building2,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Eye,
} from 'lucide-react'

const features = [
  {
    icon: BarChart3,
    title: 'Score de Riesgo',
    description: 'Score basado en reglas de negocio y modelo simulado. Semáforo: Verde, Amarillo, Rojo.',
    accent: '#C8FF00',
  },
  {
    icon: MessageSquare,
    title: 'Agente IA Conversacional',
    description: 'Consulta en lenguaje natural sobre siniestros, proveedores y reglas. RAG + SQL.',
    accent: '#C8FF00',
  },
  {
    icon: Building2,
    title: 'Análisis de Proveedores',
    description: 'Identifica proveedores con alta concentración de alertas y patrones sospechosos.',
    accent: '#FF6500',
  },
  {
    icon: BookOpen,
    title: 'Base de Conocimiento RAG',
    description: 'Documentos indexados con embeddings vectoriales: glosario, reglas y ética.',
    accent: '#FF6500',
  },
]

const quickLinks = [
  { href: '/dashboard', label: 'Dashboard',    sub: 'KPIs y alertas',            icon: BarChart3 },
  { href: '/siniestros', label: 'Siniestros',  sub: 'Tabla completa',            icon: ShieldAlert },
  { href: '/proveedores', label: 'Proveedores', sub: 'Ranking de riesgo',         icon: Building2 },
  { href: '/chat',        label: 'Chat IA',     sub: 'Consulta en lenguaje natural', icon: MessageSquare },
]

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-[#111111] flex flex-col">

      {/* ── Main content ── centered vertically */}
      <div className="flex-1 flex flex-col justify-center min-h-0 px-10 py-6 max-w-5xl mx-auto w-full gap-7">

        {/* Hero */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8FF00]/10 border border-[#C8FF00]/20 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] pulse-dot" />
            <span className="text-[11px] font-medium text-[#C8FF00] tracking-wider uppercase">
              Aseguradora del Sur · HackIAthon 2025
            </span>
          </div>

          <h1 className="text-5xl font-bold text-white mb-3 leading-none tracking-tight">
            FRAUD<span className="text-[#C8FF00]">IA</span>
            <span className="text-3xl text-neutral-400 ml-3 font-semibold">Claims Assistant</span>
          </h1>

          <p className="text-sm text-neutral-400 mb-5 max-w-lg leading-relaxed">
            Sistema de apoyo para análisis de posible fraude en siniestros.
            Prioriza casos, explica alertas y responde preguntas mediante IA.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C8FF00] hover:bg-[#d4ff33] text-black font-semibold rounded-xl text-sm transition-colors duration-150"
            >
              Ver Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1C1C] hover:bg-[#242424] text-white font-semibold rounded-xl text-sm border border-[#2A2A2A] transition-colors duration-150"
            >
              <MessageSquare className="w-4 h-4" />
              Abrir Chat
            </Link>
            <div className="flex items-center gap-5 ml-2">
              {[
                { icon: TrendingUp,   label: 'Score en tiempo real' },
                { icon: Eye,          label: 'Revisión humana siempre' },
                { icon: AlertTriangle, label: 'Sin acusaciones automáticas' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3 text-[#C8FF00]" />
                  <span className="text-xs text-neutral-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-4 gap-3">
          {quickLinks.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 p-4 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] hover:border-[#C8FF00]/30 hover:bg-[#1E1E1E] transition-all duration-150"
              >
                <div className="w-9 h-9 rounded-lg bg-[#C8FF00]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#C8FF00]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight">{item.label}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{item.sub}</p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Features */}
        <div>
          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-3">
            Capacidades
          </p>
          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="rounded-xl p-4 bg-[#1C1C1C] border border-[#2A2A2A] flex gap-3 hover:border-[#333] transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${f.accent}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: f.accent }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm mb-0.5">{f.title}</h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* ── Disclaimer — docked bottom ── */}
      <div className="flex-none px-10 py-3 border-t border-[#1A1A1A]">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-[#FF6500] flex-shrink-0" />
          <p className="text-xs text-neutral-600 leading-relaxed">
            <span className="font-semibold text-[#FF6500]">Aviso:</span>{' '}
            Sistema de apoyo a la revisión. No acusa fraude ni rechaza siniestros automáticamente.
            Todas las decisiones son responsabilidad del analista humano. Datos 100% sintéticos.
          </p>
        </div>
      </div>

    </div>
  )
}
