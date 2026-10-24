import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Plus, FileJson, Table, File } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportService } from '../services/scanService'
import { useRepositories } from '../hooks/useProjects'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import toast from 'react-hot-toast'

const REPORT_TYPES = [
  { id: 'executive', label: 'Executive Report', desc: 'High-level summary for management', color: 'text-purple-400' },
  { id: 'developer', label: 'Developer Report', desc: 'Detailed findings with code locations', color: 'text-cyan-400' },
  { id: 'compliance', label: 'Compliance Report', desc: 'OWASP / NIST compliance mapping', color: 'text-emerald-400' },
  { id: 'owasp', label: 'OWASP Report', desc: 'OWASP Top 10 2021 assessment', color: 'text-orange-400' },
]

export function ReportsPage() {
  const qc = useQueryClient()
  const { data: reports, isLoading } = useQuery({ queryKey: ['reports'], queryFn: () => reportService.list() })
  const { data: repositories } = useRepositories()
  const [showGenerate, setShowGenerate] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'developer', format: 'json', repository_id: '' })

  const generateReport = useMutation({
    mutationFn: (payload: any) => reportService.generate(payload),
    onSuccess: (data) => {
      toast.success(`Report generated: ${data.total_findings} findings`)
      qc.invalidateQueries({ queryKey: ['reports'] })
      setShowGenerate(false)
      // Trigger download
      if (data.report_id) {
        const url = reportService.getDownloadUrl(data.report_id, form.format, form.repository_id || undefined)
        window.open(url, '_blank')
      }
    },
    onError: () => toast.error('Failed to generate report'),
  })

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return
    generateReport.mutate({ ...form, repository_id: form.repository_id || undefined })
  }

  const formatIcon = (fmt: string) => {
    if (fmt === 'pdf') return <File className="w-4 h-4 text-red-400" />
    if (fmt === 'csv') return <Table className="w-4 h-4 text-emerald-400" />
    return <FileJson className="w-4 h-4 text-cyan-400" />
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Security Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate and download security assessment reports</p>
        </div>
        <button onClick={() => setShowGenerate(!showGenerate)}
          className="flex items-center gap-2 bg-cyber-600 hover:bg-cyber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-cyber-500/25">
          <Plus className="w-4 h-4" /> Generate Report
        </button>
      </motion.div>

      {/* Report Types */}
      {showGenerate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-slate-200">Generate New Report</h3></CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {REPORT_TYPES.map(t => (
                    <button key={t.id} type="button" onClick={() => setForm(p => ({ ...p, type: t.id }))}
                      className={`p-4 bg-dark-700/30 border rounded-xl text-left transition-all hover:border-cyber-500/30 ${form.type === t.id ? 'border-cyber-500/50 bg-cyber-500/5' : 'border-dark-600/50'}`}>
                      <FileText className={`w-5 h-5 mb-2 ${t.color}`} />
                      <p className="text-sm font-semibold text-slate-200">{t.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                    placeholder="Report title..." className="bg-dark-800 border border-dark-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40" />
                  <select value={form.format} onChange={e => setForm(p => ({ ...p, format: e.target.value }))}
                    className="bg-dark-800 border border-dark-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40">
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                  </select>
                  <select value={form.repository_id} onChange={e => setForm(p => ({ ...p, repository_id: e.target.value }))}
                    className="bg-dark-800 border border-dark-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40">
                    <option value="">All repositories</option>
                    {(repositories || []).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowGenerate(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
                  <button type="submit" disabled={generateReport.isPending || !form.title}
                    className="bg-cyber-600 hover:bg-cyber-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                    {generateReport.isPending ? 'Generating...' : 'Generate & Download'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reports List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Generated Reports</h3>
          <Badge variant="default">{(reports || []).length}</Badge>
        </CardHeader>
        <CardContent className="divide-y divide-dark-700/50">
          {(reports || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-600">
              <FileText className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No reports generated yet</p>
            </div>
          ) : (reports || []).map((report: any, i: number) => (
            <motion.div key={report.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 py-3 first:pt-0 hover:bg-dark-700/10 px-1 rounded-lg -mx-1 transition-colors">
              <div className="p-2 bg-dark-700/50 rounded-lg flex-shrink-0">{formatIcon(report.format)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{report.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{report.type} · {new Date(report.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="default" size="sm">{report.type}</Badge>
                <a href={reportService.getDownloadUrl(report.id, report.format)} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-cyber-400 hover:text-cyber-300 bg-cyber-500/10 hover:bg-cyber-500/20 border border-cyber-500/20 px-3 py-1.5 rounded-lg transition-all">
                  <Download className="w-3.5 h-3.5" />{report.format.toUpperCase()}
                </a>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
