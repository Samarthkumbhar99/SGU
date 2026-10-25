import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import connectDB, { disconnectDB, sanitizeMongoUri } from '../src/config/db.js'
import { generateToken } from '../src/utils/jwt.js'
import User from '../src/models/User.js'

describe('SupplyChain Read APIs & Observability', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await disconnectDB()
  })

  it('sanitizeMongoUri should properly redact credentials', () => {
    const raw = 'mongodb+srv://admin_user:secretPassword123@cluster0.abcde.mongodb.net/supplyshield'
    const redacted = sanitizeMongoUri(raw)
    expect(redacted).toBe('mongodb+srv://admin_user:***@cluster0.abcde.mongodb.net/supplyshield')
    expect(redacted).not.toContain('secretPassword123')
  })

  it('GET /api/v1/products should return paginated list of products', async () => {
    const res = await request(app).get('/api/v1/products?limit=10')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeLessThanOrEqual(10)
    expect(res.body.pagination).toHaveProperty('page', 1)
    expect(res.body.pagination).toHaveProperty('total')
  })

  it('GET /api/v1/products?skuId=SKU_1 should filter by specific SKU', async () => {
    const res = await request(app).get('/api/v1/products?skuId=SKU_1')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    if (res.body.data.length > 0) {
      expect(res.body.data[0].skuId).toBe('SKU_1')
    }
  })

  it('GET /api/v1/warehouses should return distinct warehouse nodes', async () => {
    const res = await request(app).get('/api/v1/warehouses')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('warehouseId')
      expect(res.body.data[0]).toHaveProperty('regionsServed')
    }
  })

  it('GET /api/v1/stores should respond gracefully with metadata note when stores.csv is absent', async () => {
    const res = await request(app).get('/api/v1/stores')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.metadata).toBeDefined()
  })

  it('GET /api/v1/suppliers should return supplier profiles', async () => {
    const res = await request(app).get('/api/v1/suppliers')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('GET /api/v1/inventory should return current stock levels', async () => {
    const res = await request(app).get('/api/v1/inventory?limit=5')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('inventoryLevel')
      expect(res.body.data[0]).toHaveProperty('reorderPoint')
    }
  })

  it('GET /api/v1/demand/history should support filtering by region and date', async () => {
    const res = await request(app).get(
      '/api/v1/demand/history?region=West&startDate=2024-01-01&endDate=2024-01-07&limit=5'
    )

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    if (res.body.data.length > 0) {
      expect(res.body.data[0].region).toBe('West')
      expect(res.body.data[0].dateString >= '2024-01-01').toBe(true)
      expect(res.body.data[0].dateString <= '2024-01-07').toBe(true)
    }
  })

  it('GET /api/v1/data-quality/summary should report real data integrity findings', async () => {
    const res = await request(app).get('/api/v1/data-quality/summary')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('recordCounts')
    expect(res.body.data).toHaveProperty('dataIntegrity')
    expect(res.body.data.dataIntegrity).toHaveProperty('stockoutDistribution')
    expect(res.body.data.dataIntegrity.stockoutDistribution.isAllZeros).toBe(true)
    expect(res.body.data.dataIntegrity.missingSourceValues).toBe(0)
    expect(res.body.data.dataIntegrity.dateCoverage.startDate).toBe('2024-01-01')
    expect(res.body.data.dataIntegrity.dateCoverage.endDate).toBe('2024-12-30')
  })

  it('GET /api/v1/data-imports should return historical import audit logs', async () => {
    const res = await request(app).get('/api/v1/data-imports')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('importId')
      expect(res.body.data[0]).toHaveProperty('totalRows')
      expect(res.body.data[0]).toHaveProperty('status')
    }
  })

  it('POST /api/v1/data-imports/trigger should require authentication', async () => {
    const res = await request(app).post('/api/v1/data-imports/trigger').send({ dryRun: true })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('POST /api/v1/data-imports/trigger should succeed when authorized', async () => {
    let user = await User.findOne({ email: 'admin_test@supplyshield.io' })
    if (!user) {
      user = await User.create({
        name: 'Admin Test User',
        email: 'admin_test@supplyshield.io',
        role: 'Admin',
        isActive: true,
      })
    }
    const testToken = generateToken(user._id)

    const res = await request(app)
      .post('/api/v1/data-imports/trigger')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ dryRun: true })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.isDryRun).toBe(true)
  })
})
