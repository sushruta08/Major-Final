import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Mail, User, Eye, EyeOff, Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', role: 'developer' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.username || !form.password) { toast.error('Please fill all fields'); return }
    setIsLoading(true)
    try {
      const data = await authService.register({ email: form.email, username: form.username, full_name: form.name, password: form.password, role: form.role })
      login(data.user, { access_token: data.access_token, token_type: data.token_type, expires_in: data.expires_in })
      toast.success(`Welcome to SecureCI, ${data.user.full_name}!`)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 bg-grid flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyber-500/30">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SecureCI</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Join the DevSecOps platform</p>
        </div>
        <div className="bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-2xl p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" required
                    className="w-full bg-dark-900/80 border border-dark-600 text-slate-100 placeholder-slate-600 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">@</span>
                  <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="username" required
                    className="w-full bg-dark-900/80 border border-dark-600 text-slate-100 placeholder-slate-600 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40 transition-all" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" required
                  className="w-full bg-dark-900/80 border border-dark-600 text-slate-100 placeholder-slate-600 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full bg-dark-900/80 border border-dark-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40 transition-all">
                <option value="developer">Developer</option>
                <option value="security_engineer">Security Engineer</option>
                <option value="project_manager">Project Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" minLength={6} required
                  className="w-full bg-dark-900/80 border border-dark-600 text-slate-100 placeholder-slate-600 rounded-lg pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyber-600 to-cyber-500 hover:from-cyber-500 hover:to-cyber-400 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg hover:shadow-cyber-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Creating...</> : <><Shield className="w-4 h-4" /> Create Account</>}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}<Link to="/login" className="text-cyber-400 hover:text-cyber-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
