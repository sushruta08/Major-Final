import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Search, Code, Key, Package, Container } from 'lucide-react'
import { useVulnerabilities, useUpdateVulnerabilityStatus } from '../hooks/useVulnerabilities'
import { useRepositories } from '../hooks/useProjects'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import type { SeverityLevel } from '../types'

const SCANNERS = ['bandit', 'semgrep', 'gitleaks', 'safety', 'trivy']
const scannerIcon = (s: string) => {
  const m: Record<string, React.ComponentType<{ className?: string }>> = {
    bandit: Code, semgrep: Code, gitleaks: Key, safety: Package, trivy: Container,
  }
  return m[s] ?? Shield
}

export function ScansPage() {
  const [severity, setSeverity] = useState<SeverityLevel | 'all'>('all')
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [scanner, setScanner] = useState<string>('all')
  const [repositoryId, setRepositoryId] = useState<string>('')

  const { data: repositories } = useRepositories()
  const { data: vulnerabilities, isLoading } = useVulnerabilities({
    repository_id: repositoryId || undefined,
    severity: severity !== 'all' ? severity : undefined,
    status: status !== 'all' ? status : undefined,
    search: search || undefined,
  })
  const updateStatus = useUpdateVulnerabilityStatus()

  const filtered = (vulnerabilities || []).filter((v: any) => scanner === 'all' || v.scanner === scanner)

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Security Scans</h1>
          <p className="text-sm text-slate-500 mt-0.5">All vulnerability findings from security scanners</p>
        </div>
        <Badge variant="default">{(vulnerabilities || []).length} findings</Badge>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search CVE, title, file..."
                className="w-full bg-dark-800/80 border border-dark-700/50 text-sm text-slate-300 placeholder-slate-600 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-cyber-500/50" />
            </div>
            <select value={repositoryId} onChange={e => setRepositoryId(e.target.value)}
              className="bg-dark-800 border border-dark-700/50 text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyber-500/50">
              <option value="">All repositories</option>
              {(repositories || []).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Severity */}
            {(['all', 'critical', 'high', 'medium', 'low', 'info'] as const).map(s => (
              <button key={s} onClick={() => setSeverity(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${severity === s
                  ? s === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : s === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : s === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : s === 'low' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-cyber-500/20 text-cyber-400 border border-cyber-500/30'
                  : 'text-slate-500 hover:text-slate-300 bg-dark-700/30'
                }`}>{s}</button>
            ))}
            <div className="w-px h-6 bg-dark-600 mx-1 self-center" />
            {/* Status */}
            {(['all', 'open', 'fixed', 'accepted', 'false_positive'] as const).map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${status === s ? 'bg-dark-600 text-slate-200 border border-dark-500' : 'text-slate-500 hover:text-slate-300'}`}>
                {s.replace('_', ' ')}
              </button>
            ))}
            <div className="w-px h-6 bg-dark-600 mx-1 self-center" />
            {/* Scanner */}
            {(['all', ...SCANNERS]).map(s => {
              const Icon = s === 'all' ? Shield : scannerIcon(s)
              return (
                <button key={s} onClick={() => setScanner(s)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${scanner === s ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                  <Icon className="w-3 h-3" />{s}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Vulnerability Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Vulnerabilities</h3>
          <span className="text-xs text-slate-500">{filtered.length} results</span>
        </CardHeader>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600">
            <Shield className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No vulnerabilities found</p>
            <p className="text-xs mt-1">Try triggering a scan from the Pipelines page</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/50">
                  {['Severity', 'Vulnerability', 'Scanner', 'File', 'Status', 'CVE', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((vuln: any, i: number) => (
                  <motion.tr key={vuln.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-dark-700/30 hover:bg-dark-700/20 transition-colors group">
                    <td className="py-3 px-4">
                      <Badge variant={vuln.severity as SeverityLevel} size="sm">{vuln.severity}</Badge>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-slate-200 truncate text-xs">{vuln.title}</p>
                      {vuln.cvss_score && <p className="text-[10px] text-slate-500 mt-0.5">CVSS: {vuln.cvss_score}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-400 bg-dark-700/50 px-2 py-1 rounded font-mono">{vuln.scanner}</span>
                    </td>
                    <td className="py-3 px-4">
                      {vuln.file_path ? (
                        <span className="text-xs font-mono text-slate-500 truncate max-w-[120px] block">
                          {vuln.file_path}{vuln.line_number ? `:${vuln.line_number}` : ''}
                        </span>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={vuln.status === 'fixed' ? 'success' : vuln.status === 'open' ? 'critical' : 'pending'} size="sm">
                        {vuln.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-cyber-400 font-mono">{vuln.cve_id || '—'}</td>
                    <td className="py-3 px-4">
                      <select
                        value={vuln.status}
                        onChange={e => updateStatus.mutate({ id: vuln.id, status: e.target.value })}
                        className="text-xs bg-dark-700 border border-dark-600 text-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyber-500/50"
                      >
                        <option value="open">Open</option>
                        <option value="fixed">Fixed</option>
                        <option value="accepted">Accepted</option>
                        <option value="false_positive">False Positive</option>
                      </select>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
