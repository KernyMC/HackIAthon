import Sidebar from '@/components/layout/Sidebar'
import ChatBubble from '@/components/ChatBubble'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-16 min-h-screen overflow-x-hidden">
        {children}
      </main>
      <ChatBubble />
    </div>
  )
}
