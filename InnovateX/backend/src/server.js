require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/db')

const PORT = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 SupplyShield Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
  console.log(`🔗 Health check available at http://localhost:${PORT}/api/v1/health`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})
