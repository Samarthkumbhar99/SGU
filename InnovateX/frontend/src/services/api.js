import axios from 'axios'
import { useAuthStore } from '../store/index.js'

const api = axios.create({
  baseURL: '/api/v1',
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
  getSummary: () => api.get('/inventory/summary'),
  createBatch: (data) => api.post('/inventory', data),
}

// Routes
export const routesAPI = {
  getAll: () => api.get('/routes'),
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

// Entities & FMCG Network
export const entityAPI = {
  getMyNetwork: () => api.get('/entities/my-network'),
  createStore: (data) => api.post('/entities/stores', data),
  updateStore: (id, data) => api.put(`/entities/stores/${id}`, data),
  createWarehouse: (data) => api.post('/entities/warehouses', data),
  updateWarehouse: (id, data) => api.put(`/entities/warehouses/${id}`, data),
  search: (q, type) => api.get('/entities/search', { params: { q, type } }),
  requestAccess: (data) => api.post('/entities/access-requests', data),
  reviewAccess: (id, data) => api.patch(`/entities/access-requests/${id}/review`, data),
  updateLiveLocation: (data) => api.post('/entities/location', data),
}

// Notifications
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  simulate: (data) => api.post('/notifications/simulate', data),
}

