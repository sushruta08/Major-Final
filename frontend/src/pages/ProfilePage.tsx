import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Shield, Calendar, Edit2, Save, Key } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import toast from 'react-hot-toast'

const ROLE_COLORS: Record<string, any> = {
  admin: 'critical', security_engineer: 'medium', developer: 'running', project_manager: 'success',
}

export function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: user?.full_name ?? '', email: user?.email ?? '' })
  const [pwForm, setPwForm] = useState({ current: '', next: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const updated = await authService.updateProfile(form)
      updateUser(updated)
      setEditing(false)
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwForm.current || !pwForm.next) return
    setSavingPw(true)
    try {
      await authService.changePassword(pwForm.current, pwForm.next)
      toast.success('Password changed successfully')
      setPwForm({ current: '', next: '' })
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to change password')
    } finally {
      setSavingPw(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-100">Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account information</p>
      </motion.div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-cyber-500/25 flex-shrink-0">
              {user.full_name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-slate-100">{user.full_name}</h2>
                <Badge variant={ROLE_COLORS[user.role] || 'default'} size="sm" className="capitalize">
                  {user.role.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">@{user.username}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {new Date(user.created_at).toLocaleDateString()}</span>
                {user.last_login && <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Last login {new Date(user.last_login).toLocaleDateString()}</span>}
              </div>
            </div>
            <button onClick={() => editing ? handleSaveProfile() : setEditing(true)} disabled={savingProfile}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${editing ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-dark-700/50 text-slate-400 border border-dark-600 hover:text-slate-200'}`}>
              {editing ? <><Save className="w-3.5 h-3.5" />{savingProfile ? 'Saving...' : 'Save'}</> : <><Edit2 className="w-3.5 h-3.5" />Edit</>}
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-slate-200">Account Information</h3></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Full Name', key: 'full_name', icon: User, value: form.full_name },
            { label: 'Email', key: 'email', icon: Mail, value: form.email },
          ].map(f => {
            const Icon = f.icon
            return (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input type="text" value={f.value} disabled={!editing}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm transition-all ${editing ? 'bg-dark-800 border-dark-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500/40' : 'bg-dark-700/30 border-dark-700/50 text-slate-400 cursor-default'}`} />
                </div>
              </div>
            )
          })}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
            <div className="flex items-center gap-2 bg-dark-700/30 border border-dark-700/50 rounded-lg px-3 py-2.5">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-sm text-slate-400 capitalize">{user.role.replace('_', ' ')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-slate-200">Change Password</h3></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Current Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} placeholder="••••••••"
                  className="w-full bg-dark-800 border border-dark-600 text-slate-100 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">New Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input type="password" value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} placeholder="••••••••" minLength={6}
                  className="w-full bg-dark-800 border border-dark-600 text-slate-100 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={savingPw || !pwForm.current || !pwForm.next}
                className="bg-cyber-600 hover:bg-cyber-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                {savingPw ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
