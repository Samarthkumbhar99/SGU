import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'

describe('Backend Foundation — Health & Operational Endpoints', () => {
  it('GET /api/v1/health should return HTTP 200 and valid JSON liveness status', async () => {
    const res = await request(app).get('/api/v1/health')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('service', 'supplyshield-backend')
    expect(res.body).toHaveProperty('version')
    expect(res.body).toHaveProperty('uptimeSeconds')
    expect(res.body).toHaveProperty('timestamp')
    expect(res.headers['x-correlation-id']).toBeDefined()
  })

  it('GET /api/v1/health/dependencies should return HTTP 200 and dependencies status', async () => {
    const res = await request(app)
      .get('/api/v1/health/dependencies')
      .set('x-correlation-id', 'test-cid-123')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('status')
    expect(res.body).toHaveProperty('dependencies')
    expect(res.body.dependencies).toHaveProperty('mongodb')
    expect(res.body.dependencies).toHaveProperty('mlService')
    expect(res.headers['x-correlation-id']).toBe('test-cid-123')
  })

  it('GET /api-docs.json should return the valid OpenAPI 3.0 specification', async () => {
    const res = await request(app).get('/api-docs.json')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('openapi', '3.0.3')
    expect(res.body.info).toHaveProperty('title', 'SupplyShield AI — Backend API')
    expect(res.body.paths).toHaveProperty('/api/v1/health')
    expect(res.body.paths).toHaveProperty('/api/v1/health/dependencies')
    expect(res.body.paths).toHaveProperty('/api/v1/auth/signup')
  })

  it('GET /api/v1/nonexistent should return standard 404 JSON', async () => {
    const res = await request(app).get('/api/v1/nonexistent')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      success: false,
      message: 'Route GET /api/v1/nonexistent not found.',
    })
  })
})
