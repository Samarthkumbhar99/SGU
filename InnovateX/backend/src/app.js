import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import pinoHttp from 'pino-http'
import { randomUUID } from 'crypto'

import env from './config/env.js'
import logger from './utils/logger.js'
import setupSwagger from './config/swagger.js'
import healthRoutes from './routes/healthRoutes.js'
import authRoutes from './routes/authRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import inventoryRoutes from './routes/inventoryRoutes.js'
import dataRoutes from './routes/dataRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import forecastRoutes from './routes/forecastRoutes.js'
import entityRoutes from './routes/entityRoutes.js'
import onboardingRoutes from './routes/onboardingRoutes.js'
import optimizationRoutes from './routes/optimizationRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const app = express()

// ——— Correlation ID Middleware ———
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || randomUUID()
  req.correlationId = correlationId
  res.setHeader('x-correlation-id', correlationId)
  next()
})

// ——— Security: Helmet ———
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  })
)

// ——— Security: Rate Limiting ———
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 10000 : 300, // Max 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
})
app.use('/api/', limiter)

// ——— CORS ———
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://supplyshieldxai.netlify.app',
  ...(env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map((s) => s.trim()) : []),
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, same-origin)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.netlify.app') ||
        origin === 'https://supplyshieldxai.netlify.app'
      ) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed.`))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-request-id'],
  })
)

// ——— Body parsing ———
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))
app.use(cookieParser())

// ——— Structured HTTP Logging ———
if (env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.correlationId,
      customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error'
        if (res.statusCode >= 400) return 'warn'
        return 'info'
      },
    })
  )
}

// ——— Swagger / OpenAPI Documentation ———
setupSwagger(app)

// ——— API Routes ———
app.use('/api/v1/health', healthRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)
app.use('/api/v1/inventory', inventoryRoutes)
app.use('/api/v1/entities', entityRoutes)
app.use('/api/v1/onboarding', onboardingRoutes)
app.use('/api/v1', dataRoutes)
app.use('/api/v1', analyticsRoutes)
app.use('/api/v1', forecastRoutes)
app.use('/api/v1', optimizationRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/chat', chatRoutes)
app.use('/api/v1/reports', reportRoutes)
app.use('/api/v1/payments', paymentRoutes)


// ——— 404 & Centralized Error handling ———
app.use(notFound)
app.use(errorHandler)

export default app
