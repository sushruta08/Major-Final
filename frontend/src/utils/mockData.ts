// ============================================================
// Mock / Sample Data for Demo Purposes
// ============================================================
import type {
  User, Project, Repository, Pipeline, Scan, Vulnerability,
  DashboardMetrics, Notification, AuditLog, AnalyticsData
} from '../types'

export const mockUsers: User[] = [
  {
    id: 'u1', email: 'admin@secureci.dev', username: 'admin',
    full_name: 'Alex Admin', role: 'admin', is_active: true,
    created_at: '2024-01-10T08:00:00Z', last_login: '2024-03-15T09:30:00Z',
  },
  {
    id: 'u2', email: 'dev@secureci.dev', username: 'john_dev',
    full_name: 'John Developer', role: 'developer', is_active: true,
    created_at: '2024-01-15T08:00:00Z', last_login: '2024-03-14T14:20:00Z',
  },
  {
    id: 'u3', email: 'sec@secureci.dev', username: 'sarah_sec',
    full_name: 'Sarah Security', role: 'security_engineer', is_active: true,
    created_at: '2024-01-20T08:00:00Z', last_login: '2024-03-15T11:00:00Z',
  },
  {
    id: 'u4', email: 'pm@secureci.dev', username: 'mike_pm',
    full_name: 'Mike Manager', role: 'project_manager', is_active: true,
    created_at: '2024-02-01T08:00:00Z', last_login: '2024-03-13T16:45:00Z',
  },
]

export const mockProjects: Project[] = [
  {
    id: 'p1', name: 'E-Commerce Platform', description: 'Main storefront and API services',
    owner_id: 'u1', created_at: '2024-01-10T08:00:00Z', updated_at: '2024-03-14T10:00:00Z',
    repository_count: 3, last_scan: '2024-03-15T06:00:00Z',
    security_score: 72, grade: 'B',
    members: [
      { user_id: 'u1', username: 'admin', role: 'admin', joined_at: '2024-01-10T08:00:00Z' },
      { user_id: 'u2', username: 'john_dev', role: 'developer', joined_at: '2024-01-15T08:00:00Z' },
    ],
  },
  {
    id: 'p2', name: 'Payment Gateway', description: 'Secure payment processing microservice',
    owner_id: 'u1', created_at: '2024-01-20T08:00:00Z', updated_at: '2024-03-13T10:00:00Z',
    repository_count: 2, last_scan: '2024-03-14T08:00:00Z',
    security_score: 88, grade: 'A',
    members: [
      { user_id: 'u1', username: 'admin', role: 'admin', joined_at: '2024-01-20T08:00:00Z' },
      { user_id: 'u3', username: 'sarah_sec', role: 'security_engineer', joined_at: '2024-01-22T08:00:00Z' },
    ],
  },
  {
    id: 'p3', name: 'Analytics Dashboard', description: 'Business intelligence and reporting',
    owner_id: 'u4', created_at: '2024-02-01T08:00:00Z', updated_at: '2024-03-12T10:00:00Z',
    repository_count: 1, last_scan: '2024-03-13T12:00:00Z',
    security_score: 61, grade: 'C',
    members: [
      { user_id: 'u4', username: 'mike_pm', role: 'project_manager', joined_at: '2024-02-01T08:00:00Z' },
      { user_id: 'u2', username: 'john_dev', role: 'developer', joined_at: '2024-02-05T08:00:00Z' },
    ],
  },
]

export const mockRepositories: Repository[] = [
  {
    id: 'r1', project_id: 'p1', name: 'ecommerce-frontend',
    url: 'https://github.com/org/ecommerce-frontend', provider: 'github',
    default_branch: 'main', is_private: true,
    last_commit: { sha: 'a1b2c3d', message: 'feat: add checkout flow', author: 'john_dev', timestamp: '2024-03-15T08:30:00Z', branch: 'main' },
    scan_count: 24, vulnerability_count: 12, security_score: 75, grade: 'B',
    created_at: '2024-01-10T08:00:00Z',
  },
  {
    id: 'r2', project_id: 'p1', name: 'ecommerce-api',
    url: 'https://github.com/org/ecommerce-api', provider: 'github',
    default_branch: 'main', is_private: true,
    last_commit: { sha: 'e4f5g6h', message: 'fix: sql injection vulnerability', author: 'john_dev', timestamp: '2024-03-14T16:00:00Z', branch: 'main' },
    scan_count: 31, vulnerability_count: 8, security_score: 82, grade: 'A',
    created_at: '2024-01-10T08:00:00Z',
  },
  {
    id: 'r3', project_id: 'p2', name: 'payment-service',
    url: 'https://github.com/org/payment-service', provider: 'github',
    default_branch: 'main', is_private: true,
    last_commit: { sha: 'i7j8k9l', message: 'security: upgrade dependencies', author: 'sarah_sec', timestamp: '2024-03-14T10:00:00Z', branch: 'main' },
    scan_count: 18, vulnerability_count: 3, security_score: 94, grade: 'A+',
    created_at: '2024-01-20T08:00:00Z',
  },
]

export const mockVulnerabilities: Vulnerability[] = [
  {
    id: 'v1', scan_id: 's1', title: 'SQL Injection in User Login',
    description: 'User input is not properly sanitized before being used in SQL query, allowing potential SQL injection attacks.',
    severity: 'critical', scanner: 'bandit',
    file_path: 'app/auth/login.py', line_number: 45,
    code_snippet: 'cursor.execute("SELECT * FROM users WHERE email=\'" + email + "\'")',
    cve_id: 'CVE-2024-1234', cwe_id: 'CWE-89', owasp_category: 'A03:2021',
    cvss_score: 9.8, fix_recommendation: 'Use parameterized queries or ORM methods',
    status: 'open', created_at: '2024-03-15T06:00:00Z', updated_at: '2024-03-15T06:00:00Z',
  },
  {
    id: 'v2', scan_id: 's1', title: 'Hardcoded Secret in Config',
    description: 'AWS access key found hardcoded in configuration file.',
    severity: 'critical', scanner: 'gitleaks',
    file_path: 'config/aws.py', line_number: 12,
    code_snippet: 'AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE"',
    owasp_category: 'A02:2021', cvss_score: 9.1,
    fix_recommendation: 'Move secrets to environment variables or a secrets manager',
    status: 'open', created_at: '2024-03-15T06:05:00Z', updated_at: '2024-03-15T06:05:00Z',
  },
  {
    id: 'v3', scan_id: 's1', title: 'Outdated Django Version',
    description: 'Django 3.2.8 has known vulnerabilities. Upgrade to 4.2.x or later.',
    severity: 'high', scanner: 'safety',
    cve_id: 'CVE-2023-41164', cvss_score: 7.5,
    fix_recommendation: 'Upgrade Django to 4.2.11 or higher',
    status: 'open', created_at: '2024-03-15T06:10:00Z', updated_at: '2024-03-15T06:10:00Z',
  },
  {
    id: 'v4', scan_id: 's1', title: 'Path Traversal in File Upload',
    description: 'User-controlled file path allows reading arbitrary files from the server.',
    severity: 'high', scanner: 'semgrep',
    file_path: 'app/uploads/handler.py', line_number: 88,
    cwe_id: 'CWE-22', owasp_category: 'A01:2021', cvss_score: 8.6,
    fix_recommendation: 'Validate and sanitize file paths, use os.path.basename()',
    status: 'fixed', created_at: '2024-03-14T10:00:00Z', updated_at: '2024-03-15T09:00:00Z',
  },
  {
    id: 'v5', scan_id: 's2', title: 'Missing Security Headers',
    description: 'HTTP response is missing X-Frame-Options, X-Content-Type-Options headers.',
    severity: 'medium', scanner: 'semgrep',
    file_path: 'app/middleware.py', line_number: 15,
    owasp_category: 'A05:2021', cvss_score: 5.3,
    fix_recommendation: 'Add security headers middleware',
    status: 'open', created_at: '2024-03-14T08:00:00Z', updated_at: '2024-03-14T08:00:00Z',
  },
  {
    id: 'v6', scan_id: 's2', title: 'Vulnerable Container Image',
    description: 'Base image python:3.9-slim has 5 CVEs including 2 critical.',
    severity: 'high', scanner: 'trivy',
    file_path: 'Dockerfile', cve_id: 'CVE-2024-0567',
    fix_recommendation: 'Update to python:3.11-slim or python:3.12-alpine',
    status: 'open', created_at: '2024-03-13T12:00:00Z', updated_at: '2024-03-13T12:00:00Z',
  },
]

export const mockPipelines: Pipeline[] = [
  {
    id: 'pl1', repository_id: 'r1', repository_name: 'ecommerce-frontend',
    project_name: 'E-Commerce Platform', trigger: 'push',
    branch: 'main', commit_sha: 'a1b2c3d', commit_message: 'feat: add checkout flow',
    status: 'completed', started_at: '2024-03-15T06:00:00Z', completed_at: '2024-03-15T06:12:00Z',
    duration: 720, triggered_by: 'john_dev',
    stages: [
      { stage: 'code_commit', status: 'completed', duration: 2, findings: 0 },
      { stage: 'static_scan', status: 'completed', duration: 95, findings: 5 },
      { stage: 'secrets_scan', status: 'completed', duration: 22, findings: 1 },
      { stage: 'dependency_scan', status: 'completed', duration: 180, findings: 3 },
      { stage: 'container_scan', status: 'completed', duration: 240, findings: 2 },
      { stage: 'build', status: 'completed', duration: 120, findings: 0 },
      { stage: 'deploy', status: 'failed', duration: 61, findings: 0 },
    ],
  },
  {
    id: 'pl2', repository_id: 'r2', repository_name: 'ecommerce-api',
    project_name: 'E-Commerce Platform', trigger: 'push',
    branch: 'main', commit_sha: 'e4f5g6h', commit_message: 'fix: sql injection vulnerability',
    status: 'running', started_at: '2024-03-15T09:00:00Z', triggered_by: 'john_dev',
    stages: [
      { stage: 'code_commit', status: 'completed', duration: 2, findings: 0 },
      { stage: 'static_scan', status: 'completed', duration: 88, findings: 2 },
      { stage: 'secrets_scan', status: 'running', findings: 0 },
      { stage: 'dependency_scan', status: 'pending', findings: 0 },
      { stage: 'container_scan', status: 'pending', findings: 0 },
      { stage: 'build', status: 'pending', findings: 0 },
      { stage: 'deploy', status: 'pending', findings: 0 },
    ],
  },
  {
    id: 'pl3', repository_id: 'r3', repository_name: 'payment-service',
    project_name: 'Payment Gateway', trigger: 'manual',
    branch: 'main', commit_sha: 'i7j8k9l', commit_message: 'security: upgrade dependencies',
    status: 'completed', started_at: '2024-03-14T10:00:00Z', completed_at: '2024-03-14T10:15:00Z',
    duration: 900, triggered_by: 'sarah_sec',
    stages: [
      { stage: 'code_commit', status: 'completed', duration: 2, findings: 0 },
      { stage: 'static_scan', status: 'completed', duration: 102, findings: 1 },
      { stage: 'secrets_scan', status: 'completed', duration: 18, findings: 0 },
      { stage: 'dependency_scan', status: 'completed', duration: 195, findings: 0 },
      { stage: 'container_scan', status: 'completed', duration: 265, findings: 1 },
      { stage: 'build', status: 'completed', duration: 180, findings: 0 },
      { stage: 'deploy', status: 'completed', duration: 138, findings: 0 },
    ],
  },
]

export const mockScans: Scan[] = [
  {
    id: 's1', pipeline_id: 'pl1', repository_id: 'r1', scanner_type: 'bandit',
    status: 'completed', started_at: '2024-03-15T06:02:00Z', completed_at: '2024-03-15T06:03:35Z',
    duration: 95, total_findings: 5, critical: 2, high: 1, medium: 1, low: 1, info: 0, score: 68,
  },
  {
    id: 's2', pipeline_id: 'pl1', repository_id: 'r1', scanner_type: 'gitleaks',
    status: 'completed', started_at: '2024-03-15T06:04:00Z', completed_at: '2024-03-15T06:04:22Z',
    duration: 22, total_findings: 1, critical: 1, high: 0, medium: 0, low: 0, info: 0, score: 50,
  },
  {
    id: 's3', pipeline_id: 'pl1', repository_id: 'r1', scanner_type: 'safety',
    status: 'completed', started_at: '2024-03-15T06:05:00Z', completed_at: '2024-03-15T06:08:00Z',
    duration: 180, total_findings: 3, critical: 0, high: 2, medium: 1, low: 0, info: 0, score: 74,
  },
]

export const mockDashboardMetrics: DashboardMetrics = {
  security_score: 76,
  grade: 'B',
  total_scans: 147,
  active_pipelines: 2,
  total_vulnerabilities: 34,
  critical_count: 4,
  high_count: 9,
  medium_count: 14,
  low_count: 7,
  projects_count: 3,
  repositories_count: 6,
  last_scan: '2024-03-15T09:00:00Z',
  scan_trend: [
    { date: 'Mar 9', value: 12 }, { date: 'Mar 10', value: 8 }, { date: 'Mar 11', value: 15 },
    { date: 'Mar 12', value: 10 }, { date: 'Mar 13', value: 18 }, { date: 'Mar 14', value: 22 },
    { date: 'Mar 15', value: 14 },
  ],
  vulnerability_trend: [
    { date: 'Mar 9', value: 42 }, { date: 'Mar 10', value: 39 }, { date: 'Mar 11', value: 44 },
    { date: 'Mar 12', value: 38 }, { date: 'Mar 13', value: 36 }, { date: 'Mar 14', value: 35 },
    { date: 'Mar 15', value: 34 },
  ],
  top_vulnerabilities: mockVulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high'),
  recent_pipelines: mockPipelines,
  scanner_stats: [
    { scanner: 'Bandit', scans: 45, findings: 87, critical: 12 },
    { scanner: 'Semgrep', scans: 45, findings: 124, critical: 8 },
    { scanner: 'Trivy', scans: 38, findings: 56, critical: 15 },
    { scanner: 'Safety', scans: 41, findings: 34, critical: 4 },
    { scanner: 'Gitleaks', scans: 45, findings: 18, critical: 6 },
  ],
  risk_distribution: [
    { name: 'Critical', value: 4, color: '#ef4444' },
    { name: 'High', value: 9, color: '#f97316' },
    { name: 'Medium', value: 14, color: '#eab308' },
    { name: 'Low', value: 7, color: '#3b82f6' },
  ],
}

export const mockNotifications: Notification[] = [
  {
    id: 'n1', title: 'Critical Vulnerability Detected',
    message: 'SQL Injection found in ecommerce-api (CVE-2024-1234) — CVSS 9.8',
    type: 'critical', channel: 'in_app', is_read: false,
    created_at: '2024-03-15T09:05:00Z', related_id: 'v1', related_type: 'vulnerability',
  },
  {
    id: 'n2', title: 'Pipeline Failed',
    message: 'Deployment blocked: ecommerce-frontend has critical vulnerabilities',
    type: 'warning', channel: 'in_app', is_read: false,
    created_at: '2024-03-15T06:12:00Z', related_id: 'pl1', related_type: 'pipeline',
  },
  {
    id: 'n3', title: 'Scan Completed',
    message: 'payment-service security scan passed — Score: 94/100',
    type: 'success', channel: 'in_app', is_read: true,
    created_at: '2024-03-14T10:15:00Z', related_id: 'pl3', related_type: 'scan',
  },
  {
    id: 'n4', title: 'Secret Detected',
    message: 'Hardcoded AWS key found in ecommerce-frontend config file',
    type: 'critical', channel: 'in_app', is_read: false,
    created_at: '2024-03-15T06:05:00Z', related_id: 'v2', related_type: 'vulnerability',
  },
]

export const mockAnalytics: AnalyticsData = {
  monthly_scans: [
    { month: 'Oct', scans: 68, critical: 12, high: 24, medium: 31, low: 18 },
    { month: 'Nov', scans: 75, critical: 9, high: 21, medium: 28, low: 22 },
    { month: 'Dec', scans: 71, critical: 11, high: 19, medium: 26, low: 20 },
    { month: 'Jan', scans: 88, critical: 8, high: 17, medium: 24, low: 16 },
    { month: 'Feb', scans: 102, critical: 6, high: 14, medium: 19, low: 12 },
    { month: 'Mar', scans: 147, critical: 4, high: 9, medium: 14, low: 7 },
  ],
  weekly_scans: [
    { week: 'Week 1', scans: 28, fixed: 15, new: 13 },
    { week: 'Week 2', scans: 35, fixed: 22, new: 11 },
    { week: 'Week 3', scans: 41, fixed: 28, new: 9 },
    { week: 'Week 4', scans: 43, fixed: 31, new: 8 },
  ],
  top_vulnerable_repos: [
    { repository: 'ecommerce-frontend', project: 'E-Commerce Platform', critical: 3, high: 5, total: 12, score: 68 },
    { repository: 'analytics-dashboard', project: 'Analytics Dashboard', critical: 2, high: 4, total: 9, score: 71 },
    { repository: 'ecommerce-api', project: 'E-Commerce Platform', critical: 1, high: 3, total: 8, score: 76 },
  ],
  avg_fix_time: 4.2,
  vulnerability_by_scanner: [
    { scanner: 'Semgrep', critical: 8, high: 24, medium: 38, low: 15, total: 85 },
    { scanner: 'Bandit', critical: 12, high: 18, medium: 22, low: 10, total: 62 },
    { scanner: 'Trivy', critical: 15, high: 12, medium: 8, low: 5, total: 40 },
    { scanner: 'Safety', critical: 4, high: 8, medium: 6, low: 2, total: 20 },
    { scanner: 'Gitleaks', critical: 6, high: 3, medium: 1, low: 0, total: 10 },
  ],
  trend_prediction: [
    { date: 'Apr', value: 28 }, { date: 'May', value: 22 }, { date: 'Jun', value: 17 },
  ],
}

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'al1', user_id: 'u1', username: 'admin', action: 'CREATE_PROJECT',
    resource_type: 'project', resource_id: 'p1', details: { name: 'E-Commerce Platform' },
    ip_address: '192.168.1.1', user_agent: 'Mozilla/5.0', timestamp: '2024-01-10T08:05:00Z',
  },
  {
    id: 'al2', user_id: 'u3', username: 'sarah_sec', action: 'TRIGGER_SCAN',
    resource_type: 'repository', resource_id: 'r3', details: { scanner: 'trivy' },
    ip_address: '192.168.1.3', user_agent: 'Mozilla/5.0', timestamp: '2024-03-14T10:00:00Z',
  },
  {
    id: 'al3', user_id: 'u2', username: 'john_dev', action: 'MARK_FALSE_POSITIVE',
    resource_type: 'vulnerability', resource_id: 'v5', details: { reason: 'Test environment only' },
    ip_address: '192.168.1.2', user_agent: 'Mozilla/5.0', timestamp: '2024-03-15T09:30:00Z',
  },
]
