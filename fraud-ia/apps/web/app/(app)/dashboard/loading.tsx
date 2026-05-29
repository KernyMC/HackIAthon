import { Sk } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="bg-[#111111] min-h-screen p-8">

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div className="space-y-2">
          <Sk className="h-3 w-20 rounded" />
          <Sk className="h-10 w-48 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Sk className="h-9 w-28 rounded-xl" />
          <Sk className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* KPI row — 4 cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5 space-y-3">
            <div className="flex justify-between items-center">
              <Sk className="h-3 w-24 rounded" />
              <Sk className="h-7 w-7 rounded-lg" />
            </div>
            <Sk className="h-8 w-20 rounded-lg" />
            <Sk className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Chart row — 4 cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[3, 3, 3, 3].map((_, i) => (
          <div key={i} className="rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
            <Sk className="h-3 w-28 rounded mb-4" />
            <Sk className="h-40 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Wide chart row — 5 + 7 cols */}
      <div className="grid grid-cols-12 gap-4 mb-5">
        <div className="col-span-5 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
          <Sk className="h-3 w-32 rounded mb-4" />
          <Sk className="h-36 w-full rounded-xl" />
          <div className="flex gap-3 mt-3">
            {[1,2,3].map(j => <Sk key={j} className="h-3 w-16 rounded" />)}
          </div>
        </div>
        <div className="col-span-7 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
          <Sk className="h-3 w-40 rounded mb-4" />
          <Sk className="h-36 w-full rounded-xl" />
        </div>
      </div>

      {/* Bottom row — 7 + 5 cols */}
      <div className="grid grid-cols-12 gap-4 mb-5">
        <div className="col-span-7 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5">
          <Sk className="h-3 w-44 rounded mb-4" />
          <Sk className="h-52 w-full rounded-xl" />
        </div>
        <div className="col-span-5 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] p-5 space-y-3">
          <Sk className="h-3 w-36 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Sk className="h-3 w-32 rounded" />
              <Sk className="h-3 w-10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
