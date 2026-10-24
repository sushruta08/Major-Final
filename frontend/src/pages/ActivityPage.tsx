import { motion } from 'framer-motion'
import { Shield, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { usePipelines } from '../hooks/useScans'
import { useVulnerabilities } from '../hooks/useVulnerabilities'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'

export function ActivityPage() {
  const { data: pipelines, isLoading: loadingPipelines } = usePipelines()
  const { data: vulns, isLoading: loadingVulns } = useVulnerabilities({ status: 'open' })

  if (loadingPipelines || loadingVulns) return <PageLoader />

  const recentPipelines = (pipelines || []).slice(0, 10)
  const criticalVulns = (vulns || []).filter((v: any) => v.severity === 'critical').slice(0, 5)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-100">Activity Feed</h1>
        <p className="text-sm text-slate-500 mt-0.5">Live security events and pipeline activity</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[
          { label: 'Total Pipelines', value: (pipelines || []).length, icon: Zap, color: 'text-cyber-400' },
          { label: 'Running Now', value: (pipelines || []).filter((p: any) => p.status === 'running').length, icon: Shield, color: 'text-yellow-400' },
          { label: 'Open Critical', value: criticalVulns.length, icon: AlertTriangle, color: 'text-red-400' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 bg-dark-700/50 rounded-xl"><Icon className={`w-5 h-5 ${s.color}`} /></div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pipelines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Recent Pipelines</h3>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />Live
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {recentPipelines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                <Zap className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No pipeline runs yet</p>
              </div>
            ) : recentPipelines.map((p: any, i: number) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-5 py-3 border-b border-dark-700/30 last:border-0 hover:bg-dark-700/10 transition-colors">
                <div className={`p-1.5 rounded-md flex-shrink-0 ${p.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10' : p.status === 'failed' ? 'text-red-400 bg-red-500/10' : p.status === 'running' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 bg-dark-700/50'}`}>
                  {p.status === 'completed' ? <CheckCircle className="w-3.5 h-3.5" /> : p.status === 'failed' ? <XCircle className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{p.repository_name}</p>
                  <p className="text-xs text-slate-500">{p.branch} · {new Date(p.started_at).toLocaleString()}</p>
                </div>
                <Badge variant={p.status === 'completed' ? 'success' : p.status === 'failed' ? 'critical' : p.status === 'running' ? 'running' : 'pending'} size="sm">
                  {p.status}
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Critical Vulnerabilities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Open Critical Findings</h3>
            {criticalVulns.length > 0 && <Badge variant="critical" size="sm">{criticalVulns.length}</Badge>}
          </CardHeader>
          <CardContent className="p-0">
            {criticalVulns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-emerald-600">
                <CheckCircle className="w-8 h-8 mb-2" />
                <p className="text-sm font-medium text-emerald-400">No critical vulnerabilities</p>
                <p className="text-xs text-slate-600 mt-1">Your codebase looks clean</p>
              </div>
            ) : criticalVulns.map((v: any, i: number) => (
              <motion.div key={v.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 px-5 py-3 border-b border-dark-700/30 last:border-0 hover:bg-dark-700/10 transition-colors">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{v.title}</p>
                  <p className="text-xs text-slate-500">{v.scanner} {v.cve_id ? `· ${v.cve_id}` : ''}</p>
                </div>
                {v.cvss_score && <span className="text-xs font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 flex-shrink-0">{v.cvss_score}</span>}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
