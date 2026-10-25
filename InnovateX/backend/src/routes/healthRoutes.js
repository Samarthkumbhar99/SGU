import express from 'express'
import env from '../config/env.js'
import { getDbStatus } from '../config/db.js'
import mlClient from '../integrations/mlClient.js'

const router = express.Router()
const startTime = Date.now()

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     summary: Application Liveness Probe
 *     description: Returns the operational status of the Express backend.
 *     responses:
 *       200:
 *         description: Service is alive and accepting traffic
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'supplyshield-backend',
    version: '1.0.0',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  })
})

/**
 * @openapi
 * /api/v1/health/dependencies:
 *   get:
 *     summary: Dependency Readiness & Health Probe
 *     description: Inspects connectivity to MongoDB Atlas and the FastAPI ML microservice.
 *     responses:
 *       200:
 *         description: Dependency health statuses
 */
router.get('/dependencies', async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id']

  // 1. Inspect MongoDB status
  const dbStatus = getDbStatus()

  // 2. Inspect ML Service status
  const mlStart = Date.now()
  let mlStatus = {
    status: 'unreachable',
    connected: false,
    latencyMs: null,
    url: env.ML_SERVICE_URL,
    details: null,
  }

  try {
    const mlHealth = await mlClient.checkHealth({
      timeoutMs: 3000,
      correlationId,
    })
    mlStatus = {
      status: mlHealth?.status || 'healthy',
      connected: true,
      latencyMs: Date.now() - mlStart,
      url: env.ML_SERVICE_URL,
      details: mlHealth,
    }
  } catch (err) {
    mlStatus.error = err.message
    mlStatus.latencyMs = Date.now() - mlStart
  }

  const overallReady = dbStatus.connected || mlStatus.connected

  res.json({
    success: true,
    status: overallReady ? 'ready' : 'degraded',
    service: 'supplyshield-backend',
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: {
        ...dbStatus,
        mode: dbStatus.connected ? 'atlas-live' : 'in-memory-fallback',
      },
      mlService: mlStatus,
    },
  })
})

export default router
