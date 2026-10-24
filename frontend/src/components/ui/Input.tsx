import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-dark-800 border border-dark-600 text-slate-100 placeholder-slate-500',
              'rounded-lg px-3 py-2.5 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-cyber-500/50 focus:border-cyber-500/50',
              'transition-all duration-200',
              icon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500/50 focus:ring-red-500/50',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
