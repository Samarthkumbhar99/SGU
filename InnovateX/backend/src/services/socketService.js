import { Server } from 'socket.io'
import env from '../config/env.js'
import logger from '../utils/logger.js'

let io = null

// Seed initial supply chain notifications
const notificationsBuffer = [
  {
    id: 'notif_init_1',
    title: 'Critical Stockout Alert',
    message: 'Store S-04 (Mumbai South) inventory below 8% safety threshold for SKU-MILK-001.',
    type: 'risk', // 'risk' | 'good' | 'engine' | 'change'
    category: 'Inventory',
    facilityId: 'WH-MUM-01',
    skuId: 'SKU-MILK-001',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    read: false,
    link: '/inventory',
  },
  {
    id: 'notif_init_2',
    title: 'Highway NH-48 Disruption',
    message: 'Freight delay on Western corridor. Google OR-Tools solver initiating 2.8s re-routing.',
    type: 'risk',
    category: 'Logistics',
    facilityId: 'WH-MUM-01',
    skuId: null,
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    read: false,
    link: '/network-map',
  },
  {
    id: 'notif_init_3',
    title: 'Google OR-Tools Optimization Complete',
    message: 'Regional MILP network schedule solved in 2.14s. 14 cross-dock routes confirmed.',
    type: 'engine',
    category: 'Engine',
    facilityId: 'WH-PUN-02',
    skuId: null,
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    read: false,
    link: '/network-map',
  },
  {
    id: 'notif_init_4',
    title: 'Optimal Flow Restored',
    message: 'Pune Metro Hub (WH-PUN-02) achieved 99.4% fill-rate across dairy & bakery staples.',
    type: 'good',
    category: 'Performance',
    facilityId: 'WH-PUN-02',
    skuId: 'SKU-BUTTER-002',
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    read: true,
    link: '/inventory-table',
  },
  {
    id: 'notif_init_5',
    title: 'Dynamic FEFO Expiry Routing',
    message: '420 units of expiring yogurt batches automatically redirected to high-velocity store S-02.',
    type: 'engine',
    category: 'Engine',
    facilityId: 'WH-NAG-03',
    skuId: 'SKU-YOGURT-004',
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    read: true,
    link: '/inventory',
  },
]

// Dynamic templates for automated realtime engine events
const EVENT_TEMPLATES = [
  {
    type: 'risk',
    category: 'Cold-Chain',
    title: 'Cold-Chain Excursion Warning',
    message: 'Refrigerated Bay 3 at WH-NAG-03 registered +1.8°C shift. FEFO dispatch expedited.',
    link: '/inventory-table',
  },
  {
    type: 'engine',
    category: 'Engine',
    title: 'MILP Solver Multi-Day Rebalance',
    message: 'Mathematical optimization re-allocated 640kg from Bhiwandi DC to absorb weekend surge.',
    link: '/network-map',
  },
  {
    type: 'good',
    category: 'Sustainability',
    title: 'Zero-Waste Defense Milestones',
    message: 'Dynamic FEFO preserved 185 units of perishable inventory from landfill write-off.',
    link: '/inventory',
  },
  {
    type: 'change',
    category: 'Inventory',
    title: 'Safety Stock Threshold Calibrated',
    message: 'Reorder point for SKU-PANEER-003 increased to 310 units based on trailing velocity.',
    link: '/inventory',
  },
  {
    type: 'engine',
    category: 'Engine',
    title: 'AI Demand Forecast Synchronized',
    message: 'LightGBM model updated 7-day store demand projections with 94.2% historical accuracy.',
    link: '/inventory',
  },
  {
    type: 'good',
    category: 'Logistics',
    title: 'Dock Transshipment Succeeded',
    message: 'Fleet Van V-104 completed direct cross-dock transfer without staging delay.',
    link: '/network-map',
  },
  {
    type: 'risk',
    category: 'Inventory',
    title: 'Phantom Inventory Mismatch Flagged',
    message: 'POS telemetry at Store S-08 indicates stock mismatch. Cycle count triggered.',
    link: '/inventory-table',
  },
]

/**
 * Initialize Socket.IO with HTTP server
 */
export function initSocket(server) {
  const allowedOrigins = [
    env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'https://supplyshieldxai.netlify.app',
    ...(env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map((s) => s.trim()) : []),
  ].filter(Boolean)

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.endsWith('.netlify.app') ||
          origin === 'https://supplyshieldxai.netlify.app'
        ) {
          callback(null, true)
        } else {
          callback(new Error(`CORS: origin '${origin}' not allowed.`))
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, '🔌 Realtime notification WebSocket client connected')

    // Send existing notifications on connect
    socket.emit('notifications:init', notificationsBuffer)

    socket.on('notifications:mark-read', () => {
      notificationsBuffer.forEach((n) => {
        n.read = true
      })
      io.emit('notifications:updated', notificationsBuffer)
    })

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'WebSocket client disconnected')
    })
  })

  // Start automated background realtime simulation
  startRealtimeSimulation()

  return io
}

/**
 * Broadcast a new notification to all clients and add to buffer
 */
export function broadcastNotification(notifData) {
  const notif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: notifData.title || 'SupplyShield Event',
    message: notifData.message || '',
    type: notifData.type || 'engine',
    category: notifData.category || 'General',
    facilityId: notifData.facilityId || null,
    skuId: notifData.skuId || null,
    timestamp: new Date().toISOString(),
    read: false,
    link: notifData.link || '/inventory',
  }

  // Prepend to buffer, max 50 items
  notificationsBuffer.unshift(notif)
  if (notificationsBuffer.length > 50) {
    notificationsBuffer.pop()
  }

  if (io) {
    io.emit('notification:new', notif)
  }

  return notif
}

/**
 * Get all notifications
 */
export function getNotifications() {
  return [...notificationsBuffer]
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead() {
  notificationsBuffer.forEach((n) => {
    n.read = true
  })
  if (io) {
    io.emit('notifications:updated', notificationsBuffer)
  }
  return notificationsBuffer
}

/**
 * Clear notifications
 */
export function clearAllNotifications() {
  notificationsBuffer.length = 0
  if (io) {
    io.emit('notifications:updated', notificationsBuffer)
  }
}

/**
 * Automated simulation emitter (every 16-24s sends an event)
 */
let simTimer = null
function startRealtimeSimulation() {
  if (simTimer) clearInterval(simTimer)

  let index = 0
  simTimer = setInterval(() => {
    const template = EVENT_TEMPLATES[index % EVENT_TEMPLATES.length]
    index++
    broadcastNotification(template)
  }, 18000)
}
