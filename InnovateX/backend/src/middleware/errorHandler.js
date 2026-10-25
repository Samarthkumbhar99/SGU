import logger from '../utils/logger.js'
import env from '../config/env.js'

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'An unexpected error occurred.'

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400
    const errors = Object.values(err.errors).map((e) => e.message)
    message = errors.join('. ')
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    message = `A record with this ${field} already exists.`
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid value for field '${err.path}'.`
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token.'
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired. Please sign in again.'
  }

  // Zod errors
  if (err.name === 'ZodError') {
    statusCode = 400
    message = 'Validation failed'
    return res.status(statusCode).json({
      success: false,
      message,
      errors: err.flatten ? err.flatten().fieldErrors : err.errors,
    })
  }

  // Never expose internal error messages in production
  if (env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An internal server error occurred.'
  }

  logger.error(
    {
      statusCode,
      method: req.method,
      url: req.originalUrl,
      correlationId: req.headers['x-correlation-id'] || req.headers['x-request-id'],
      err: statusCode === 500 ? err.stack : undefined,
    },
    message
  )

  return res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && statusCode === 500 && { stack: err.stack }),
  })
}

// 404 handler for unmatched routes
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  })
}

export default { errorHandler, notFound }
