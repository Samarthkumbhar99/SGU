import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import connectDB, { disconnectDB } from '../src/config/db.js'
import {
  calculateDaysOfSupply,
  calculateInventoryValuation,
} from '../src/services/analyticsService.js'

describe('Supply-Chain Intelligence & Analytics Service', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await disconnectDB()
  })

  // ——— 1. Mathematical & Formula Verification ———
  describe('Formulas & Mathematical Units', () => {
    it('calculateInventoryValuation should compute Σ(quantity × unitCost) precisely', () => {
      expect(calculateInventoryValuation(100, 15.5)).toBe(1550.0)
      expect(calculateInventoryValuation(0, 20.0)).toBe(0)
      expect(calculateInventoryValuation(null, 15.0)).toBe(0)
      expect(calculateInventoryValuation(-10, 15.0)).toBe(0)
    })

    it('calculateDaysOfSupply should compute available inventory / avg daily demand', () => {
      const result = calculateDaysOfSupply(300, 15.0)
      expect(result.daysOfSupply).toBe(20.0)
      expect(result.explanation).toContain('20 days based on available stock (300 units)')
    })

    it('calculateDaysOfSupply should return null with explanation when demand is zero or negative', () => {
      const zeroDemand = calculateDaysOfSupply(300, 0)
      expect(zeroDemand.daysOfSupply).toBeNull()
      expect(zeroDemand.explanation).toContain('Average daily demand is zero or unavailable')

      const negativeDemand = calculateDaysOfSupply(300, -5)
      expect(negativeDemand.daysOfSupply).toBeNull()
    })

    it('calculateDaysOfSupply should return null when inventory is null or negative', () => {
      const nullInv = calculateDaysOfSupply(null, 10)
      expect(nullInv.daysOfSupply).toBeNull()
      expect(nullInv.explanation).toContain('unavailable or invalid')
    })
  })

  // ——— 2. GET /api/v1/analytics/overview ———
  describe('GET /api/v1/analytics/overview', () => {
    it('should return network-wide KPI summary with valuation and stock health', async () => {
      const res = await request(app).get('/api/v1/analytics/overview')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('kpis')
      expect(res.body.data).toHaveProperty('inventoryHealth')
      expect(res.body.data).toHaveProperty('recentDemandVelocity')

      const { kpis, inventoryHealth } = res.body.data
      expect(kpis.totalInventoryUnits).toBeGreaterThan(0)
      expect(kpis.totalInventoryValuation).toBeGreaterThan(0)
      expect(kpis.activeSkusCount).toBe(50)
      expect(kpis.activeWarehousesCount).toBe(5)
      expect(kpis.activeSuppliersCount).toBe(10)

      expect(inventoryHealth).toHaveProperty('totalPositions')
      expect(inventoryHealth).toHaveProperty('lowStockPositions')
      expect(inventoryHealth).toHaveProperty('excessStockPositions')
    })

    it('should support filtering overview by warehouseId', async () => {
      const res = await request(app).get('/api/v1/analytics/overview?warehouseId=WH_1')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.inventoryHealth.totalPositions).toBe(50) // 50 SKUs in WH_1
    })
  })

  // ——— 3. GET /api/v1/analytics/inventory ———
  describe('GET /api/v1/analytics/inventory', () => {
    it('should return enriched inventory positions with days of supply and stock categorization', async () => {
      const res = await request(app).get('/api/v1/analytics/inventory?limit=5')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeLessThanOrEqual(5)

      const item = res.body.data[0]
      expect(item).toHaveProperty('skuId')
      expect(item).toHaveProperty('warehouseId')
      expect(item).toHaveProperty('valuation')
      expect(item).toHaveProperty('stockStatus')
      expect(['HEALTHY', 'REORDER_TRIGGERED', 'CRITICAL_LOW', 'EXCESS', 'STOCKOUT']).toContain(
        item.stockStatus
      )
      expect(res.body).toHaveProperty('warehouseDistribution')
      expect(Array.isArray(res.body.warehouseDistribution)).toBe(true)
      expect(res.body.warehouseDistribution.length).toBe(5)
    })

    it('should filter to only low-stock positions when lowStock=true', async () => {
      const res = await request(app).get('/api/v1/analytics/inventory?lowStock=true')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      res.body.data.forEach((item) => {
        expect(item.inventoryLevel).toBeLessThanOrEqual(item.reorderPoint)
        expect(item.isLowStock).toBe(true)
      })
    })
  })

  // ——— 4. GET /api/v1/analytics/demand ———
  describe('GET /api/v1/analytics/demand', () => {
    it('should aggregate demand daily with statistical volatility metrics', async () => {
      const res = await request(app).get('/api/v1/analytics/demand?startDate=2024-01-01&endDate=2024-01-14')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('summary')
      expect(res.body.data.summary).toHaveProperty('meanDailySales')
      expect(res.body.data.summary).toHaveProperty('standardDeviation')
      expect(res.body.data.summary).toHaveProperty('coefficientOfVariation')
      expect(res.body.data).toHaveProperty('timeSeries')
      expect(res.body.data.timeSeries.length).toBeGreaterThan(0)
    })

    it('should aggregate demand monthly when granularity=monthly', async () => {
      const res = await request(app).get(
        '/api/v1/analytics/demand?granularity=monthly&startDate=2024-01-01&endDate=2024-12-30'
      )

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.granularity).toBe('monthly')
      expect(res.body.data.timeSeries.length).toBe(12) // 12 calendar months
      expect(res.body.data.timeSeries[0].period).toBe('2024-01')
    })

    it('should provide promotion comparison with sample sizes and statistical caveat', async () => {
      const res = await request(app).get('/api/v1/analytics/demand')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('promotionAnalysis')
      const promo = res.body.data.promotionAnalysis
      expect(promo.promotional.sampleSize).toBe(9270)
      expect(promo.baselineNonPromotional.sampleSize).toBe(81980)
      expect(promo.promotional.meanSalesPerDay).toBeGreaterThan(0)
      expect(promo.statisticalCaveat).toContain('Descriptive statistics only')
    })
  })

  // ——— 5. GET /api/v1/analytics/suppliers ———
  describe('GET /api/v1/analytics/suppliers', () => {
    it('should return supplier profiles with lead-time analytics and inventory held', async () => {
      const res = await request(app).get('/api/v1/analytics/suppliers')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBe(10) // 10 distinct suppliers

      const s = res.body.data[0]
      expect(s).toHaveProperty('supplierId')
      expect(s).toHaveProperty('leadTimeStats')
      expect(s.leadTimeStats).toHaveProperty('avgLeadTimeDays')
      expect(s.leadTimeStats).toHaveProperty('leadTimeRisk')
      expect(s).toHaveProperty('currentInventoryUnitsHeld')
    })
  })

  // ——— 6. GET /api/v1/recommendations ———
  describe('GET /api/v1/recommendations', () => {
    it('should generate prioritized deterministic recommendations with triggers and actions', async () => {
      const res = await request(app).get('/api/v1/recommendations')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('totalRecommendations')
      expect(res.body.data).toHaveProperty('criticalCount')
      expect(res.body.data).toHaveProperty('warningCount')
      expect(res.body.data).toHaveProperty('infoCount')
      expect(Array.isArray(res.body.data.recommendations)).toBe(true)

      if (res.body.data.recommendations.length > 0) {
        const rec = res.body.data.recommendations[0]
        expect(rec).toHaveProperty('id')
        expect(rec).toHaveProperty('type')
        expect(rec).toHaveProperty('severity')
        expect(['CRITICAL', 'WARNING', 'INFO']).toContain(rec.severity)
        expect(rec).toHaveProperty('triggerRule')
        expect(rec).toHaveProperty('recommendedAction')
        expect(rec).toHaveProperty('caveats')
        expect(rec).toHaveProperty('generatedAt')
      }
    })

    it('should filter recommendations by warehouseId and skuId', async () => {
      const res = await request(app).get('/api/v1/recommendations?warehouseId=WH_1&skuId=SKU_1')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      res.body.data.recommendations.forEach((rec) => {
        expect(rec.warehouseId).toBe('WH_1')
        expect(rec.skuId).toBe('SKU_1')
      })
    })
  })

  // ——— 7. GET /api/v1/dashboard/summary live MongoDB integration ———
  describe('GET /api/v1/dashboard/summary integration', () => {
    it('should return real aggregated numbers from MongoDB when database is active', async () => {
      const User = (await import('../src/models/User.js')).default
      let user = await User.findOne({ email: 'analytics_test@supplyshield.io' })
      if (!user) {
        user = await User.create({
          name: 'Analytics Test User',
          email: 'analytics_test@supplyshield.io',
          role: 'Distribution Manager',
          isActive: true,
        })
      }

      const { generateToken } = await import('../src/utils/jwt.js')
      const testToken = generateToken(user._id)

      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${testToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('totalInventory')
      expect(res.body.data).toHaveProperty('storesAtRisk')
      expect(res.body.data.dataSource).toBe('mongodb-live')
    })
  })
})
