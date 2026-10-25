import express from 'express'
import {
  getOverview,
  getInventory,
  getDemand,
  getSuppliers,
  getRecommendations,
  simulateInventory,
} from '../controllers/analyticsController.js'

const router = express.Router()

// Analytical dashboards and distribution intelligence
router.get('/analytics/overview', getOverview)
router.get('/analytics/inventory', getInventory)
router.get('/analytics/demand', getDemand)
router.get('/analytics/suppliers', getSuppliers)
router.get('/analytics/recommendations', getRecommendations)

// Root recommendations endpoint per contract
router.get('/recommendations', getRecommendations)

// Inventory multi-day simulation
router.post('/inventory/simulate', simulateInventory)

export default router
