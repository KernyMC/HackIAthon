'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  Building2,
  BarChart3,
  MessageSquare,
  Network,
  Home,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/siniestros', label: 'Siniestros', icon: FileText },
  { href: '/evaluar', label: 'Evaluar', icon: FilePlus },
  { href: '/reglas', label: 'Reglas', icon: ShieldAlert },
  { href: '/proveedores', label: 'Proveedores', icon: Building2 },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/chat', label: 'Agente IA', icon: MessageSquare },
  { href: '/arquitectura', label: 'Arquitectura', icon: Network },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-[#0F0F0F] border-r border-[#2A2A2A] flex flex-col items-center z-40">
      {/* Logo */}
      <div className="w-full flex items-center justify-center py-5 border-b border-[#2A2A2A]">
        <Link href="/" title="FraudSweep">
          <Image src="/logo.png" alt="FraudSweep" width={36} height={36} className="rounded-xl" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-4 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'group relative w-full flex items-center justify-center h-10 rounded-xl transition-all duration-150',
                isActive
                  ? 'bg-[#C8FF00]/10 text-[#C8FF00]'
                  : 'text-[#555555] hover:text-white hover:bg-[#1E1E1E]'
              )}
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#C8FF00] rounded-r-full" />
              )}
              {/* Tooltip */}
              <span className="absolute left-14 bg-[#1C1C1C] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#2A2A2A] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-150 shadow-xl z-50">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom disclaimer dot */}
      <div className="pb-5 flex flex-col items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-[#C8FF00] pulse-dot" title="Sistema activo" />
      </div>
    </aside>
  )
}
