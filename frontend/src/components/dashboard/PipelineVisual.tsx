import { motion } from 'framer-motion'
import { GitCommit, Shield, Key, Package, Container, Hammer, Rocket, CheckCircle, XCircle, Clock, Loader, Code } from 'lucide-react'
import { cn } from '../../utils/cn'

interface PipelineVisualProps {
  pipeline: any
  compact?: boolean
}

const stageConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  code_commit:     { label: 'Commit',      icon: GitCommit },
  static_scan:     { label: 'Static',      icon: Shield },
  secrets_scan:    { label: 'Secrets',     icon: Key },
  dependency_scan: { label: 'Deps',        icon: Package },
  container_scan:  { label: 'Container',   icon: Container },
  build:           { label: 'Build',       icon: Hammer },
  deploy:          { label: 'Deploy',      icon: Rocket },
  bandit:          { label: 'Bandit',      icon: Code },
  semgrep:         { label: 'Semgrep',     icon: Code },
  gitleaks:        { label: 'Gitleaks',    icon: Key },
  safety:          { label: 'Safety',      icon: Package },
  pip_audit:       { label: 'pip-audit',   icon: Package },
  trivy:           { label: 'Trivy',       icon: Container },
  dockerfile_scan: { label: 'Dockerfile',  icon: Container },
}

const FALLBACK = { label: 'Scan', icon: Shield }

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle className="w-4 h-4 text-emerald-400" />
  if (status === 'failed')    return <XCircle className="w-4 h-4 text-red-400" />
  if (status === 'running')   return <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
  return <Clock className="w-4 h-4 text-slate-600" />
}

function stageColor(status: string) {
  if (status === 'completed') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
  if (status === 'failed')    return 'border-red-500/40 bg-red-500/10 text-red-400'
  if (status === 'running')   return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400 animate-pulse'
  return 'border-dark-600 bg-dark-800/50 text-slate-600'
}

export function PipelineVisual({ pipeline, compact = false }: PipelineVisualProps) {
  const stages: any[] = pipeline?.stages || []

  if (stages.length === 0) return null

  if (compact) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {stages.map((stage, i) => {
          const cfg = stageConfig[stage.stage ?? stage.scanner_type ?? ''] || FALLBACK
          const Icon = cfg.icon
          return (
            <div key={`${stage.stage ?? i}-${i}`} className="flex items-center gap-1 flex-shrink-0">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08 }}
                title={`${cfg.label}: ${stage.status}`}
                className={cn('w-7 h-7 rounded-md border flex items-center justify-center cursor-default', stageColor(stage.status))}
              >
                <Icon className="w-3.5 h-3.5" />
              </motion.div>
              {i < stages.length - 1 && (
                <div className={cn('w-3 h-px', stage.status === 'completed' ? 'bg-emerald-500/50' : 'bg-dark-600')} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {stages.map((stage, i) => {
          const cfg = stageConfig[stage.stage ?? stage.scanner_type ?? ''] || FALLBACK
          const Icon = cfg.icon
          return (
            <div key={`${stage.stage ?? i}-${i}`} className="flex items-center flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-1.5 min-w-[80px]"
              >
                <div className={cn('w-12 h-12 rounded-xl border-2 flex items-center justify-center relative', stageColor(stage.status))}>
                  <Icon className="w-5 h-5" />
                  {stage.status === 'running' && (
                    <div className="absolute inset-0 rounded-xl border-2 border-cyan-400 animate-ping opacity-30" />
                  )}
                </div>
                <StatusIcon status={stage.status} />
                <p className="text-[10px] text-slate-500 text-center leading-tight font-medium">{cfg.label}</p>
                {(stage.findings || 0) > 0 && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/20">
                    {stage.findings} issues
                  </span>
                )}
              </motion.div>
              {i < stages.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.1 + 0.15 }}
                  className={cn('w-6 h-0.5 -mt-8 origin-left',
                    stage.status === 'completed' ? 'bg-emerald-500/60' :
                    stage.status === 'running'   ? 'bg-cyan-500/60' : 'bg-dark-600'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
