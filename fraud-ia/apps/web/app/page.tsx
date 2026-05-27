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
    description:
      'Cada siniestro recibe un score basado en reglas de negocio y modelo simulado. Clasificación en semáforo: Verde, Amarillo y Rojo.',
    color: 'text-blue-400',
    bg: 'bg-blue-900/20 border-blue-800',
  },
  {
    icon: MessageSquare,
    title: 'Agente IA Conversacional',
    description:
      'Consulta en lenguaje natural sobre siniestros, proveedores, documentos y reglas de negocio. El agente usa RAG + SQL para responder.',
    color: 'text-purple-400',
    bg: 'bg-purple-900/20 border-purple-800',
  },
  {
    icon: Building2,
    title: 'Análisis de Proveedores',
    description:
      'Identifica proveedores con alta concentración de alertas. Detecta patrones de concentración de siniestros sospechosos.',
    color: 'text-orange-400',
    bg: 'bg-orange-900/20 border-orange-800',
  },
  {
    icon: BookOpen,
    title: 'Base de Conocimiento RAG',
    description:
      'Documentos de negocio indexados con embeddings vectoriales. El agente consulta glosario, reglas, ética y proceso de revisión.',
    color: 'text-green-400',
    bg: 'bg-green-900/20 border-green-800',
  },
]

const stats = [
  { label: 'Score en tiempo real', icon: TrendingUp, color: 'text-blue-400' },
  { label: 'Revisión humana siempre', icon: Eye, color: 'text-green-400' },
  { label: 'Sin acusaciones automáticas', icon: AlertTriangle, color: 'text-yellow-400' },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-8 pt-16 pb-12 border-b border-[hsl(217,33%,20%)]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none" />
        <div className="relative max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-400 uppercase tracking-widest">
                Aseguradora del Sur · Hackathon 2025
              </p>
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            FraudIA{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Claims Assistant
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
            Sistema de apoyo para análisis de posible fraude en siniestros. Prioriza casos,
            explica alertas y responde preguntas en lenguaje natural mediante Inteligencia Artificial.
          </p>

          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors duration-150"
            >
              Ver Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-6 py-3 bg-[hsl(217,33%,17%)] hover:bg-[hsl(217,33%,22%)] text-gray-200 font-semibold rounded-lg border border-[hsl(217,33%,25%)] transition-colors duration-150"
            >
              <MessageSquare className="w-4 h-4" />
              Abrir Chat
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-sm text-gray-400">{s.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-12">
        <div className="max-w-5xl">
          <h2 className="text-2xl font-bold text-white mb-2">Capacidades del sistema</h2>
          <p className="text-gray-400 mb-8">
            Herramientas integradas para el analista de antifraude
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className={`rounded-xl p-6 border ${f.bg} flex gap-4`}
                >
                  <div className={`mt-0.5 flex-shrink-0 ${f.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-8 pb-12">
        <div className="max-w-5xl">
          <div className="flex items-start gap-4 p-5 rounded-xl bg-yellow-900/10 border border-yellow-800/50">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-300 mb-1">Aviso importante</p>
              <p className="text-sm text-yellow-200/70 leading-relaxed">
                Este sistema <strong>genera alertas de revisión, no acusaciones de fraude</strong>.
                Todas las decisiones sobre siniestros deben ser tomadas por un analista humano
                calificado. El uso de IA es de apoyo y priorización, nunca de resolución automática.
                No se utilizan datos personales reales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick nav */}
      <section className="px-8 pb-16">
        <div className="max-w-5xl">
          <h2 className="text-lg font-semibold text-white mb-4">Explorar el sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/dashboard', label: 'Dashboard KPIs', icon: BarChart3 },
              { href: '/siniestros', label: 'Tabla de siniestros', icon: ShieldAlert },
              { href: '/proveedores', label: 'Ranking proveedores', icon: Building2 },
              { href: '/chat', label: 'Chat con IA', icon: MessageSquare },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-[hsl(217,33%,14%)] border border-[hsl(217,33%,20%)] hover:border-blue-600/50 hover:bg-[hsl(217,33%,17%)] transition-all duration-150 text-center"
                >
                  <Icon className="w-6 h-6 text-blue-400" />
                  <span className="text-xs text-gray-300 font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
