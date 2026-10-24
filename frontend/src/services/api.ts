/// <reference types="vite/client" />
import axios, { AxiosError } from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().tokens?.access_token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — force logout
api.interceptors.response.use(
  res => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
