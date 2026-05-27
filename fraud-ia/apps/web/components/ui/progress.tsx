import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-[#2A2A2A]', className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-[#C8FF00] transition-all duration-500"
        style={{ width: `${Math.min(Math.max((value / max) * 100, 0), 100)}%` }}
      />
    </div>
  )
)
Progress.displayName = 'Progress'

export { Progress }
