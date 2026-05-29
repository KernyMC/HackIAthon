import type { Metadata } from 'next'
import './globals.css'
import { AppTourProvider } from '@/components/Tour'

export const metadata: Metadata = {
  title: 'FraudSweep Claims Assistant',
  description: 'Sistema de apoyo para análisis de posible fraude en siniestros — Aseguradora del Sur',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="font-sans bg-[#111111] text-white min-h-screen">
        <AppTourProvider>
          {children}
        </AppTourProvider>
      </body>
    </html>
  )
}
