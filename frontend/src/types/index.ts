// ============================================================
// Core Types for Security Automation Framework
// ============================================================

export type UserRole = 'admin' | 'developer' | 'security_engineer' | 'project_manager'

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export type PipelineStage = 
  | 'code_commit'
  | 'static_scan'
  | 'secrets_scan'
  | 'dependency_scan'
  | 'container_scan'
  | 'build'
  | 'deploy'

export type SecurityGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'

// ---- User ----
export interface User {
  id: string
  email: string
  username: string
  full_name: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  created_at: string
  last_login?: string
}

export interface AuthTokens {
  access_token: string
  token_type: string
  expires_in: number
}

// ---- Project ----
export interface Project {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: string
  updated_at: string
  repository_count: number
  last_scan?: string
  security_score: number
  grade: SecurityGrade
  members: ProjectMember[]
}

export interface ProjectMember {
  user_id: string
  username: string
  role: UserRole
  joined_at: string
}

// ---- Repository ----
export interface Repository {
  id: string
  project_id: string
  name: string
  url: string
  provider: 'github' | 'gitlab' | 'bitbucket' | 'local'
  default_branch: string
  is_private: boolean
  last_commit?: Commit
  scan_count: number
  vulnerability_count: number
  security_score: number
  grade: SecurityGrade
  webhook_url?: string
  created_at: string
}

export interface Commit {
  sha: string
  message: string
  author: string
  timestamp: string
  branch: string
}

// ---- Pipeline ----
export interface Pipeline {
  id: string
  repository_id: string
  repository_name: string
  project_name: string
  trigger: 'push' | 'manual' | 'schedule' | 'webhook'
  branch: string
  commit_sha: string
  commit_message: string
  status: ScanStatus
  started_at: string
  completed_at?: string
  duration?: number
  stages: PipelineStageResult[]
  triggered_by: string
}

export interface PipelineStageResult {
  stage: PipelineStage
  status: ScanStatus
  started_at?: string
  completed_at?: string
  duration?: number
  findings: number
  logs?: string[]
}

// ---- Scan ----
export interface Scan {
  id: string
  pipeline_id: string
  repository_id: string
  scanner_type: ScannerType
  status: ScanStatus
  started_at: string
  completed_at?: string
  duration?: number
  total_findings: number
  critical: number
  high: number
  medium: number
  low: number
  info: number
  score: number
}

export type ScannerType = 
  | 'bandit'
  | 'semgrep'
  | 'trivy'
  | 'safety'
  | 'pip_audit'
  | 'gitleaks'
  | 'dockerfile_scan'
  | 'k8s_scan'
  | 'terraform_scan'
  | 'owasp_dc'

// ---- Vulnerability ----
export interface Vulnerability {
  id: string
  scan_id: string
  title: string
  description: string
  severity: SeverityLevel
  scanner: ScannerType
  file_path?: string
  line_number?: number
  code_snippet?: string
  cve_id?: string
  cwe_id?: string
  owasp_category?: string
  cvss_score?: number
  fix_recommendation?: string
  references?: string[]
  status: 'open' | 'fixed' | 'accepted' | 'false_positive'
  created_at: string
  updated_at: string
}

// ---- Report ----
export interface Report {
  id: string
  title: string
  project_id: string
  repository_id?: string
  type: 'executive' | 'developer' | 'compliance' | 'owasp'
  format: 'pdf' | 'csv' | 'json'
  created_at: string
  created_by: string
  download_url: string
  scan_ids: string[]
}

// ---- Dashboard Metrics ----
export interface DashboardMetrics {
  security_score: number
  grade: SecurityGrade
  total_scans: number
  active_pipelines: number
  total_vulnerabilities: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  projects_count: number
  repositories_count: number
  last_scan: string
  scan_trend: TrendData[]
  vulnerability_trend: TrendData[]
  top_vulnerabilities: Vulnerability[]
  recent_pipelines: Pipeline[]
  scanner_stats: ScannerStats[]
  risk_distribution: RiskDistribution[]
}

export interface TrendData {
  date: string
  value: number
  label?: string
}

export interface ScannerStats {
  scanner: string
  scans: number
  findings: number
  critical: number
}

export interface RiskDistribution {
  name: string
  value: number
  color: string
}

// ---- Notifications ----
export interface Notification {
  id: string
  title: string
  message: string
  type: 'critical' | 'warning' | 'info' | 'success'
  channel: 'email' | 'slack' | 'discord' | 'webhook' | 'telegram' | 'in_app'
  is_read: boolean
  created_at: string
  related_id?: string
  related_type?: 'scan' | 'pipeline' | 'vulnerability'
}

// ---- Compliance ----
export interface ComplianceMapping {
  vulnerability_id: string
  standard: 'owasp_top10' | 'cwe' | 'cve' | 'mitre_attack' | 'nist'
  reference: string
  description: string
}

export interface ComplianceReport {
  standard: string
  total_requirements: number
  passed: number
  failed: number
  not_applicable: number
  items: ComplianceItem[]
}

export interface ComplianceItem {
  id: string
  title: string
  description: string
  status: 'pass' | 'fail' | 'na'
  findings_count: number
  severity: SeverityLevel
  references: string[]
}

// ---- Analytics ----
export interface AnalyticsData {
  monthly_scans: MonthlyData[]
  weekly_scans: WeeklyData[]
  top_vulnerable_repos: RepoVulnStats[]
  avg_fix_time: number
  vulnerability_by_scanner: ScannerBreakdown[]
  trend_prediction: TrendData[]
}

export interface MonthlyData {
  month: string
  scans: number
  critical: number
  high: number
  medium: number
  low: number
}

export interface WeeklyData {
  week: string
  scans: number
  fixed: number
  new: number
}

export interface RepoVulnStats {
  repository: string
  project: string
  critical: number
  high: number
  total: number
  score: number
}

export interface ScannerBreakdown {
  scanner: string
  critical: number
  high: number
  medium: number
  low: number
  total: number
}

// ---- AI Assistant ----
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  related_vuln?: Vulnerability
}

// ---- Audit Log ----
export interface AuditLog {
  id: string
  user_id: string
  username: string
  action: string
  resource_type: string
  resource_id: string
  details: Record<string, unknown>
  ip_address: string
  user_agent: string
  timestamp: string
}

// ---- Settings ----
export interface NotificationSettings {
  email_enabled: boolean
  slack_webhook?: string
  discord_webhook?: string
  telegram_bot_token?: string
  telegram_chat_id?: string
  notify_on_critical: boolean
  notify_on_high: boolean
  notify_on_pipeline_fail: boolean
  notify_on_deploy_block: boolean
}

export interface ScannerConfig {
  bandit_enabled: boolean
  semgrep_enabled: boolean
  trivy_enabled: boolean
  safety_enabled: boolean
  pip_audit_enabled: boolean
  gitleaks_enabled: boolean
  dockerfile_scan_enabled: boolean
  custom_rules?: string
  severity_threshold: SeverityLevel
}

export interface PipelineConfig {
  auto_trigger_on_push: boolean
  auto_trigger_on_pr: boolean
  block_deploy_on_critical: boolean
  block_deploy_on_high: boolean
  parallel_scans: boolean
  timeout_minutes: number
}
