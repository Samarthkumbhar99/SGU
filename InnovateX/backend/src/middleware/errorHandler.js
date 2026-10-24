// Centralized error handling middleware
// Must be registered AFTER all routes with app.use(errorHandler)

const errorHandler = (err, req, res, next) => {
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

  // JWT errors handled in middleware — just in case
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token.'
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired. Please sign in again.'
  }

  // Zod errors (if thrown directly)
  if (err.name === 'ZodError') {
    statusCode = 400
    message = 'Validation failed'
    return res.status(statusCode).json({
      success: false,
      message,
      errors: err.flatten ? err.flatten().fieldErrors : err.errors,
    })
  }

  // Never expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An internal server error occurred.'
  }

  console.error(`[${statusCode}] ${req.method} ${req.originalUrl} — ${message}`)
  if (statusCode === 500) console.error(err.stack)

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode === 500 && { stack: err.stack }),
  })
}

// 404 handler — call for unmatched routes
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  })
}

module.exports = { errorHandler, notFound }
