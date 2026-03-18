import axios from 'axios'
import { clearAuthToken, getAuthToken } from '../utils/auth'

const routerBase = (import.meta.env.VITE_ROUTER_BASENAME || '').replace(/\/$/, '')
const loginPath = `${routerBase}/login` || '/login'

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
    },
})

client.interceptors.request.use((config) => {
    const token = getAuthToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

client.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error?.response?.status === 401) {
            clearAuthToken()
            if (!window.location.pathname.endsWith('/login')) {
                window.location.href = loginPath
            }
        }

        const detail = error?.response?.data?.detail
        const message = typeof detail === 'string' ? detail : 'Сұрау кезінде қате пайда болды'
        return Promise.reject(new Error(message))
    }
)

export default client