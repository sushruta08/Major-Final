import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { ScannerBreakdown } from '../../types'

interface ScannerBreakdownChartProps {
  data: ScannerBreakdown[]
  height?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
        <p className="text-xs font-semibold text-slate-300 mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-400 capitalize">{entry.name}:</span>
            <span className="font-semibold text-slate-200">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function ScannerBreakdownChart({ data, height = 280 }: ScannerBreakdownChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barSize={12}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={true} vertical={false} />
        <XAxis dataKey="scanner" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
        <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" radius={[0,0,0,0]} />
        <Bar dataKey="high" stackId="a" fill="#f97316" name="High" />
        <Bar dataKey="medium" stackId="a" fill="#eab308" name="Medium" />
        <Bar dataKey="low" stackId="a" fill="#3b82f6" name="Low" radius={[3,3,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
