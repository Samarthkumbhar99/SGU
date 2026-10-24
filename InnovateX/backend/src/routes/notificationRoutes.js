const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { getNotifications, broadcastNotification } = require('../socket')

router.use(protect)

// GET /api/v1/notifications
router.get('/', (req, res) => {
  const notifs = getNotifications()
  const unreadCount = notifs.filter((n) => !n.read).length
  res.json({
    success: true,
    notifications: notifs,
    unreadCount,
  })
})

// POST /api/v1/notifications/simulate (for testing or user-triggered engine event)
router.post('/simulate', (req, res) => {
  const { category, title, message, level } = req.body || {}
  const notif = broadcastNotification({
    category: category || 'engine',
    level: level || 'info',
    title: title || 'Manual Simulation Trigger',
    message: message || 'Optimization engine test pulse initiated by user.',
  })
  res.json({ success: true, notification: notif })
})

module.exports = router
