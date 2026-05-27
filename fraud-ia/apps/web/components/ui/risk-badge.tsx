import { cn, getRiskColor, getRiskDotColor } from '@/lib/utils'

interface RiskBadgeProps {
  nivel: string
  className?: string
  showDot?: boolean
}

export function RiskBadge({ nivel, className, showDot = true }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        getRiskColor(nivel),
        className
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', getRiskDotColor(nivel))} />
      )}
      {nivel}
    </span>
  )
}
