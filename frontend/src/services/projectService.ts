import api from './api'

export const projectService = {
  async list(skip = 0, limit = 50) {
    const { data } = await api.get('/projects/', { params: { skip, limit } })
    return data
  },
  async get(id: string) {
    const { data } = await api.get(`/projects/${id}`)
    return data
  },
  async create(payload: { name: string; description?: string }) {
    const { data } = await api.post('/projects/', payload)
    return data
  },
  async update(id: string, payload: { name?: string; description?: string }) {
    const { data } = await api.put(`/projects/${id}`, payload)
    return data
  },
  async delete(id: string) {
    await api.delete(`/projects/${id}`)
  },
}

export const repositoryService = {
  async list(project_id?: string) {
    const { data } = await api.get('/repositories/', { params: project_id ? { project_id } : {} })
    return data
  },
  async get(id: string) {
    const { data } = await api.get(`/repositories/${id}`)
    return data
  },
  async create(payload: { project_id: string; name: string; url: string; provider?: string; default_branch?: string; is_private?: boolean }) {
    const { data } = await api.post('/repositories/', payload)
    return data
  },
  async delete(id: string) {
    await api.delete(`/repositories/${id}`)
  },
  async getStats(id: string) {
    const { data } = await api.get(`/repositories/${id}/stats`)
    return data
  },
}
