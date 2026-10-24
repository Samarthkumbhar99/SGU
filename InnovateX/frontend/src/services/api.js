import axios from 'axios'
import { useAuthStore } from '../store/index.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  googleAuth: (token, accessToken) => api.post('/auth/google', { token, accessToken }),
  googleExchangeCode: (code, redirect_uri) => api.post('/auth/google/code', { code, redirect_uri }),
  me: () => api.get('/auth/me'),
}

// Dashboard
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
}

// Warehouses
export const warehousesAPI = {
  getAll: () => api.get('/warehouses'),
}

// Stores
export const storesAPI = {
  getAll: () => api.get('/stores'),
}

// Products
export const productsAPI = {
  getAll: () => api.get('/products'),
}

// Inventory
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
}

// Routes
export const routesAPI = {
  getAll: () => api.get('/routes'),
}

// Optimization & Decision Intelligence (Phase 4 & 5)
export const optimizationAPI = {
  solve: (data) => api.post('/optimization/solve', data),
  simulate: (data) => api.post('/optimization/simulate', data),
  getRuns: (params) => api.get('/optimization/runs', { params }),
  getRunById: (runId) => api.get(`/optimization/runs/${runId}`),
}

// Analytical Intelligence & Reorder Monitoring (Phase 2)
export const analyticsAPI = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getInventory: (params) => api.get('/analytics/inventory', { params }),
  getDemand: (params) => api.get('/analytics/demand', { params }),
  getSuppliers: () => api.get('/analytics/suppliers'),
  getRecommendations: () => api.get('/analytics/recommendations'),
}

// Demand Forecasting Engine (Phase 3)
export const forecastingAPI = {
  predict: (data) => api.post('/forecast/predict', data),
  train: (data) => api.post('/forecast/train', data),
  evaluate: (data) => api.post('/forecast/evaluate', data),
  getModels: () => api.get('/forecast/models'),
}

// Scenarios
export const scenariosAPI = {
  getAll: () => api.get('/scenarios'),
  getById: (id) => api.get(`/scenarios/${id}`),
  create: (data) => api.post('/scenarios', data),
  run: (id) => api.post(`/scenarios/${id}/run`),
}

// Optimization Plans
export const plansAPI = {
  getById: (id) => api.get(`/optimization-plans/${id}`),
  approve: (id, data) => api.post(`/optimization-plans/${id}/approve`, data),
  reject: (id, data) => api.post(`/optimization-plans/${id}/reject`, data),
}
