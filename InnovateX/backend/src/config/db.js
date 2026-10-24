const mongoose = require('mongoose')
const dns = require('dns')

// Fix for Windows Node.js querySrv ECONNREFUSED on MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
} catch (e) {
  // If not supported in environment, continue with system defaults
}

let isConnected = false

const connectDB = async () => {
  if (isConnected) return

  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI is not defined in .env')
    return
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    })
    isConnected = true
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.warn(`⚠️  MongoDB connection failed: ${err.message}`)
    console.warn('ℹ️  Running in offline/mock mode for endpoints that do not require MongoDB.')
  }
}

module.exports = connectDB
