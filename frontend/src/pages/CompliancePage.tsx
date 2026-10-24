import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, XCircle, MinusCircle, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import { useVulnerabilities } from '../hooks/useVulnerabilities'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'

// OWASP Top 10 2021 definitions
const OWASP_DEFS = [
  { id: 'A01', title: 'A01:2021 - Broken Access Control',           category: 'A01:2021' },
  { id: 'A02', title: 'A02:2021 - Cryptographic Failures',          category: 'A02:2021' },
  { id: 'A03', title: 'A03:2021 - Injection',                       category: 'A03:2021' },
  { id: 'A04', title: 'A04:2021 - Insecure Design',                 category: 'A04:2021' },
  { id: 'A05', title: 'A05:2021 - Security Misconfiguration',       category: 'A05:2021' },
  { id: 'A06', title: 'A06:2021 - Vulnerable & Outdated Components', category: 'A06:2021' },
  { id: 'A07', title: 'A07:2021 - Identification & Auth Failures',  category: 'A07:2021' },
  { id: 'A08', title: 'A08:2021 - Software & Data Integrity Failures', category: 'A08:2021' },
  { id: 'A09', title: 'A09:2021 - Security Logging & Monitoring Failures', category: 'A09:2021' },
  { id: 'A10', title: 'A10:2021 - Server-Side Request Forgery',     category: 'A10:2021' },
]

const statusIcon = (s: string) => {
  if (s === 'pass') return <CheckSquare className="w-4 h-4 text-emerald-400" />
  if (s === 'fail') return <XCircle className="w-4 h-4 text-red-400" />
  return <MinusCircle className="w-4 h-4 text-slate-500" />
}
const statusVariant = (s: string) => s === 'pass' ? 'success' as const : s === 'fail' ? 'critical' as const : 'default' as const

export function CompliancePage() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [activeStandard, setActiveStandard] = useState('OWASP Top 10')
  const { data: vulnerabilities, isLoading } = useVulnerabilities()

  if (isLoading) return <PageLoader />

  // Build OWASP mapping from real vulnerability data
  const owaspItems = OWASP_DEFS.map(def => {
    const matching = (vulnerabilities || []).filter((v: any) =>
      v.owasp_category === def.category && v.status === 'open'
    )
    const topSeverity = matching.length === 0 ? 'info' : matching.reduce((worst: string, v: any) => {
      const order: Record<string, number> = { critical: 5, high: 4, medium: 3, low: 2, info: 1 }
      return (order[v.severity] || 0) > (order[worst] || 0) ? (v.severity || 'info') : worst
    }, 'info')
    return {
      ...def,
      status: matching.length === 0 ? 'pass' : 'fail',
      severity: topSeverity,
      findings: matching.length,
      desc: matching.length === 0
        ? `No open vulnerabilities mapped to ${def.category}.`
        : `${matching.length} open finding${matching.length > 1 ? 's' : ''}: ${matching.slice(0, 2).map((v: any) => v.title).join('; ')}${matching.length > 2 ? '...' : ''}`,
      vulns: matching,
    }
  })

  const passed = owaspItems.filter(i => i.status === 'pass').length
  const failed = owaspItems.filter(i => i.status === 'fail').length
  const score = Math.round((passed / owaspItems.length) * 100)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-100">Compliance Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Real-time OWASP Top 10, CWE, CVE compliance status based on scan findings</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Compliance Score', value: `${score}%`, color: score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400' },
          { label: 'Passed', value: passed, color: 'text-emerald-400' },
          { label: 'Failed', value: failed, color: 'text-red-400' },
          { label: 'Total Findings', value: (vulnerabilities || []).filter((v: any) => v.status === 'open').length, color: 'text-orange-400' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Score bar */}
      <div className="bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-300">OWASP Top 10 2021 Compliance</p>
          <span className={`text-sm font-bold ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{score}%</span>
        </div>
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ delay: 0.3, duration: 0.8 }}
            className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
        </div>
        <p className="text-xs text-slate-500 mt-1">{passed} of {owaspItems.length} categories passing · {failed} require remediation</p>
      </div>

      {/* Standard Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['OWASP Top 10', 'CWE', 'NIST', 'MITRE ATT&CK'].map(std => (
          <button key={std} onClick={() => setActiveStandard(std)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeStandard === std ? 'bg-cyber-500/20 text-cyber-400 border border-cyber-500/30' : 'text-slate-500 hover:text-slate-300 bg-dark-800/40 border border-dark-700/50'
            }`}>
            {std}
          </button>
        ))}
      </div>

      {/* OWASP List */}
      {activeStandard === 'OWASP Top 10' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">OWASP Top 10 2021 — Assessment Results</h3>
            <span className="text-xs text-slate-500">Based on {(vulnerabilities || []).length} real scan findings</span>
          </CardHeader>
          <CardContent className="space-y-2">
            {owaspItems.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-lg border border-dark-700/30 overflow-hidden">
                <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-dark-700/20 transition-colors">
                  {statusIcon(item.status)}
                  <span className="text-xs font-mono text-slate-400 font-bold w-8 flex-shrink-0">{item.id}</span>
                  <span className="text-sm text-slate-200 text-left flex-1">{item.title.split(' - ')[1]}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.findings > 0 && (
                      <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                        {item.findings} finding{item.findings > 1 ? 's' : ''}
                      </span>
                    )}
                    <Badge variant={statusVariant(item.status)} size="sm">{item.status}</Badge>
                    {expanded === item.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>
                {expanded === item.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="px-4 pb-3 pt-1 bg-dark-800/30 border-t border-dark-700/30">
                    <p className="text-sm text-slate-400 mb-2">{item.desc}</p>
                    {item.vulns.length > 0 && (
                      <div className="space-y-1.5">
                        {item.vulns.slice(0, 3).map((v: any) => (
                          <div key={v.id} className="flex items-center gap-2 text-xs text-slate-500 bg-dark-700/30 rounded-lg px-3 py-1.5">
                            <Badge variant={(v.severity as any) || 'default'} size="sm">{v.severity || 'info'}</Badge>
                            <span className="truncate">{v.title}</span>
                            {v.cve_id && <span className="text-cyber-400 font-mono ml-auto flex-shrink-0">{v.cve_id}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={(item.severity && ['critical','high','medium','low','info'].includes(item.severity) ? item.severity : 'default') as any} size="sm">
                        {item.severity || 'info'}
                      </Badge>
                      <span className="text-xs text-slate-500">Reference: {item.category}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Other standards placeholder */}
      {activeStandard !== 'OWASP Top 10' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-slate-600">
            <Shield className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-400">{activeStandard} mapping</p>
            <p className="text-xs mt-1">Run more scans to populate {activeStandard} compliance data</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
