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

export const connectDB = async () => {
  if (isConnected) return mongoose.connection

  if (!env.MONGODB_URI) {
    logger.warn('⚠️  MONGODB_URI is not defined in environment.')
    logger.warn('ℹ️  Running in offline/mock mode for endpoints that do not require MongoDB.')
    return null
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    })
    isConnected = true
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`)
    return conn
  } catch (err) {
    isConnected = false
    logger.warn(`⚠️  MongoDB connection failed: ${err.message}`)
    logger.warn('ℹ️  Running in offline/mock mode for endpoints that do not require MongoDB.')
    return null
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
  return {
    connected: state === 1,
    status: readyStateMap[state] || 'unknown',
    host: isConnected ? mongoose.connection.host : null,
  }
}

export default connectDB
