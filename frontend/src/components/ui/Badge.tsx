import { cn } from '../../utils/cn'
import type { SeverityLevel } from '../../types'

interface BadgeProps {
  children: React.ReactNode
  variant?: SeverityLevel | 'default' | 'success' | 'running' | 'pending'
  className?: string
  size?: 'sm' | 'md'
}

const variantClasses: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  info: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  default: 'bg-slate-700/50 text-slate-300 border border-slate-600/50',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  running: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  pending: 'bg-slate-600/15 text-slate-400 border border-slate-600/30',
}

export function Badge({ children, variant = 'default', className, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantClasses[variant] ?? variantClasses.default,
        className
      )}
    >
      {children}
    </span>
  )
}
