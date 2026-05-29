import { Sk } from '@/components/ui/skeleton'

export default function ProveedoresLoading() {
  return (
    <div className="bg-[#111111] min-h-screen p-8">

      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div className="space-y-2">
          <Sk className="h-3 w-14 rounded" />
          <Sk className="h-10 w-48 rounded-lg" />
          <Sk className="h-3 w-52 rounded" />
        </div>
        <Sk className="h-10 w-36 rounded-xl" />
      </div>

      {/* Disclaimer bar */}
      <Sk className="h-10 w-full rounded-xl mb-6" />

      {/* Top 3 cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#161616] border border-[#242424] overflow-hidden"
            style={{ borderLeft: '3px solid #2a2a2a' }}
          >
            <div className="p-5 space-y-4">
              {/* Name + rank */}
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1 pr-3">
                  <Sk className="h-4 w-3/4 rounded" />
                  <Sk className="h-3 w-1/2 rounded" />
                </div>
                <Sk className="h-8 w-8 rounded-xl flex-shrink-0" />
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(j => (
                  <div key={j} className="bg-[#1e1e1e] rounded-xl p-2.5 space-y-2">
                    <Sk className="h-6 w-8 rounded mx-auto" />
                    <Sk className="h-2 w-10 rounded mx-auto" />
                  </div>
                ))}
              </div>
              {/* Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Sk className="h-2.5 w-28 rounded" />
                  <Sk className="h-2.5 w-12 rounded" />
                </div>
                <Sk className="h-2 w-full rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#161616] border border-[#242424] overflow-hidden">
        {/* Table header bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#222]">
          <Sk className="h-4 w-4 rounded" />
          <Sk className="h-3 w-32 rounded" />
          <Sk className="h-3 w-36 rounded" />
        </div>
        {/* Column headers */}
        <div className="flex items-center gap-6 px-4 py-3 border-b border-[#1f1f1f] bg-[#111]">
          {[20, 60, 50, 50, 80, 40, 40, 40, 40, 60, 30].map((w, i) => (
            <Sk key={i} className="h-2.5 rounded flex-shrink-0" style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-6 px-4 py-3.5 border-b border-[#1a1a1a]"
            style={{ opacity: 1 - i * 0.08 }}
          >
            <Sk className="h-3 w-5 rounded flex-shrink-0" />
            <div className="space-y-1.5 w-36 flex-shrink-0">
              <Sk className="h-3 w-full rounded" />
              <Sk className="h-2.5 w-2/3 rounded" />
            </div>
            <Sk className="h-3 w-20 rounded flex-shrink-0" />
            <Sk className="h-3 w-16 rounded flex-shrink-0" />
            <div className="flex items-center gap-2 w-36 flex-shrink-0">
              <Sk className="h-2 flex-1 rounded-full" />
              <Sk className="h-3 w-8 rounded" />
            </div>
            <Sk className="h-3 w-8 rounded flex-shrink-0" />
            <Sk className="h-3 w-8 rounded flex-shrink-0" />
            <Sk className="h-3 w-8 rounded flex-shrink-0" />
            <Sk className="h-3 w-10 rounded flex-shrink-0" />
            <Sk className="h-3 w-16 rounded flex-shrink-0" />
            <Sk className="h-3 w-4 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
