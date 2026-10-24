import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'

const ACTION_COLORS: Record<string, string> = {
  CREATE_PROJECT: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  TRIGGER_SCAN: 'text-cyber-400 bg-cyber-500/10 border-cyber-500/20',
  MARK_FALSE_POSITIVE: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  DELETE_REPOSITORY: 'text-red-400 bg-red-500/10 border-red-500/20',
  USER_LOGIN: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  UPDATE_STATUS: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

export function AuditLogsPage() {
  const [search, setSearch] = useState('')

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/audit-logs/')
        return data
      } catch {
        return []
      }
    },
  })

  const filtered = (logs || []).filter((log: any) =>
    !search ||
    log.username?.toLowerCase().includes(search.toLowerCase()) ||
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.resource_type?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-100">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">Complete activity trail for compliance and security review</p>
      </motion.div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..."
            className="w-full bg-dark-800/60 border border-dark-700/50 text-sm text-slate-300 placeholder-slate-600 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-cyber-500/50 transition-all" />
        </div>
        <button className="flex items-center gap-2 text-sm text-slate-400 bg-dark-800/60 border border-dark-700/50 px-3 py-2 rounded-lg hover:border-dark-600 transition-all">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Activity Log</h3>
          <Badge variant="default">{filtered.length} entries</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-600">
              <p className="text-sm">No audit log entries yet</p>
              <p className="text-xs mt-1">Actions performed in the platform will be recorded here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-dark-700/50">
                  <tr>
                    {['Timestamp', 'User', 'Action', 'Resource', 'IP Address'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log: any, i: number) => (
                    <motion.tr key={log.id || i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-dark-700/30 hover:bg-dark-700/10 transition-colors">
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold">
                            {(log.username || 'U')[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-slate-300">{log.username || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${ACTION_COLORS[log.action] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-slate-300 capitalize">{log.resource_type}</p>
                        {log.resource_id && <p className="text-[10px] font-mono text-slate-600 truncate max-w-[100px]">{log.resource_id}</p>}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">{log.ip_address || '—'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
