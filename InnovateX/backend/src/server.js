require('dotenv').config()
const http = require('http')
const app = require('./app')
const connectDB = require('./config/db')
const { initSocket } = require('./socket')

const PORT = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

// Create HTTP server & attach WebSockets
const server = http.createServer(app)
initSocket(server)

// Start server
server.listen(PORT, () => {
  console.log(`🚀 SupplyShield Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
  console.log(`🔗 Health check available at http://localhost:${PORT}/api/v1/health`)
  console.log(`⚡ WebSocket server running and ready for real-time notifications`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})
