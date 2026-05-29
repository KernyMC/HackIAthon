import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

export function Sk({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={cn('bg-[#1f1f1f] rounded-xl animate-pulse', className)} style={style} />
  )
}
