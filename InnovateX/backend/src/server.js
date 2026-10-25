import app from './app.js'
import env from './config/env.js'
import connectDB from './config/db.js'
import logger from './utils/logger.js'

const PORT = env.PORT || 5000

// Initialize MongoDB connection asynchronously
connectDB().catch((err) => {
  logger.warn({ err: err.message }, 'MongoDB initial connection failed. Operating in fallback mode.')
})

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 SupplyShield Backend running on port ${PORT} [${env.NODE_ENV}]`)
  logger.info(`🔗 Health check available at: http://localhost:${PORT}/api/v1/health`)
  logger.info(`🔗 Dependency probe available at: http://localhost:${PORT}/api/v1/health/dependencies`)
  logger.info(`📚 Swagger docs available at: http://localhost:${PORT}/api-docs`)
})

// Graceful shutdown handling
const shutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`)
  server.close(() => {
    logger.info('HTTP server closed.')
    process.exit(0)
  })

  // Force shutdown after timeout if pending connections hang
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Promise Rejection')
})

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception')
  process.exit(1)
})

export default server
