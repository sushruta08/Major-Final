import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Zap, Bot, CheckCircle, Lock, BarChart3, Bell } from 'lucide-react'

const FEATURES = [
  { icon: Shield, title: 'Multi-Scanner Security', desc: 'Bandit, Semgrep, Trivy, Gitleaks, Safety — all in one pipeline', color: 'text-cyber-400 bg-cyber-500/10 border-cyber-500/20' },
  { icon: Zap, title: 'Automated CI/CD Integration', desc: 'Auto-trigger scans on push, PR, or schedule via GitHub Actions', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { icon: BarChart3, title: 'Enterprise Dashboard', desc: 'Security scores, risk grades, trend analytics, and compliance maps', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { icon: Bot, title: 'AI Security Assistant', desc: 'Explain CVEs, suggest fixes, generate secure code patterns', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { icon: Bell, title: 'Real-time Notifications', desc: 'Slack, Discord, Email, Telegram — alert on critical findings', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { icon: CheckCircle, title: 'Compliance Mapping', desc: 'Auto-map to OWASP Top 10, CWE, CVE, MITRE ATT&CK, NIST', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
]

const STATS = [
  { value: '10+', label: 'Security Scanners' },
  { value: '100%', label: 'Automated' },
  { value: 'A+', label: 'Security Grade' },
  { value: 'Real-time', label: 'Monitoring' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-950 bg-grid overflow-x-hidden">
      {/* Navbar */}
      <nav className="border-b border-dark-700/50 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyber-500/30">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">SecureCI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Sign in</Link>
            <Link to="/register" className="bg-cyber-600 hover:bg-cyber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-cyber-500/25">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-cyber-500/10 border border-cyber-500/20 text-cyber-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-cyber-400 rounded-full animate-pulse" />
            B.Tech Major Project — DevSecOps Security Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Security Automation<br />
            <span className="bg-gradient-to-r from-cyber-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              in CI/CD Pipelines
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Enterprise-grade DevSecOps platform that automatically scans your code for vulnerabilities on every commit — before threats reach production.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login"
              className="bg-gradient-to-r from-cyber-600 to-purple-600 hover:from-cyber-500 hover:to-purple-500 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all shadow-xl hover:shadow-cyber-500/30 hover:-translate-y-0.5">
              Open Security Dashboard →
            </Link>
            <a href="#features"
              className="border border-dark-600 hover:border-dark-500 text-slate-300 px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:bg-dark-800/50">
              View Features
            </a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
        >
          {STATS.map(s => (
            <div key={s.label} className="bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-xl p-4">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-3">Everything you need for DevSecOps</h2>
          <p className="text-slate-400">Built for security teams, developers, and project managers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-dark-800/60 backdrop-blur-md border border-dark-700/50 rounded-xl p-5 hover:border-cyber-500/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyber-500/5 transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${f.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-100 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Pipeline Visual */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-dark-700/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-3">Automated Security Pipeline</h2>
          <p className="text-slate-400">Every commit triggers a full security scan across all layers</p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-2">
          {['Code Commit', 'Static Analysis', 'Secret Detection', 'Dependency Scan', 'Container Scan', 'Build', 'Deploy'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                  i === 6 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                  'bg-dark-700/60 border-dark-600 text-slate-300'
                }`}
              >
                {step}
              </motion.div>
              {i < 6 && <div className="w-6 h-px bg-dark-600" />}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cyber-500/10 via-dark-800 to-purple-500/10 border border-cyber-500/20 rounded-2xl p-12 text-center"
        >
          <h2 className="text-3xl font-black text-white mb-4">Ready to secure your pipeline?</h2>
          <p className="text-slate-400 mb-8">Sign in with demo credentials and explore the full platform</p>
          <Link to="/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyber-600 to-purple-600 hover:from-cyber-500 hover:to-purple-500 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-xl hover:shadow-cyber-500/30 hover:-translate-y-0.5">
            <Lock className="w-4 h-4" />
            Launch Dashboard
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-dark-700/50 text-center py-8 text-xs text-slate-600">
        SecureCI — Security Automation Framework in CI/CD Pipelines | B.Tech Major Project 2024
      </footer>
    </div>
  )
}
