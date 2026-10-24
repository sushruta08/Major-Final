import api from './api'
import type { User } from '../types'

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { email: string; username: string; full_name: string; password: string; role: string }
export interface AuthResponse { access_token: string; token_type: string; expires_in: number; user: User }

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', payload)
    return data
  },
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', payload)
    return data
  },
  async getMe(): Promise<User> {
    const { data } = await api.get('/auth/me')
    return data
  },
  async updateProfile(payload: { full_name?: string; email?: string }): Promise<User> {
    const { data } = await api.put('/users/me', payload)
    return data
  },
  async changePassword(current_password: string, new_password: string): Promise<void> {
    await api.post('/users/me/change-password', { current_password, new_password })
  },
}
