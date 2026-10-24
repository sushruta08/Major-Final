import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../utils/cn'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  color?: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'yellow'
  delay?: number
  large?: boolean
}

const colorConfig = {
  blue: {
    icon: 'text-cyber-400 bg-cyber-500/10 border-cyber-500/20',
    trend: 'text-cyber-400',
    glow: 'hover:shadow-cyber-500/10',
    border: 'hover:border-cyber-500/30',
  },
  purple: {
    icon: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    trend: 'text-purple-400',
    glow: 'hover:shadow-purple-500/10',
    border: 'hover:border-purple-500/30',
  },
  green: {
    icon: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    trend: 'text-emerald-400',
    glow: 'hover:shadow-emerald-500/10',
    border: 'hover:border-emerald-500/30',
  },
  red: {
    icon: 'text-red-400 bg-red-500/10 border-red-500/20',
    trend: 'text-red-400',
    glow: 'hover:shadow-red-500/10',
    border: 'hover:border-red-500/30',
  },
  orange: {
    icon: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    trend: 'text-orange-400',
    glow: 'hover:shadow-orange-500/10',
    border: 'hover:border-orange-500/30',
  },
  yellow: {
    icon: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    trend: 'text-yellow-400',
    glow: 'hover:shadow-yellow-500/10',
    border: 'hover:border-yellow-500/30',
  },
}

export function MetricCard({ title, value, subtitle, icon, trend, color = 'blue', delay = 0, large }: MetricCardProps) {
  const colors = colorConfig[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-xl p-5',
        'transition-all duration-300 cursor-default',
        'hover:shadow-lg hover:-translate-y-0.5',
        colors.glow,
        colors.border
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 font-medium truncate">{title}</p>
          <p className={cn('font-bold text-slate-100 mt-1', large ? 'text-4xl' : 'text-2xl')}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-slate-600 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.value > 0 ? (
                <TrendingUp className="w-3 h-3 text-red-400" />
              ) : trend.value < 0 ? (
                <TrendingDown className="w-3 h-3 text-emerald-400" />
              ) : (
                <Minus className="w-3 h-3 text-slate-500" />
              )}
              <span className={cn(
                'text-xs font-medium',
                trend.value > 0 ? 'text-red-400' : trend.value < 0 ? 'text-emerald-400' : 'text-slate-500'
              )}>
                {Math.abs(trend.value)}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl border flex-shrink-0',
          colors.icon
        )}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}
