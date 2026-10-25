const { Server } = require('socket.io')

let io = null

// Initial realistic FMCG notification stream
const notificationsHistory = [
  {
    id: 'notif-init-1',
    category: 'risk',
    level: 'critical',
    title: 'Critical Stockout Alert',
    message: 'Store S-01 (Mumbai Central) dairy inventory dipped to 6.2% of safety threshold for SKU-MILK-001.',
    entityType: 'Store',
    entityName: 'Store S-01 (Mumbai Central)',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/dashboard',
  },
  {
    id: 'notif-init-2',
    category: 'engine',
    level: 'info',
    title: 'MILP Optimization Solved',
    message: 'Autonomous solver re-planned 14 delivery arcs in 1.4s — 18.2% freight cost mitigated.',
    entityType: 'OptimizationEngine',
    entityName: 'OR-Tools MILP Engine',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/optimization',
  },
  {
    id: 'notif-init-3',
    category: 'good_condition',
    level: 'success',
    title: 'High Fill Rate Reached',
    message: '99.4% on-shelf availability maintained across all active retail partners this cycle.',
    entityType: 'Inventory',
    entityName: 'Network Aggregate',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/dashboard',
  },
  {
    id: 'notif-init-4',
    category: 'change',
    level: 'info',
    title: 'Store Replenishment Calibrated',
    message: 'Store S-03 (Thane West) daily demand velocity updated to 4,800 units/day based on weekend POS run rate.',
    entityType: 'Store',
    entityName: 'Store S-03 (Thane West)',
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/dashboard',
  },
  {
    id: 'notif-init-5',
    category: 'risk',
    level: 'warning',
    title: 'Route Disruption (NH-48)',
    message: 'Freight corridor congestion flagged between Bhiwandi DC and Pune hub (+35 min transit delta).',
    entityType: 'Route',
    entityName: 'Corridor Arc #104',
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: '/network-map',
  },
]

// Pool of dynamic real-time FMCG distribution events
const dynamicEventsPool = [
  {
    category: 'risk',
    level: 'critical',
    title: 'Low Safety Stock Risk',
    templates: [
      'Store {store} milk & dairy stock dropped to {pct}% of safety buffer. Urgent replenishment suggested.',
      'Hypermarket {store} SKU-BEV-901 inventory projected stockout in under {hours} hours.',
    ],
    entityType: 'Store',
  },
  {
    category: 'risk',
    level: 'warning',
    title: 'Cold-Chain Telemetry Warning',
    templates: [
      'Refrigerated Van #{van} registered temperature variance of {temp}°C (optimal 2°C - 4°C).',
      'Chilled dock compartment at DC-{dc} door 04 running at 6.8°C.',
    ],
    entityType: 'Warehouse',
  },
  {
    category: 'good_condition',
    level: 'success',
    title: 'Stockout Averted Successfully',
    templates: [
      'Autonomous dispatch of {units} units cleared shortage risk for Store {store}.',
      'Cross-dock replenishment completed at DC-{dc} — safety buffer restored to 100%.',
      'All 8 perishable grocery batches delivered on-schedule with zero shelf degradation.',
    ],
    entityType: 'Inventory',
  },
  {
    category: 'good_condition',
    level: 'success',
    title: 'Optimal Warehouse Utilization',
    templates: [
      'DC-{dc} pallet utilization stabilized at {pct}% optimal storage equilibrium.',
      'Fleet turn-around time improved by 22% across Regional Distribution Hubs.',
    ],
    entityType: 'Warehouse',
  },
  {
    category: 'engine',
    level: 'info',
    title: 'FEFO Expiry Engine Reroute',
    templates: [
      'FEFO Engine dynamically allocated {units} near-expiry yoghurt cartons to high-velocity Store {store}.',
      'Batch expiry risk neutralized: 320 units re-routed before 48-hour shelf cutoff.',
    ],
    entityType: 'OptimizationEngine',
  },
  {
    category: 'engine',
    level: 'info',
    title: 'Autonomous MILP Solver Execution',
    templates: [
      'Live solver converged in {sec}s: resolved vehicle routing across {count} retail endpoints.',
      'Scenario SC-2026-X evaluated: fuel footprint decreased by {pct}% via adaptive waypoint clustering.',
    ],
    entityType: 'OptimizationEngine',
  },
  {
    category: 'change',
    level: 'info',
    title: 'Network Parameter Updated',
    templates: [
      'Lead-time service level for Store {store} calibrated from 4.0h to {hours}h.',
      'GPS Geofence sync: Live location coordinates verified for {dc} Depot.',
      'Co-manager dispatch privileges synced for regional distribution manager.',
    ],
    entityType: 'Store',
  },
]

const sampleStores = ['S-01 (Mumbai Central)', 'S-02 (Pune Express)', 'S-03 (Thane Hub)', 'S-04 (Navi Mumbai)', 'S-05 (Nashik Retail)']
const sampleDCs = ['Bhiwandi RDC', 'Kurla Central Depot', 'Pune Logistics Hub', 'Nagpur Transit']

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateDynamicNotification() {
  const blueprint = getRandomItem(dynamicEventsPool)
  const template = getRandomItem(blueprint.templates)
  const store = getRandomItem(sampleStores)
  const dc = getRandomItem(sampleDCs)
  const pct = (Math.random() * 8 + 4).toFixed(1)
  const hours = (Math.random() * 3 + 1.5).toFixed(1)
  const units = Math.floor(Math.random() * 1200 + 350)
  const van = Math.floor(Math.random() * 20 + 1)
  const temp = (Math.random() * 3 + 5.5).toFixed(1)
  const sec = (Math.random() * 1.5 + 0.8).toFixed(2)
  const count = Math.floor(Math.random() * 8 + 6)

  const message = template
    .replace('{store}', store)
    .replace('{dc}', dc)
    .replace('{pct}', pct)
    .replace('{hours}', hours)
    .replace('{units}', units)
    .replace('{van}', van)
    .replace('{temp}', temp)
    .replace('{sec}', sec)
    .replace('{count}', count)

  return {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    category: blueprint.category,
    level: blueprint.level,
    title: blueprint.title,
    message,
    entityType: blueprint.entityType,
    entityName: blueprint.entityType === 'Store' ? store : blueprint.entityType === 'Warehouse' ? dc : 'Optimization Engine',
    timestamp: new Date().toISOString(),
    read: false,
    actionUrl: blueprint.category === 'engine' ? '/optimization' : blueprint.category === 'risk' ? '/dashboard' : '/dashboard',
  }
}

let eventLoopInterval = null

function initSocket(server) {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ]

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(null, true) // permissive for local dev
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log(`🔌 [WebSocket] Client connected: ${socket.id}`)

    // 1. Immediately send current notification history and unread count
    const unreadCount = notificationsHistory.filter((n) => !n.read).length
    socket.emit('notifications:init', {
      notifications: notificationsHistory,
      unreadCount,
    })

    // 2. Client requests to mark all (or a specific) notification as read
    socket.on('notifications:mark-read', (data) => {
      const { id } = data || {}
      if (id) {
        const item = notificationsHistory.find((n) => n.id === id)
        if (item) item.read = true
      } else {
        // Mark all as read
        notificationsHistory.forEach((n) => {
          n.read = true
        })
      }
      const newUnreadCount = notificationsHistory.filter((n) => !n.read).length
      io.emit('notifications:unread-count', { unreadCount: newUnreadCount })
    })

    // 3. Client requests full refresh
    socket.on('notifications:request', () => {
      const count = notificationsHistory.filter((n) => !n.read).length
      socket.emit('notifications:init', {
        notifications: notificationsHistory,
        unreadCount: count,
      })
    })

    // 4. Client clears all
    socket.on('notifications:clear-all', () => {
      notificationsHistory.length = 0
      io.emit('notifications:init', {
        notifications: [],
        unreadCount: 0,
      })
    })

    socket.on('disconnect', () => {
      console.log(`🔌 [WebSocket] Client disconnected: ${socket.id}`)
    })
  })

  // Start periodic autonomous FMCG event broadcaster (every 22 seconds)
  if (!eventLoopInterval) {
    eventLoopInterval = setInterval(() => {
      if (io && io.engine && io.engine.clientsCount > 0) {
        const newNotif = generateDynamicNotification()
        notificationsHistory.unshift(newNotif)
        if (notificationsHistory.length > 50) {
          notificationsHistory.pop()
        }
        const unreadCount = notificationsHistory.filter((n) => !n.read).length

        io.emit('notification:new', {
          notification: newNotif,
          unreadCount,
        })
      }
    }, 22000)
  }

  return io
}

// Programmatic broadcaster for any backend controller to notify users
function broadcastNotification(customNotif) {
  const notif = {
    id: customNotif.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    category: customNotif.category || 'change',
    level: customNotif.level || 'info',
    title: customNotif.title || 'System Notification',
    message: customNotif.message || 'Network activity recorded.',
    entityType: customNotif.entityType || 'General',
    entityName: customNotif.entityName || 'SupplyShield AI',
    timestamp: new Date().toISOString(),
    read: false,
    actionUrl: customNotif.actionUrl || '/dashboard',
    ...customNotif,
  }

  notificationsHistory.unshift(notif)
  if (notificationsHistory.length > 50) {
    notificationsHistory.pop()
  }

  if (io) {
    const unreadCount = notificationsHistory.filter((n) => !n.read).length
    io.emit('notification:new', {
      notification: notif,
      unreadCount,
    })
  }
  return notif
}

function getNotifications() {
  return [...notificationsHistory]
}

module.exports = {
  initSocket,
  broadcastNotification,
  getNotifications,
}
