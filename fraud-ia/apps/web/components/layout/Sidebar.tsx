'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Building2,
  MessageSquare,
  Network,
  ShieldAlert,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/siniestros', label: 'Siniestros', icon: FileText },
  { href: '/proveedores', label: 'Proveedores', icon: Building2 },
  { href: '/chat', label: 'Agente IA', icon: MessageSquare },
  { href: '/arquitectura', label: 'Arquitectura', icon: Network },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[hsl(222,47%,9%)] border-r border-[hsl(217,33%,20%)] flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[hsl(217,33%,20%)]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">FraudIA</p>
          <p className="text-[10px] text-gray-400 leading-tight">Claims Assistant</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
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
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[hsl(217,33%,17%)]'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[hsl(217,33%,20%)]">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Este sistema genera alertas de revisión. No acusa fraude.
        </p>
        <p className="text-[10px] text-gray-600 mt-1">
          Aseguradora del Sur © 2025
        </p>
      </div>
    </aside>
  )
}
