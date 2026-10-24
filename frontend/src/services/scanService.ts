import api from './api'

export const scanService = {
  async list(repository_id?: string, skip = 0, limit = 20) {
    const { data } = await api.get('/scans/', { params: { repository_id, skip, limit } })
    return data
  },
  async get(id: string) {
    const { data } = await api.get(`/scans/${id}`)
    return data
  },
  async getVulnerabilities(scan_id: string, severity?: string, status?: string) {
    const { data } = await api.get(`/scans/${scan_id}/vulnerabilities`, {
      params: { severity, status }
    })
    return data
  },
  async trigger(repository_id: string, branch = 'main', trigger = 'manual') {
    const { data } = await api.post('/scans/trigger', { repository_id, branch, trigger })
    return data
  },
}

export const pipelineService = {
  async list(repository_id?: string, status?: string) {
    const { data } = await api.get('/pipelines/', { params: { repository_id, status } })
    return data
  },
  async get(id: string) {
    const { data } = await api.get(`/pipelines/${id}`)
    return data
  },
  async cancel(id: string) {
    const { data } = await api.post(`/pipelines/${id}/cancel`)
    return data
  },
}

export const vulnerabilityService = {
  async list(params?: { repository_id?: string; severity?: string; status?: string; search?: string; skip?: number; limit?: number }) {
    const { data } = await api.get('/vulnerabilities/', { params })
    return data
  },
  async get(id: string) {
    const { data } = await api.get(`/vulnerabilities/${id}`)
    return data
  },
  async updateStatus(id: string, status: string, reason?: string) {
    const { data } = await api.patch(`/vulnerabilities/${id}/status`, { status, reason })
    return data
  },
  async getStats(repository_id?: string) {
    const { data } = await api.get('/vulnerabilities/stats/summary', {
      params: repository_id ? { repository_id } : {}
    })
    return data
  },
}

export const dashboardService = {
  async getMetrics() {
    const { data } = await api.get('/dashboard/metrics')
    return data
  },
}

export const analyticsService = {
  async getTrends(months = 6) {
    const { data } = await api.get('/analytics/trends', { params: { months } })
    return data
  },
  async getScannerBreakdown() {
    const { data } = await api.get('/analytics/scanner-breakdown')
    return data
  },
  async getTopVulnerableRepos(limit = 5) {
    const { data } = await api.get('/analytics/top-vulnerable-repos', { params: { limit } })
    return data
  },
  async getPipelineStats(days = 30) {
    const { data } = await api.get('/analytics/pipeline-stats', { params: { days } })
    return data
  },
  async getScanActivity(days = 7) {
    const { data } = await api.get('/analytics/scan-activity', { params: { days } })
    return data
  },
}

export const notificationService = {
  async list(unread_only = false) {
    const { data } = await api.get('/notifications/', { params: { unread_only } })
    return data
  },
  async markRead(id: string) {
    await api.post(`/notifications/${id}/read`)
  },
  async markAllRead() {
    await api.post('/notifications/read-all')
  },
  async delete(id: string) {
    await api.delete(`/notifications/${id}`)
  },
}

export const reportService = {
  async list(project_id?: string) {
    const { data } = await api.get('/reports/', { params: project_id ? { project_id } : {} })
    return data
  },
  async generate(payload: { title: string; type: string; format: string; project_id?: string; repository_id?: string }) {
    const { data } = await api.post('/reports/generate', payload)
    return data
  },
  getDownloadUrl(report_id: string, format: string, repository_id?: string) {
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1')
    const params = new URLSearchParams({ format })
    if (repository_id) params.set('repository_id', repository_id)
    return `${base}/reports/${report_id}/download?${params}`
  },
}

export const userService = {
  async list() {
    const { data } = await api.get('/users/')
    return data
  },
}
