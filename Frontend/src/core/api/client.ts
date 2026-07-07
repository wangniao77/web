import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 15000,
})

client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

export default client
