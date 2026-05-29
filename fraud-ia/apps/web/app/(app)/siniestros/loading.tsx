import { Sk } from '@/components/ui/skeleton'

export default function SiniestrosLoading() {
  return (
    <div className="bg-[#111111] min-h-screen p-8">

      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div className="space-y-2">
          <Sk className="h-3 w-14 rounded" />
          <Sk className="h-10 w-44 rounded-lg" />
          <Sk className="h-3 w-36 rounded" />
        </div>
        <Sk className="h-10 w-36 rounded-xl" />
      </div>

      {/* KPI strip — 5 cards */}
      <div className="grid grid-cols-5 gap-2.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] px-5 py-5 text-center space-y-2">
            <Sk className="h-3 w-20 rounded mx-auto" />
            <Sk className="h-9 w-16 rounded-lg mx-auto" />
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2.5 mb-4 p-3.5 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A]">
        <Sk className="h-8 w-10 rounded-lg" />
        <Sk className="h-8 w-44 rounded-lg" />
        <Sk className="h-8 w-32 rounded-lg" />
        <Sk className="h-8 flex-1 rounded-lg" />
        <Sk className="h-8 w-28 rounded-lg" />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-6 px-4 py-3 border-b border-[#222] bg-[#191919]">
          {[60, 80, 60, 80, 60, 100, 70, 100].map((w, i) => (
            <Sk key={i} className={`h-2.5 rounded w-${w === 60 ? '16' : w === 80 ? '20' : w === 100 ? '24' : '18'}`} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-6 px-4 py-3 border-b border-[#1a1a1a]"
            style={{ opacity: 1 - i * 0.06 }}
          >
            <Sk className="h-3 w-16 rounded" />
            <Sk className="h-3 w-20 rounded" />
            <Sk className="h-3 w-14 rounded" />
            <Sk className="h-3 w-20 rounded" />
            <Sk className="h-3 w-16 rounded" />
            <div className="flex items-center gap-2 w-24">
              <Sk className="h-3 w-8 rounded" />
              <Sk className="h-1.5 flex-1 rounded-full" />
            </div>
            <Sk className="h-5 w-18 rounded-full" />
            <Sk className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
