import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRiskColor(nivelRiesgo: string): string {
  switch (nivelRiesgo) {
    case 'Verde Bajo':
      return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'Amarillo Medio':
      return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'Rojo Alto':
      return 'bg-red-900/40 text-red-300 border border-red-700'
    default:
      return 'bg-gray-800 text-gray-300 border border-gray-600'
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
