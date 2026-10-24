const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/authRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const entityRoutes = require('./routes/entityRoutes')
const onboardingRoutes = require('./routes/onboardingRoutes')
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
]
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps, same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed.`))
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
app.use('/api/v1/entities', entityRoutes)
app.use('/api/v1/onboarding', onboardingRoutes)

// ——— 404 & Error handling ———
app.use(notFound)
app.use(errorHandler)

module.exports = app
