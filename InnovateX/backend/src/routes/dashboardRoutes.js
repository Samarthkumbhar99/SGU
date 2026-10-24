const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')

// Dashboard summary endpoint
// Returns aggregated KPIs from the network
router.get('/summary', protect, async (req, res, next) => {
  try {
    // In Phase 3 this will aggregate from Mongoose models.
    // For Phase 1/2, return the demo synthetic dataset.
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

module.exports = router
