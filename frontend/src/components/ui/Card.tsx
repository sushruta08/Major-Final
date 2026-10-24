import { cn } from '../../utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: 'blue' | 'purple' | 'green' | 'red' | 'none'
}

export function Card({ children, className, hover = false, glow = 'none' }: CardProps) {
  const glowClasses = {
    blue: 'hover:shadow-lg hover:shadow-cyber-500/10',
    purple: 'hover:shadow-lg hover:shadow-purple-500/10',
    green: 'hover:shadow-lg hover:shadow-emerald-500/10',
    red: 'hover:shadow-lg hover:shadow-red-500/10',
    none: '',
  }

  return (
    <div
      className={cn(
        'bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-xl',
        hover && 'transition-all duration-300 hover:border-cyber-500/30',
        glow !== 'none' && glowClasses[glow],
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-4 border-b border-dark-700/50', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-4', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-3 border-t border-dark-700/50', className)}>
      {children}
    </div>
  )
}
