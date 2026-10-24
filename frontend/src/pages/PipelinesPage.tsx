import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Play, Clock, GitCommit, User, XCircle } from 'lucide-react'
import { usePipelines, useTriggerScan, useCancelPipeline } from '../hooks/useScans'
import { useRepositories } from '../hooks/useProjects'
import { PipelineVisual } from '../components/dashboard/PipelineVisual'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'

export function PipelinesPage() {
  const { data: pipelines, isLoading } = usePipelines()
  const { data: repositories } = useRepositories()
  const triggerScan = useTriggerScan()
  const cancelPipeline = useCancelPipeline()

  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [showTrigger, setShowTrigger] = useState(false)
  const [triggerForm, setTriggerForm] = useState({ repository_id: '', branch: 'main' })

  const filtered = (pipelines || []).filter((p: any) => filter === 'all' || p.status === filter)
  const selectedPipeline = selected ? (pipelines || []).find((p: any) => p.id === selected) : null

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!triggerForm.repository_id) return
    await triggerScan.mutateAsync({ repository_id: triggerForm.repository_id, branch: triggerForm.branch, trigger: 'manual' })
    setShowTrigger(false)
  }

  const statusBadge = (s: string) =>
    s === 'completed' ? 'success' : s === 'failed' ? 'critical' : s === 'running' ? 'running' : 'pending'

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">CI/CD Pipelines</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor security automation pipeline runs</p>
        </div>
        <button onClick={() => setShowTrigger(true)}
          className="flex items-center gap-2 bg-cyber-600 hover:bg-cyber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-cyber-500/25">
          <Play className="w-4 h-4" /> Trigger Pipeline
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Runs', value: (pipelines || []).length, color: 'text-slate-300' },
          { label: 'Running', value: (pipelines || []).filter((p: any) => p.status === 'running').length, color: 'text-cyan-400' },
          { label: 'Completed', value: (pipelines || []).filter((p: any) => p.status === 'completed').length, color: 'text-emerald-400' },
          { label: 'Failed', value: (pipelines || []).filter((p: any) => p.status === 'failed').length, color: 'text-red-400' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-dark-800/40 border border-dark-700/50 rounded-lg p-1 w-fit">
        {['all', 'running', 'completed', 'failed', 'pending'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${filter === f ? 'bg-cyber-500/20 text-cyber-400 border border-cyber-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-dark-800/30 border border-dashed border-dark-700 rounded-xl text-center">
          <Zap className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium mb-1">No pipelines yet</p>
          <p className="text-sm text-slate-600 mb-5">Trigger a pipeline to start scanning your repositories</p>
          <button onClick={() => setShowTrigger(true)} className="bg-cyber-600 hover:bg-cyber-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all">
            Trigger Pipeline
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {filtered.map((pipeline: any, i: number) => (
            <motion.div key={pipeline.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
              onClick={() => setSelected(pipeline.id === selected ? null : pipeline.id)}
              className={`bg-dark-800/60 backdrop-blur-md border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-cyber-500/30 ${selected === pipeline.id ? 'border-cyber-500/50 shadow-lg shadow-cyber-500/10' : 'border-dark-700/50'}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyber-400 flex-shrink-0" />
                    <p className="text-sm font-semibold text-slate-200 truncate">{pipeline.repository_name || 'Unknown'}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Branch: {pipeline.branch}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={statusBadge(pipeline.status) as any}>
                    {pipeline.status === 'running' && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-1.5 animate-pulse inline-block" />}
                    {pipeline.status}
                  </Badge>
                  {(pipeline.status === 'running' || pipeline.status === 'pending') && (
                    <button onClick={e => { e.stopPropagation(); cancelPipeline.mutate(pipeline.id) }}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {pipeline.stages?.length > 0 && <PipelineVisual pipeline={pipeline} compact />}

              <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                {pipeline.commit_sha && (
                  <span className="flex items-center gap-1">
                    <GitCommit className="w-3 h-3" />
                    <span className="font-mono">{pipeline.commit_sha?.slice(0, 7)}</span>
                  </span>
                )}
                {pipeline.triggered_by && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />{pipeline.triggered_by}
                  </span>
                )}
                {pipeline.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(pipeline.duration / 60)}m {pipeline.duration % 60}s
                  </span>
                )}
                <span>{new Date(pipeline.started_at).toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="sticky top-6">
          {selectedPipeline ? (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">Pipeline Details</h3>
                  <Badge variant={statusBadge(selectedPipeline.status) as any}>{selectedPipeline.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Repository', value: selectedPipeline.repository_name },
                      { label: 'Branch', value: selectedPipeline.branch },
                      { label: 'Trigger', value: selectedPipeline.trigger },
                      { label: 'Triggered by', value: selectedPipeline.triggered_by || 'system' },
                      { label: 'Started', value: new Date(selectedPipeline.started_at).toLocaleString() },
                      { label: 'Findings', value: selectedPipeline.total_findings || 0 },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-slate-600">{label}</p>
                        <p className="text-sm text-slate-300 mt-0.5 font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                  {selectedPipeline.stages?.length > 0 && (
                    <div className="border-t border-dark-700/50 pt-4">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Stage Results</p>
                      <PipelineVisual pipeline={selectedPipeline} compact={false} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-dark-800/30 border border-dashed border-dark-700 rounded-xl text-slate-600">
              <Zap className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Select a pipeline to view details</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showTrigger} onClose={() => setShowTrigger(false)} title="Trigger Security Scan">
        <form onSubmit={handleTrigger} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Repository *</label>
            <select value={triggerForm.repository_id} onChange={e => setTriggerForm(p => ({ ...p, repository_id: e.target.value }))} required
              className="w-full bg-dark-900 border border-dark-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40">
              <option value="">Select repository...</option>
              {(repositories || []).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Branch</label>
            <input value={triggerForm.branch} onChange={e => setTriggerForm(p => ({ ...p, branch: e.target.value }))} placeholder="main"
              className="w-full bg-dark-900 border border-dark-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40" />
          </div>
          <div className="bg-dark-700/30 rounded-lg p-3 text-xs text-slate-400">
            This will run: <span className="text-cyber-400">Bandit · Semgrep · Gitleaks · Safety · Trivy</span> in parallel
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowTrigger(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
            <button type="submit" disabled={triggerScan.isPending}
              className="bg-cyber-600 hover:bg-cyber-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
              {triggerScan.isPending ? 'Starting...' : 'Start Pipeline'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
