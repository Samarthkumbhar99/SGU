import mongoose from 'mongoose'
import dns from 'dns'
import env from './env.js'
import logger from '../utils/logger.js'

// Fix for Windows Node.js querySrv ECONNREFUSED on MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
} catch (e) {
  // If not supported in environment, continue with system defaults
}

let isConnected = false

/**
 * Redact username:password credentials from database connection URI for safe logging
 */
export const sanitizeMongoUri = (uri) => {
  if (!uri) return 'undefined'
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')
}

export const connectDB = async (options = {}) => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  const uri = options.uri || env.MONGODB_URI

  if (!uri) {
    if (env.ALLOW_MEMORY_FALLBACK) {
      logger.warn('⚠️  MONGODB_URI is not set. Operating in explicit test/in-memory fallback mode.')
      return null
    }
    const errorMsg = '❌ MONGODB_URI is required but not configured. Set MONGODB_URI in .env.'
    logger.fatal(errorMsg)
    throw new Error(errorMsg)
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    const errorMsg = `❌ Invalid MONGODB_URI protocol: ${sanitizeMongoUri(uri)}. Must start with mongodb:// or mongodb+srv://`
    logger.fatal(errorMsg)
    throw new Error(errorMsg)
  }

  try {
    const sanitizedUri = sanitizeMongoUri(uri)
    logger.info(`Connecting to MongoDB at: ${sanitizedUri}`)

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: options.timeoutMS || 6000,
      autoIndex: true, // Build indexes defined in schemas
    })

    isConnected = true
    logger.info(`✅ MongoDB connected successfully to database: '${conn.connection.name}' on host: '${conn.connection.host}'`)
    return conn
  } catch (err) {
    isConnected = false
    const sanitizedUri = sanitizeMongoUri(uri)
    logger.error({ err: err.message, target: sanitizedUri }, '❌ MongoDB connection error')

    if (!env.ALLOW_MEMORY_FALLBACK) {
      throw new Error(`Failed to connect to MongoDB at ${sanitizedUri}: ${err.message}`)
    }

    logger.warn('ℹ️  ALLOW_MEMORY_FALLBACK is enabled. Running with fallback for tests.')
    return null
  }
}

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    isConnected = false
    logger.info('MongoDB disconnected.')
  }
}

export const getDbStatus = () => {
  const readyStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }
  const state = mongoose.connection.readyState
  const connected = state === 1
  return {
    connected,
    status: readyStateMap[state] || 'unknown',
    databaseName: connected ? mongoose.connection.name : null,
    host: connected ? mongoose.connection.host : null,
    mode: connected
      ? 'mongodb-persistent'
      : env.ALLOW_MEMORY_FALLBACK
      ? 'in-memory-fallback'
      : 'unavailable',
  }
}

export default connectDB
