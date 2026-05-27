'use client'

import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Activity,
  RefreshCw,
} from 'lucide-react'
import { getKpis, getSiniestros, getProveedoresRiesgo } from '@/lib/api'
import type { KPIs, Siniestro, Proveedor } from '@/lib/types'
import { formatMoney, formatScore, getRiskColor } from '@/lib/utils'
import { RiskBadge } from '@/components/ui/risk-badge'
import Link from 'next/link'

const RISK_COLORS = {
  'Verde Bajo': '#22c55e',
  'Amarillo Medio': '#eab308',
  'Rojo Alto': '#ef4444',
}

function KPICard({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor,
  borderColor,
}: {
  label: string
  value: string
  subValue?: string
  icon: React.ElementType
  iconColor: string
  borderColor: string
}) {
  return (
    <div
      className={`rounded-xl bg-[hsl(222,47%,14%)] border ${borderColor} p-5 flex flex-col gap-3`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{label}</p>
        <div className={`${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [topSiniestros, setTopSiniestros] = useState<Siniestro[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [kpisData, siniestrosData, provData] = await Promise.all([
        getKpis(),
        getSiniestros({ limit: 10, offset: 0 }),
        getProveedoresRiesgo(5),
      ])
      setKpis(kpisData)
      setTopSiniestros(siniestrosData.items)
      setProveedores(provData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-2">Error al cargar datos</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const pieData = kpis
    ? [
        { name: 'Verde Bajo', value: kpis.casos_verdes },
        { name: 'Amarillo Medio', value: kpis.casos_amarillos },
        { name: 'Rojo Alto', value: kpis.casos_rojos },
      ]
    : []

  const barData = topSiniestros.map((s) => ({
    id: s.id_siniestro.replace('SIN-', ''),
    score: Number(formatScore(s.score_final)),
    nivel: s.nivel_riesgo,
  }))

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Resumen ejecutivo de alertas y siniestros
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Actualizado: {lastUpdated.toLocaleTimeString('es-EC')}
            </p>
          )}
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(217,33%,17%)] hover:bg-[hsl(217,33%,22%)] text-gray-300 text-sm border border-[hsl(217,33%,25%)] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          <div className="col-span-1">
            <KPICard
              label="Total siniestros"
              value={kpis.total_siniestros.toLocaleString('es-EC')}
              icon={Activity}
              iconColor="text-blue-400"
              borderColor="border-blue-800/40"
            />
          </div>
          <div className="col-span-1">
            <KPICard
              label="Casos verdes"
              value={kpis.casos_verdes.toLocaleString('es-EC')}
              subValue={`${Math.round((kpis.casos_verdes / kpis.total_siniestros) * 100)}% del total`}
              icon={ShieldCheck}
              iconColor="text-green-400"
              borderColor="border-green-800/40"
            />
          </div>
          <div className="col-span-1">
            <KPICard
              label="Casos amarillos"
              value={kpis.casos_amarillos.toLocaleString('es-EC')}
              subValue={`${Math.round((kpis.casos_amarillos / kpis.total_siniestros) * 100)}% del total`}
              icon={AlertTriangle}
              iconColor="text-yellow-400"
              borderColor="border-yellow-800/40"
            />
          </div>
          <div className="col-span-1">
            <KPICard
              label="Casos rojos"
              value={kpis.casos_rojos.toLocaleString('es-EC')}
              subValue={`${Math.round((kpis.casos_rojos / kpis.total_siniestros) * 100)}% del total`}
              icon={ShieldAlert}
              iconColor="text-red-400"
              borderColor="border-red-800/40"
            />
          </div>
          <div className="col-span-2 lg:col-span-1 xl:col-span-1">
            <KPICard
              label="Monto total reclamado"
              value={formatMoney(kpis.monto_total_reclamado)}
              icon={DollarSign}
              iconColor="text-blue-400"
              borderColor="border-[hsl(217,33%,25%)]"
            />
          </div>
          <div className="col-span-2 lg:col-span-1 xl:col-span-1">
            <KPICard
              label="Monto en casos rojos"
              value={formatMoney(kpis.monto_rojo_reclamado)}
              subValue={`${Math.round((kpis.monto_rojo_reclamado / kpis.monto_total_reclamado) * 100)}% del total`}
              icon={DollarSign}
              iconColor="text-red-400"
              borderColor="border-red-800/40"
            />
          </div>
          <div className="col-span-2 lg:col-span-1 xl:col-span-1">
            <KPICard
              label="Score promedio"
              value={formatScore(kpis.score_promedio)}
              subValue="de 100 puntos"
              icon={TrendingUp}
              iconColor="text-purple-400"
              borderColor="border-purple-800/40"
            />
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="lg:col-span-1 rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-6">
          <h2 className="text-base font-semibold text-white mb-1">
            Distribución por nivel de riesgo
          </h2>
          <p className="text-xs text-gray-500 mb-4">Semáforo de alertas</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS]}
                    opacity={0.85}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(222,47%,14%)',
                  border: '1px solid hsl(217,33%,25%)',
                  borderRadius: '8px',
                  color: '#e5e7eb',
                }}
                formatter={(value: number) => [value.toLocaleString('es-EC'), 'Casos']}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="lg:col-span-2 rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-6">
          <h2 className="text-base font-semibold text-white mb-1">
            Top 10 siniestros por score
          </h2>
          <p className="text-xs text-gray-500 mb-4">Mayor score = mayor alerta</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,20%)" />
              <XAxis
                dataKey="id"
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(222,47%,14%)',
                  border: '1px solid hsl(217,33%,25%)',
                  borderRadius: '8px',
                  color: '#e5e7eb',
                }}
                formatter={(value: number) => [value, 'Score']}
                labelFormatter={(label) => `SIN-${label}`}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={RISK_COLORS[entry.nivel as keyof typeof RISK_COLORS] || '#3b82f6'}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Providers table */}
      <div className="rounded-xl bg-[hsl(222,47%,14%)] border border-[hsl(217,33%,20%)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Top proveedores con más alertas rojas
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Proveedores que requieren mayor atención
            </p>
          </div>
          <Link
            href="/proveedores"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Ver todos →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(217,33%,20%)]">
                {['Proveedor', 'Tipo', 'Ciudad', 'Total', 'Rojos', 'Amarillos', 'Score prom.', 'Monto total'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {proveedores.map((p, i) => (
                <tr
                  key={p.id_proveedor}
                  className="border-b border-[hsl(217,33%,17%)] hover:bg-[hsl(217,33%,17%)] transition-colors"
                >
                  <td className="py-2.5 px-3 font-medium text-white">
                    {p.nombre_proveedor || p.id_proveedor}
                  </td>
                  <td className="py-2.5 px-3 text-gray-400">{p.tipo || '-'}</td>
                  <td className="py-2.5 px-3 text-gray-400">{p.ciudad || '-'}</td>
                  <td className="py-2.5 px-3 text-gray-300">{p.total_siniestros}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-red-400 font-semibold">{p.casos_rojos}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-yellow-400">{p.casos_amarillos}</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-300">
                    {formatScore(p.score_promedio)}
                  </td>
                  <td className="py-2.5 px-3 text-gray-300">
                    {formatMoney(p.monto_total_reclamado)}
                  </td>
                </tr>
              ))}
              {proveedores.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No hay datos de proveedores
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
