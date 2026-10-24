import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff, Shield, GitBranch, Zap } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

export function LoginPage() {
  const [email, setEmail] = useState('admin@secureci.dev')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const data = await authService.login({ email, password })
      login(data.user, { access_token: data.access_token, token_type: data.token_type, expires_in: data.expires_in })
      toast.success(`Welcome back, ${data.user.full_name}!`)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex bg-grid">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-dark-900 via-dark-900 to-dark-950 border-r border-dark-700/50 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-500/5 via-transparent to-purple-500/5" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-cyber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-3 mb-16">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyber-500/30">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">SecureCI</p>
            <p className="text-xs text-slate-500">Security Automation Framework</p>
          </div>
        </div>
        <div className="relative flex-1 flex flex-col justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Enterprise<br />
              <span className="bg-gradient-to-r from-cyber-400 to-purple-400 bg-clip-text text-transparent">DevSecOps Platform</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed mb-10">
              Automate security scanning across your CI/CD pipeline. Detect vulnerabilities before they reach production.
            </p>
          </motion.div>
          <div className="space-y-4">
            {[
              { icon: Shield, label: 'Bandit · Semgrep · Trivy · Gitleaks · Safety', color: 'text-cyber-400' },
              { icon: GitBranch, label: 'GitHub / GitLab webhook integration', color: 'text-purple-400' },
              { icon: Zap, label: 'Real-time pipeline automation & alerts', color: 'text-emerald-400' },
            ].map(({ icon: Icon, label, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-dark-800 border border-dark-700 ${color}`}><Icon className="w-4 h-4" /></div>
                <span className="text-slate-300 text-sm">{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-600">B.Tech Major Project — Security Automation Framework in CI/CD Pipelines</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-white">SecureCI</p>
          </div>
          <div className="bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Sign in</h2>
              <p className="text-sm text-slate-500 mt-1">Access your security dashboard</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com"
                    className="w-full bg-dark-900/80 border border-dark-600 text-slate-100 placeholder-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40 focus:border-cyber-500/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                    className="w-full bg-dark-900/80 border border-dark-600 text-slate-100 placeholder-slate-600 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40 focus:border-cyber-500/50 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyber-600 to-cyber-500 hover:from-cyber-500 hover:to-cyber-400 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg hover:shadow-cyber-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Signing in...</> : 'Sign in'}
              </button>
            </form>
            {/* Seed credentials hint */}
            <div className="mt-5 pt-5 border-t border-dark-700/50">
              <p className="text-xs text-slate-600 mb-2 text-center">After seeding DB (python scripts/seed_db.py):</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Admin', email: 'admin@secureci.dev', color: 'text-red-400' },
                  { label: 'Developer', email: 'dev@secureci.dev', color: 'text-blue-400' },
                  { label: 'Security Eng', email: 'sec@secureci.dev', color: 'text-purple-400' },
                  { label: 'PM', email: 'pm@secureci.dev', color: 'text-emerald-400' },
                ].map(d => (
                  <button key={d.email} onClick={() => { setEmail(d.email); setPassword('admin123') }}
                    className={`text-xs py-1.5 px-2 rounded-md bg-dark-700/50 border border-dark-600 hover:border-dark-500 transition-colors ${d.color}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-5 text-center text-sm text-slate-500">
              New user?{' '}<Link to="/register" className="text-cyber-400 hover:text-cyber-300 transition-colors font-medium">Create account</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
