import axios from 'axios'
import WebApp from '@twa-dev/sdk'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach Telegram initData to every request for auth
client.interceptors.request.use((config) => {
  const initData = WebApp.initData
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData
  }
  return config
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error?.response?.data?.detail || error.message || 'Желі қатесі'
    return Promise.reject(new Error(message))
  }
)

export default client
