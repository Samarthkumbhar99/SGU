const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/authRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const inventoryRoutes = require('./routes/inventoryRoutes')
const entityRoutes = require('./routes/entityRoutes')
const onboardingRoutes = require('./routes/onboardingRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const { errorHandler, notFound } = require('./middleware/errorHandler')

const app = express()

// ——— Security ———
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// ——— CORS ———
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://supplyshieldxai.netlify.app',
]
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps, same-origin)
    if (!origin) return callback(null, true)
    const normalized = origin.replace(/\/$/, '')
    if (allowedOrigins.some(o => o.replace(/\/$/, '') === normalized)) {
      callback(null, true)
    } else {
      callback(null, true) // Permissive in dev/cloud to ensure Netlify previews work
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ——— Body parsing ———
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))
app.use(cookieParser())

// ——— Logging ———
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ——— Health check ———
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'supplychield-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// ——— API Routes ———
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)
app.use('/api/v1/inventory', inventoryRoutes)
app.use('/api/v1/entities', entityRoutes)
app.use('/api/v1/onboarding', onboardingRoutes)
app.use('/api/v1/notifications', notificationRoutes)

// ——— 404 & Error handling ———
app.use(notFound)
app.use(errorHandler)

module.exports = app
