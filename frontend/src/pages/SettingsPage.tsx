import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Bell, Shield, GitBranch, Palette, Key, Save } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { useUIStore } from '../store/uiStore'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'scanners', label: 'Scanners', icon: Shield },
  { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'api', label: 'API Keys', icon: Key },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-all duration-200 ${checked ? 'bg-cyber-500' : 'bg-dark-600'}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const { theme, toggleTheme } = useUIStore()
  const [scanners, setScanners] = useState({
    bandit: true, semgrep: true, trivy: true, safety: true,
    pip_audit: true, gitleaks: true, dockerfile_scan: false,
  })
  const [pipeline, setPipeline] = useState({
    auto_push: true, auto_pr: false, block_critical: true, block_high: false,
  })
  const [notifications, setNotifications] = useState({
    email: false, slack: false, discord: false, telegram: false,
    on_critical: true, on_high: true, on_fail: true,
  })
  const [apiKeys, setApiKeys] = useState({ github: '', sonarqube: '', slack_webhook: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    toast.success('Settings saved successfully!')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure your security framework preferences</p>
      </motion.div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar nav */}
        <div className="lg:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? 'bg-cyber-500/10 text-cyber-400 border border-cyber-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/50'
                  }`}>
                  <Icon className="w-4 h-4" />{tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeTab === 'general' && (
            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-slate-200">General Settings</h3></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Organization Name', placeholder: 'SecureCI Corp', key: 'org' },
                  { label: 'Admin Email', placeholder: 'admin@secureci.dev', key: 'email' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
                    <input type="text" defaultValue={f.placeholder}
                      className="w-full bg-dark-800 border border-dark-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-500/40" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'scanners' && (
            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-slate-200">Scanner Configuration</h3></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(scanners).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-dark-700/20 rounded-lg border border-dark-700/30">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{key.replace('_', '-').toUpperCase()}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {{ bandit: 'Python SAST — detects insecure code patterns', semgrep: 'Multi-language SAST — 2000+ security rules', trivy: 'Container + filesystem vulnerability scan', safety: 'Python CVE dependency checker', pip_audit: 'pip package security audit', gitleaks: 'Secret & credential detection', dockerfile_scan: 'Dockerfile security best practices' }[key]}
                      </p>
                    </div>
                    <Toggle checked={enabled} onChange={v => setScanners(p => ({ ...p, [key]: v }))} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'pipeline' && (
            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-slate-200">Pipeline Configuration</h3></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'auto_push', label: 'Auto-trigger on push', desc: 'Run security scan automatically on every git push' },
                  { key: 'auto_pr', label: 'Auto-trigger on pull request', desc: 'Run security scan on every PR' },
                  { key: 'block_critical', label: 'Block deploy on Critical', desc: 'Prevent deployment if critical vulnerabilities found' },
                  { key: 'block_high', label: 'Block deploy on High', desc: 'Prevent deployment if high severity vulnerabilities found' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-dark-700/20 rounded-lg border border-dark-700/30">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    <Toggle checked={pipeline[key as keyof typeof pipeline]} onChange={v => setPipeline(p => ({ ...p, [key]: v }))} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-slate-200">Notification Channels</h3></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'email', label: 'Email', desc: 'Send alerts via SMTP email' },
                  { key: 'slack', label: 'Slack', desc: 'Post to Slack webhook' },
                  { key: 'discord', label: 'Discord', desc: 'Post to Discord webhook' },
                  { key: 'telegram', label: 'Telegram', desc: 'Send via Telegram bot' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-dark-700/20 rounded-lg border border-dark-700/30">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                    <Toggle checked={notifications[key as keyof typeof notifications] as boolean}
                      onChange={v => setNotifications(p => ({ ...p, [key]: v }))} />
                  </div>
                ))}
                <div className="pt-2 border-t border-dark-700/50">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Alert Triggers</p>
                  {[
                    { key: 'on_critical', label: 'Critical vulnerabilities', desc: 'Alert when CVSS ≥ 9.0 found' },
                    { key: 'on_high', label: 'High vulnerabilities', desc: 'Alert when CVSS ≥ 7.0 found' },
                    { key: 'on_fail', label: 'Pipeline failures', desc: 'Alert when a pipeline fails or is blocked' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 mb-2 bg-dark-700/20 rounded-lg border border-dark-700/30">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                      <Toggle checked={notifications[key as keyof typeof notifications] as boolean}
                        onChange={v => setNotifications(p => ({ ...p, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-slate-200">Appearance</h3></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-dark-700/20 rounded-lg border border-dark-700/30">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Dark Mode</p>
                    <p className="text-xs text-slate-500">Switch between dark and light theme</p>
                  </div>
                  <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'api' && (
            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-slate-200">API Keys & Integrations</h3></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'github', label: 'GitHub Personal Access Token', placeholder: 'ghp_...' },
                  { key: 'sonarqube', label: 'SonarQube API Key', placeholder: 'squ_...' },
                  { key: 'slack_webhook', label: 'Slack Webhook URL', placeholder: 'https://hooks.slack.com/...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
                    <input type="password" value={apiKeys[f.key as keyof typeof apiKeys]}
                      onChange={e => setApiKeys(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-dark-800 border border-dark-600 text-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyber-500/40" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-cyber-600 hover:bg-cyber-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-cyber-500/25 disabled:opacity-50">
              <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
