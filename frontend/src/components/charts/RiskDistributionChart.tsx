import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { RiskDistribution } from '../../types'

interface RiskDistributionChartProps {
  data: RiskDistribution[]
  height?: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0]
    return (
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: d.payload.color }} />
          <span className="text-sm text-slate-300">{d.name}</span>
        </div>
        <p className="text-lg font-bold text-slate-100 mt-1">{d.value}</p>
        <p className="text-xs text-slate-500">vulnerabilities</p>
      </div>
    )
  }
  return null
}

export function RiskDistributionChart({ data, height = 220 }: RiskDistributionChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.color}
                style={{ filter: `drop-shadow(0 0 6px ${entry.color}60)`, cursor: 'default' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: 30 }}>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-100">{total}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
      </div>
    </div>
  )
}
