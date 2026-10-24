import { cn } from '../../utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }
  return (
    <svg
      className={cn('animate-spin text-cyber-500', sizeClasses[size], className)}
      fill="none" viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-cyber-500/30 rounded-full" />
          <div className="absolute top-0 left-0 w-12 h-12 border-2 border-transparent border-t-cyber-500 rounded-full animate-spin" />
        </div>
        <p className="text-sm text-slate-400 animate-pulse">Loading...</p>
      </div>
    </div>
  )
}
