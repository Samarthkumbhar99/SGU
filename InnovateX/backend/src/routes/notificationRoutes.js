import { Router } from 'express'
import {
  getNotifications,
  broadcastNotification,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from '../services/socketService.js'

const router = Router()

// GET /api/v1/notifications
router.get('/', (req, res) => {
  const list = getNotifications()
  res.json({
    success: true,
    data: list,
    unreadCount: list.filter((n) => !n.read).length,
  })
})

// POST /api/v1/notifications/mark-read
router.post('/mark-read', (req, res) => {
  const updated = markAllNotificationsAsRead()
  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: updated,
    unreadCount: 0,
  })
})

// POST /api/v1/notifications/broadcast
router.post('/broadcast', (req, res) => {
  const { title, message, type, category, link, facilityId, skuId } = req.body || {}
  if (!title) {
    return res.status(400).json({ success: false, message: 'Notification title is required.' })
  }

  const notif = broadcastNotification({
    title,
    message,
    type: type || 'engine',
    category: category || 'Operations',
    link: link || '/inventory',
    facilityId,
    skuId,
  })

  res.status(201).json({
    success: true,
    message: 'Notification broadcasted successfully via WebSocket',
    data: notif,
  })
})

// DELETE /api/v1/notifications
router.delete('/', (req, res) => {
  clearAllNotifications()
  res.json({
    success: true,
    message: 'All notifications cleared',
  })
})

export default router
