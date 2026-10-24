import { useState } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, Plus, GitBranch, Shield, Calendar, Trash2 } from 'lucide-react'
import { useProjects, useCreateProject, useDeleteProject } from '../hooks/useProjects'
import { SecurityScore } from '../components/dashboard/SecurityScore'
import { PageLoader } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'
import type { SecurityGrade } from '../types'

export function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await createProject.mutateAsync({ name, description: desc })
    setName(''); setDesc(''); setShowCreate(false)
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your security projects and repositories</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-cyber-600 hover:bg-cyber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-cyber-500/25">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {(projects || []).map((project: any, i: number) => (
          <motion.div key={project.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-xl p-5 hover:border-cyber-500/30 hover:shadow-lg hover:shadow-cyber-500/5 transition-all duration-300 group">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-gradient-to-br from-cyber-500/20 to-purple-500/20 rounded-xl border border-cyber-500/20 flex-shrink-0">
                  <FolderOpen className="w-5 h-5 text-cyber-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyber-400 transition-colors">{project.name}</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{project.description || 'No description'}</p>
                </div>
              </div>
              <SecurityScore score={project.security_score || 100} grade={(project.grade || 'A+') as SecurityGrade} size="sm" />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { icon: GitBranch, label: 'Repos', value: project.repository_count || 0 },
                { icon: Shield, label: 'Score', value: `${project.security_score || 100}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-dark-700/30 rounded-lg p-2.5 text-center">
                  <Icon className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-slate-200">{value}</p>
                  <p className="text-[10px] text-slate-600">{label}</p>
                </div>
              ))}
              <div className="bg-dark-700/30 rounded-lg p-2.5 text-center">
                <Calendar className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-slate-400">{new Date(project.created_at).toLocaleDateString()}</p>
                <p className="text-[10px] text-slate-600">Created</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-dark-700/50">
              <button onClick={() => deleteProject.mutate(project.id)}
                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (projects?.length || 0) * 0.08 }}
          onClick={() => setShowCreate(true)}
          className="bg-dark-800/20 border-2 border-dashed border-dark-700/50 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-cyber-500/30 hover:bg-dark-800/30 transition-all min-h-[180px]">
          <div className="p-3 bg-dark-700/50 rounded-xl"><Plus className="w-6 h-6 text-slate-500" /></div>
          <p className="text-sm font-medium text-slate-400">Create New Project</p>
          <p className="text-xs text-slate-600 text-center">Start tracking security across repositories</p>
        </motion.div>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="My App"
              className="w-full bg-dark-900 border border-dark-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description" rows={3}
              className="w-full bg-dark-900 border border-dark-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40 resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
            <button type="submit" disabled={createProject.isPending}
              className="bg-cyber-600 hover:bg-cyber-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
