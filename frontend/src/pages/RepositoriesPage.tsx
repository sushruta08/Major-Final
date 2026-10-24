import { useState } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Plus, Search, Lock, Globe, Shield, Trash2 } from 'lucide-react'
import { useRepositories, useCreateRepository, useDeleteRepository } from '../hooks/useProjects'
import { useProjects } from '../hooks/useProjects'
import { useTriggerScan } from '../hooks/useScans'
import { SecurityScore } from '../components/dashboard/SecurityScore'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/Spinner'
import type { SecurityGrade } from '../types'

export function RepositoriesPage() {
  const { data: repositories, isLoading } = useRepositories()
  const { data: projects } = useProjects()
  const createRepo = useCreateRepository()
  const deleteRepo = useDeleteRepository()
  const triggerScan = useTriggerScan()

  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ project_id: '', name: '', url: '', provider: 'github', default_branch: 'main', is_private: true })

  const filtered = (repositories || []).filter((r: any) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.url.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.project_id || !form.name || !form.url) return
    await createRepo.mutateAsync(form)
    setForm({ project_id: '', name: '', url: '', provider: 'github', default_branch: 'main', is_private: true })
    setShowCreate(false)
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Repositories</h1>
          <p className="text-sm text-slate-500 mt-0.5">Connect and scan your code repositories</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-cyber-600 hover:bg-cyber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-cyber-500/25">
          <Plus className="w-4 h-4" /> Connect Repository
        </button>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search repositories..."
          className="w-full bg-dark-800/60 border border-dark-700/50 text-sm text-slate-300 placeholder-slate-600 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-cyber-500/50 transition-all" />
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-dark-800/30 border border-dashed border-dark-700 rounded-xl">
          <GitBranch className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium mb-1">No repositories connected</p>
          <p className="text-sm text-slate-600 mb-5">Connect a GitHub, GitLab, or Bitbucket repository to start scanning</p>
          <button onClick={() => setShowCreate(true)} className="bg-cyber-600 hover:bg-cyber-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all">
            Connect Repository
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((repo: any, i: number) => (
          <motion.div key={repo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-xl p-5 hover:border-cyber-500/30 hover:shadow-lg hover:shadow-cyber-500/5 transition-all duration-300 group">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 bg-dark-700/50 rounded-lg flex-shrink-0">
                  <GitBranch className="w-4 h-4 text-cyber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-cyber-400 transition-colors">{repo.name}</p>
                  <p className="text-xs text-slate-500 truncate">{repo.provider} · {repo.default_branch}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {repo.is_private ? <Lock className="w-3.5 h-3.5 text-slate-500" /> : <Globe className="w-3.5 h-3.5 text-slate-500" />}
                <Badge variant={(repo.grade === 'A+' || repo.grade === 'A') ? 'success' : repo.grade === 'B' ? 'low' : repo.grade === 'C' ? 'medium' : 'critical'} size="sm">
                  {repo.grade || '—'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-slate-500" />
                  <span className="text-xs text-slate-500">Score:</span>
                  <span className="text-xs font-semibold text-slate-300">{repo.security_score || 0}/100</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Scans: <span className="text-slate-300 font-medium">{repo.scan_count || 0}</span></span>
                </div>
                {(repo.vulnerability_count || 0) > 0 && (
                  <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                    {repo.vulnerability_count} vulnerabilities
                  </span>
                )}
              </div>
              <SecurityScore score={repo.security_score || 100} grade={(repo.grade || 'A+') as SecurityGrade} size="sm" />
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-dark-700/50">
              <button onClick={() => triggerScan.mutate({ repository_id: repo.id, branch: repo.default_branch, trigger: 'manual' })}
                disabled={triggerScan.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-cyber-400 hover:text-cyber-300 bg-cyber-500/10 hover:bg-cyber-500/20 border border-cyber-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                <Shield className="w-3.5 h-3.5" />
                {triggerScan.isPending ? 'Starting...' : 'Scan Now'}
              </button>
              <button onClick={() => deleteRepo.mutate(repo.id)}
                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Connect Repository" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Project *</label>
            <select value={form.project_id} onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))} required
              className="w-full bg-dark-900 border border-dark-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40">
              <option value="">Select project...</option>
              {(projects || []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Repository Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="my-repo"
                className="w-full bg-dark-900 border border-dark-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Provider</label>
              <select value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
                className="w-full bg-dark-900 border border-dark-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40">
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
                <option value="bitbucket">Bitbucket</option>
                <option value="local">Local</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Repository URL *</label>
            <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} required
              placeholder="https://github.com/org/repo"
              className="w-full bg-dark-900 border border-dark-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Default Branch</label>
              <input value={form.default_branch} onChange={e => setForm(p => ({ ...p, default_branch: e.target.value }))} placeholder="main"
                className="w-full bg-dark-900 border border-dark-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="private" checked={form.is_private} onChange={e => setForm(p => ({ ...p, is_private: e.target.checked }))}
                className="w-4 h-4 accent-cyber-500" />
              <label htmlFor="private" className="text-sm text-slate-300">Private repository</label>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
            <button type="submit" disabled={createRepo.isPending}
              className="bg-cyber-600 hover:bg-cyber-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
              {createRepo.isPending ? 'Connecting...' : 'Connect Repository'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
