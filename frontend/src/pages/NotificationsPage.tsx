import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, Trash2, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../services/scanService'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import toast from 'react-hot-toast'

const typeIcon = (t: string) => {
  if (t === 'critical') return <AlertTriangle className="w-4 h-4 text-red-400" />
  if (t === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-400" />
  if (t === 'success') return <CheckCircle className="w-4 h-4 text-emerald-400" />
  return <Info className="w-4 h-4 text-blue-400" />
}

const typeBg = (t: string) => {
  if (t === 'critical') return 'bg-red-500/10 border-red-500/20'
  if (t === 'warning') return 'bg-yellow-500/10 border-yellow-500/20'
  if (t === 'success') return 'bg-emerald-500/10 border-emerald-500/20'
  return 'bg-blue-500/10 border-blue-500/20'
}

export function NotificationsPage() {
  const qc = useQueryClient()
  const [unreadOnly, setUnreadOnly] = useState(false)

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => notificationService.list(unreadOnly),
    refetchInterval: 30_000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries({ queryKey: ['notifications'] }) },
  })

  const deleteNotif = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = (notifications || []).filter((n: any) => !n.is_read).length

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Notifications
            {unread > 0 && <Badge variant="critical">{unread} new</Badge>}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Security alerts and pipeline notifications</p>
        </div>
        <button onClick={() => markAllRead.mutate()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 bg-dark-800/60 border border-dark-700/50 px-4 py-2 rounded-lg transition-all">
          <Check className="w-4 h-4" /> Mark all as read
        </button>
      </motion.div>

      <div className="flex gap-2">
        {[{ label: 'All', value: false }, { label: 'Unread', value: true }].map(f => (
          <button key={f.label} onClick={() => setUnreadOnly(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${unreadOnly === f.value ? 'bg-cyber-500/20 text-cyber-400 border border-cyber-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-dark-700/50">
          {(notifications || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-600">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">Critical findings and pipeline events will appear here</p>
            </div>
          ) : (notifications || []).map((notif: any, i: number) => (
            <motion.div key={notif.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-4 p-4 hover:bg-dark-700/10 transition-colors group ${!notif.is_read ? 'bg-dark-700/10' : ''}`}>
              <div className={`p-2 rounded-lg border flex-shrink-0 ${typeBg(notif.type)}`}>{typeIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${!notif.is_read ? 'text-slate-100' : 'text-slate-300'}`}>{notif.title}</p>
                  {!notif.is_read && <div className="w-2 h-2 rounded-full bg-cyber-400 flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                <p className="text-xs text-slate-600 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {!notif.is_read && (
                  <button onClick={() => markRead.mutate(notif.id)} title="Mark as read"
                    className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-all">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => deleteNotif.mutate(notif.id)} title="Delete"
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
