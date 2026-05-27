import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRiskColor(nivelRiesgo: string): string {
  switch (nivelRiesgo) {
    case 'Verde Bajo':
      return 'bg-green-500/10 text-green-400 border border-green-500/20'
    case 'Amarillo Medio':
      return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
    case 'Rojo Alto':
      return 'bg-red-500/10 text-red-400 border border-red-500/20'
    default:
      return 'bg-neutral-800 text-neutral-400 border border-neutral-700'
  }
}

export function getRiskDotColor(nivelRiesgo: string): string {
  switch (nivelRiesgo) {
    case 'Verde Bajo':
      return 'bg-green-400'
    case 'Amarillo Medio':
      return 'bg-yellow-400'
    case 'Rojo Alto':
      return 'bg-red-400'
    default:
      return 'bg-gray-400'
  }
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-red-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-green-400'
}

export function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return '$0'
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return '0'
  return Math.round(score).toString()
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function truncate(str: string, maxLen: number): string {
  if (!str) return ''
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '...'
}
