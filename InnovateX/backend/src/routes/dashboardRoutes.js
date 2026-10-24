import express from 'express'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Dashboard summary endpoint
// Returns aggregated KPIs from the network
router.get('/summary', protect, async (req, res, next) => {
  try {
    const summary = {
      totalInventory: 284750,
      inventoryChange: 3.2,
      storesAtRisk: 4,
      riskChange: -1,
      expiringProducts: 12,
      expiryChange: 2,
      openScenarios: 3,
      distributionCost: 12090,
      costChange: -18.4,
      serviceLevel: 96.8,
      serviceLevelChange: 1.4,
      pendingApprovals: 2,
      dataSource: 'synthetic-demo',
      generatedAt: new Date().toISOString(),
    }

    res.json({ success: true, data: summary })
  } catch (err) {
    next(err)
  }
})

export default router
