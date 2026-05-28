import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import ChatBubble from '@/components/ChatBubble'

export const metadata: Metadata = {
  title: 'FraudSweep Claims Assistant',
  description: 'Sistema de apoyo para análisis de posible fraude en siniestros — Aseguradora del Sur',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="font-sans bg-[#111111] text-white min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-16 min-h-screen overflow-x-hidden">
            {children}
          </main>
        </div>
        <ChatBubble />
      </body>
    </html>
  )
}
