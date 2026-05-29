'use client'

import { useTour } from '@reactour/tour'
import { Play } from 'lucide-react'

export function TourStartButton() {
  const { setIsOpen, setCurrentStep } = useTour()

  const handleStart = () => {
    setCurrentStep(0)
    setIsOpen(true)
  }

  return (
    <button
      onClick={handleStart}
      className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-[#2a2a2a] hover:border-[#C8FF00]/40 hover:bg-[#C8FF00]/5 text-zinc-400 hover:text-white font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer"
    >
      <Play className="w-4 h-4" />
      Ver tour guiado
    </button>
  )
}
