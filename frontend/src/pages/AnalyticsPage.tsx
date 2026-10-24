import { motion } from 'framer-motion'
import { BarChart3, TrendingDown, Clock, Target } from 'lucide-react'
import { useVulnerabilityTrends, useScannerBreakdown, useTopVulnerableRepos, usePipelineStats, useScanActivity } from '../hooks/useAnalytics'
import { VulnerabilityTrendChart } from '../components/charts/VulnerabilityTrendChart'
import { ScannerBreakdownChart } from '../components/charts/ScannerBreakdownChart'
import { ScanActivityChart } from '../components/charts/ScanActivityChart'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { PageLoader } from '../components/ui/Spinner'

export function AnalyticsPage() {
  const { data: trends, isLoading: loadingTrends } = useVulnerabilityTrends(6)
  const { data: scannerBreakdown } = useScannerBreakdown()
  const { data: topRepos } = useTopVulnerableRepos(5)
  const { data: pipelineStats } = usePipelineStats(30)
  const { data: scanActivity } = useScanActivity(7)

  if (loadingTrends) return <PageLoader />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-100">Security Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Historical trends, scanner performance, and risk insights</p>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pipeline Success Rate', value: `${pipelineStats?.success_rate ?? 100}%`, icon: Target, color: 'text-emerald-400' },
          { label: 'Total Pipelines (30d)', value: pipelineStats?.total ?? 0, icon: BarChart3, color: 'text-cyber-400' },
          { label: 'Failed Pipelines', value: pipelineStats?.failed ?? 0, icon: TrendingDown, color: 'text-red-400' },
          { label: 'Running Now', value: pipelineStats?.running ?? 0, icon: Clock, color: 'text-yellow-400' },
        ].map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-xl p-4 hover:border-cyber-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">{kpi.label}</p>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-slate-200">Monthly Vulnerability Trends (6 months)</h3></CardHeader>
            <CardContent>
              {(trends || []).length > 0
                ? <VulnerabilityTrendChart data={trends} height={250} />
                : <div className="h-[250px] flex items-center justify-center text-slate-600 text-sm">No trend data yet. Run scans to populate.</div>
              }
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-slate-200">Findings by Scanner</h3></CardHeader>
            <CardContent>
              {(scannerBreakdown || []).length > 0
                ? <ScannerBreakdownChart data={scannerBreakdown} height={250} />
                : <div className="h-[250px] flex items-center justify-center text-slate-600 text-sm">No scanner data yet.</div>
              }
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Scan Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-slate-200">Scan Activity (Last 7 Days)</h3></CardHeader>
          <CardContent>
            <ScanActivityChart data={scanActivity || []} height={120} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Vulnerable Repos */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-slate-200">Top Vulnerable Repositories</h3></CardHeader>
          <CardContent>
            {(topRepos || []).length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-6">No repository data yet. Connect repos and run scans.</p>
            ) : (
              <div className="space-y-3">
                {(topRepos || []).map((repo: any, i: number) => (
                  <motion.div key={repo.repository_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.07 }}
                    className="flex items-center gap-4 p-3 bg-dark-700/20 rounded-lg border border-dark-700/30 hover:border-dark-600/50 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-dark-700/50 flex items-center justify-center text-sm font-bold text-slate-400">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">{repo.repository}</p>
                      <p className="text-xs text-slate-500 truncate">{repo.url}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-300">{repo.total}</p>
                        <p className="text-[10px] text-slate-600">Total</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-bold ${repo.score >= 80 ? 'text-emerald-400' : repo.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {repo.score}
                        </p>
                        <p className="text-[10px] text-slate-600">Score</p>
                      </div>
                    </div>
                    <div className="w-20">
                      <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${repo.score >= 80 ? 'bg-emerald-500' : repo.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${repo.score}%` }} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
