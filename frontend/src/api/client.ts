import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  // 学院大屏会并发拉取多份学籍聚合数据，适当放宽超时
  timeout: 60_000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail
    const message = error.response?.data?.message
    const text =
      (typeof detail === 'string' && detail) ||
      (typeof message === 'string' && message) ||
      error.message ||
      '网络请求失败'
    return Promise.reject(new Error(text))
  },
)

export default client
