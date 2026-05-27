import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-blue-600/20 text-blue-300 border border-blue-600/40',
        secondary: 'bg-gray-700 text-gray-300 border border-gray-600',
        destructive: 'bg-red-900/40 text-red-300 border border-red-700',
        outline: 'border border-gray-600 text-gray-300',
        success: 'bg-green-900/40 text-green-300 border border-green-700',
        warning: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
