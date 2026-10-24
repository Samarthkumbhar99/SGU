const mongoose = require('mongoose')

let isConnected = false

const connectDB = async () => {
  if (isConnected) return

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    isConnected = true
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.warn(`⚠️  MongoDB connection failed: ${err.message}`)
    console.warn('ℹ️  Running in offline/mock mode for endpoints that do not require MongoDB.')
  }
}

module.exports = connectDB
