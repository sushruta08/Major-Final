import { motion } from 'framer-motion'
import { Shield, AlertTriangle, Zap, GitBranch, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useDashboardMetrics } from '../hooks/useDashboard'
import { MetricCard } from '../components/dashboard/MetricCard'
import { SecurityScore } from '../components/dashboard/SecurityScore'
import { VulnerabilityTrendChart } from '../components/charts/VulnerabilityTrendChart'
import { RiskDistributionChart } from '../components/charts/RiskDistributionChart'
import { ScanActivityChart } from '../components/charts/ScanActivityChart'
import { VulnerabilityTable } from '../components/dashboard/VulnerabilityTable'
import { PipelineVisual } from '../components/dashboard/PipelineVisual'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import type { SecurityGrade } from '../types'

export function DashboardPage() {
  const { user } = useAuthStore()
  const { data: metrics, isLoading, refetch } = useDashboardMetrics()

  if (isLoading) return <PageLoader />
  if (!metrics) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-3">
      <Shield className="w-12 h-12 opacity-30" />
      <p className="text-sm">Could not connect to backend.</p>
      <p className="text-xs">Make sure the backend is running on <code className="text-cyber-400">http://localhost:8000</code></p>
      <button onClick={() => refetch()} className="text-xs bg-cyber-600 text-white px-4 py-2 rounded-lg hover:bg-cyber-500 transition-all">
        Retry
      </button>
    </div>
  )

  const totalVulns = metrics.total_vulnerabilities || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Security Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back, <span className="text-cyber-400">{user?.full_name}</span>
            {metrics.last_scan && ` · Last scan: ${new Date(metrics.last_scan).toLocaleString()}`}
          </p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 bg-dark-800/60 border border-dark-700/50 px-4 py-2 rounded-lg transition-all hover:border-cyber-500/30">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Security Score" value={`${metrics.security_score}/100`}
          subtitle={`Grade: ${metrics.grade}`} icon={<Shield className="w-5 h-5" />} color="blue" delay={0} />
        <MetricCard title="Critical Issues" value={metrics.critical_count}
          subtitle="Requires immediate action" icon={<AlertTriangle className="w-5 h-5" />} color="red" delay={0.05} />
        <MetricCard title="Active Pipelines" value={metrics.active_pipelines}
          subtitle={`${metrics.total_scans} total scans`} icon={<Zap className="w-5 h-5" />} color="purple" delay={0.1} />
        <MetricCard title="Repositories" value={metrics.repositories_count}
          subtitle={`Across ${metrics.projects_count} projects`} icon={<GitBranch className="w-5 h-5" />} color="green" delay={0.15} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Vulnerabilities" value={totalVulns} icon={<AlertTriangle className="w-5 h-5" />} color="orange" delay={0.2} />
        <MetricCard title="High Severity" value={metrics.high_count} icon={<AlertTriangle className="w-5 h-5" />} color="orange" delay={0.25} />
        <MetricCard title="Medium" value={metrics.medium_count} icon={<AlertTriangle className="w-5 h-5" />} color="yellow" delay={0.3} />
        <MetricCard title="Low" value={metrics.low_count} icon={<AlertTriangle className="w-5 h-5" />} color="blue" delay={0.35} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader><h3 className="text-sm font-semibold text-slate-200">Security Posture</h3></CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <SecurityScore score={metrics.security_score} grade={metrics.grade as SecurityGrade} size="lg" />
              <div className="w-full space-y-2.5">
                {([
                  { label: 'Critical', count: metrics.critical_count, color: 'bg-red-500' },
                  { label: 'High', count: metrics.high_count, color: 'bg-orange-500' },
                  { label: 'Medium', count: metrics.medium_count, color: 'bg-yellow-500' },
                  { label: 'Low', count: metrics.low_count, color: 'bg-blue-500' },
                ] as const).map(({ label, count, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-12">{label}</span>
                    <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: totalVulns > 0 ? `${(count / totalVulns) * 100}%` : '0%' }}
                        transition={{ delay: 0.5, duration: 0.8 }} className={`h-full ${color} rounded-full`} />
                    </div>
                    <span className="text-xs font-semibold text-slate-300 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Vulnerability Trend</h3>
            </CardHeader>
            <CardContent>
              <VulnerabilityTrendChart data={metrics.monthly_trends || []} height={220} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-slate-200">Risk Distribution</h3></CardHeader>
            <CardContent>
              <RiskDistributionChart data={metrics.risk_distribution || []} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-slate-200">Scan Activity (7 days)</h3></CardHeader>
            <CardContent>
              <ScanActivityChart data={metrics.scan_trend || []} height={150} />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="bg-dark-700/30 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-slate-100">{metrics.total_scans}</p>
                  <p className="text-xs text-slate-500">Total Scans</p>
                </div>
                <div className="bg-dark-700/30 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-emerald-400">{metrics.active_pipelines > 0 ? 'Active' : 'Idle'}</p>
                  <p className="text-xs text-slate-500">Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-slate-200">Scanner Stats</h3></CardHeader>
            <CardContent className="space-y-3">
              {(metrics.scanner_stats || []).map((stat: any, i: number) => (
                <motion.div key={stat.scanner} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-300 capitalize">{stat.scanner}</span>
                      <span className="text-xs text-slate-500">{stat.findings} findings</span>
                    </div>
                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyber-500 to-purple-500 rounded-full"
                        style={{ width: `${Math.min((stat.findings / 50) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 flex-shrink-0">
                    {stat.critical} crit
                  </span>
                </motion.div>
              ))}
              {(metrics.scanner_stats || []).length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">No scan data yet. Trigger a scan to populate stats.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Pipelines */}
      {(metrics.recent_pipelines || []).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Recent Pipelines</h3>
              <Badge variant="running" size="sm">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-1 animate-pulse inline-block" />
                {metrics.active_pipelines} running
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {(metrics.recent_pipelines || []).slice(0, 3).map((pipeline: any) => (
                <div key={pipeline.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{pipeline.repository_name}</p>
                      <p className="text-xs text-slate-500">{pipeline.branch} · <span className="font-mono">{pipeline.commit_sha?.slice(0, 7)}</span></p>
                    </div>
                    <Badge variant={pipeline.status === 'completed' ? 'success' : pipeline.status === 'failed' ? 'critical' : pipeline.status === 'running' ? 'running' : 'pending'}>
                      {pipeline.status}
                    </Badge>
                  </div>
                  {pipeline.stages?.length > 0 && <PipelineVisual pipeline={pipeline} compact />}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top Vulnerabilities */}
      {(metrics.top_vulnerabilities || []).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Critical &amp; High Vulnerabilities</h3>
            </CardHeader>
            <VulnerabilityTable vulnerabilities={metrics.top_vulnerabilities} />
          </Card>
        </motion.div>
      )}

      {/* Empty state */}
      {metrics.total_scans === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center py-16 bg-dark-800/30 border border-dashed border-dark-700 rounded-xl text-center">
          <Shield className="w-14 h-14 text-slate-700 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No scans yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md">
            Connect a repository and trigger your first security scan to populate the dashboard with real data.
          </p>
          <a href="/repositories" className="bg-cyber-600 hover:bg-cyber-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all">
            Connect Repository →
          </a>
        </motion.div>
      )}
    </div>
  )
}
