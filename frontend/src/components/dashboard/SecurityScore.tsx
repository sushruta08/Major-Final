import { motion } from 'framer-motion'
import type { SecurityGrade } from '../../types'

interface SecurityScoreProps {
  score: number
  grade: SecurityGrade
  size?: 'sm' | 'md' | 'lg'
}

const gradeColors: Record<SecurityGrade, { stroke: string; text: string; bg: string }> = {
  'A+': { stroke: '#10b981', text: 'text-emerald-400', bg: 'text-emerald-300' },
  'A':  { stroke: '#22c55e', text: 'text-green-400', bg: 'text-green-300' },
  'B':  { stroke: '#3b82f6', text: 'text-blue-400', bg: 'text-blue-300' },
  'C':  { stroke: '#eab308', text: 'text-yellow-400', bg: 'text-yellow-300' },
  'D':  { stroke: '#f97316', text: 'text-orange-400', bg: 'text-orange-300' },
  'F':  { stroke: '#ef4444', text: 'text-red-400', bg: 'text-red-300' },
}

const sizeConfig = {
  sm: { r: 30, size: 70, stroke: 6, text: 'text-xl', sub: 'text-xs', grade: 'text-xs' },
  md: { r: 45, size: 110, stroke: 8, text: 'text-3xl', sub: 'text-sm', grade: 'text-sm' },
  lg: { r: 65, size: 150, stroke: 10, text: 'text-5xl', sub: 'text-base', grade: 'text-base' },
}

export function SecurityScore({ score, grade, size = 'md' }: SecurityScoreProps) {
  const colors = gradeColors[grade]
  const cfg = sizeConfig[size]
  const circumference = 2 * Math.PI * cfg.r
  const progress = (score / 100) * circumference
  const cx = cfg.size / 2
  const cy = cfg.size / 2

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: cfg.size, height: cfg.size }}>
        <svg width={cfg.size} height={cfg.size} className="-rotate-90">
          {/* Track */}
          <circle cx={cx} cy={cy} r={cfg.r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={cfg.stroke} />
          {/* Progress */}
          <motion.circle
            cx={cx} cy={cy} r={cfg.r}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={cfg.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 6px ${colors.stroke}60)` }}
          />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className={`font-bold text-slate-100 ${cfg.text}`}
          >
            {score}
          </motion.span>
          <span className={`text-slate-500 ${cfg.grade} font-medium`}>/100</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-2xl font-black ${colors.text}`}>{grade}</span>
        <span className="text-sm text-slate-500">Security Grade</span>
      </div>
    </div>
  )
}
