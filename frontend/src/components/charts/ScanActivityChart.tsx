import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { TrendData } from '../../types'

interface ScanActivityChartProps {
  data: TrendData[]
  height?: number
  color?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-slate-100">{payload[0].value} scans</p>
      </div>
    )
  }
  return null
}

export function ScanActivityChart({ data, height = 120, color = '#0ea5e9' }: ScanActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -30 }} barSize={10}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]}
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
      </BarChart>
    </ResponsiveContainer>
  )
}
