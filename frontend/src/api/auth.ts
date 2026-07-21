import client from '@/api/client'

export interface LoginResult {
  token: string
  role: string
  username: string
  display_name?: string
}

export const authApi = {
  login: (username: string, password: string) =>
    client.post<{ data: LoginResult }>('/auth/login', { username, password }),

  me: () => client.get('/auth/me'),
}

export function saveAuthToken(token: string) {
  localStorage.setItem('auth_token', token)
}

export function clearAuthToken() {
  localStorage.removeItem('auth_token')
}
