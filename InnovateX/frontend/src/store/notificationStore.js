import { create } from 'zustand'
import { io } from 'socket.io-client'
import axios from 'axios'

let socket = null

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isDrawerOpen: false,
  filter: 'all', // 'all' | 'risk' | 'good' | 'engine' | 'change'
  isConnected: false,

  setFilter: (filter) => set({ filter }),

  // Open drawer: sets isDrawerOpen = true AND resets unread count to 0
  openDrawer: () => {
    set({ isDrawerOpen: true, unreadCount: 0 })
    // Mark all notifications as read in state
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }))

    // Sync with backend via socket or REST
    if (socket && socket.connected) {
      socket.emit('notifications:mark-read')
    } else {
      axios.post('/api/v1/notifications/mark-read').catch(() => {})
    }
  },

  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => {
    const { isDrawerOpen, openDrawer, closeDrawer } = get()
    if (isDrawerOpen) {
      closeDrawer()
    } else {
      openDrawer()
    }
  },

  // Mark all as read explicitly
  markAllAsRead: () => {
    set((state) => ({
      unreadCount: 0,
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }))
    if (socket && socket.connected) {
      socket.emit('notifications:mark-read')
    } else {
      axios.post('/api/v1/notifications/mark-read').catch(() => {})
    }
  },

  // Clear all notifications
  clearAll: () => {
    set({ notifications: [], unreadCount: 0 })
    axios.delete('/api/v1/notifications').catch(() => {})
  },

  // Initialize Socket.io connection & fallback REST fetch
  initSocket: () => {
    if (socket) return

    // Connect to WebSocket (relative path uses Vite /socket.io proxy to backend)
    socket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      set({ isConnected: true })
    })

    socket.on('disconnect', () => {
      set({ isConnected: false })
    })

    // Initial notifications batch from backend
    socket.on('notifications:init', (list) => {
      if (Array.isArray(list)) {
        const unread = list.filter((n) => !n.read).length
        set({
          notifications: list,
          unreadCount: get().isDrawerOpen ? 0 : unread,
        })
      }
    })

    // Realtime incoming notification
    socket.on('notification:new', (notif) => {
      set((state) => {
        const isDrawerOpen = state.isDrawerOpen
        return {
          notifications: [notif, ...state.notifications],
          unreadCount: isDrawerOpen ? 0 : state.unreadCount + 1,
        }
      })
    })

    // Updated notification list
    socket.on('notifications:updated', (list) => {
      if (Array.isArray(list)) {
        set({
          notifications: list,
          unreadCount: get().isDrawerOpen ? 0 : list.filter((n) => !n.read).length,
        })
      }
    })

    // Fallback REST fetch if socket connect is pending
    axios
      .get('/api/v1/notifications')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const list = res.data.data
          const unread = list.filter((n) => !n.read).length
          set((state) => ({
            notifications: state.notifications.length > 0 ? state.notifications : list,
            unreadCount: state.isDrawerOpen ? 0 : unread,
          }))
        }
      })
      .catch(() => {})
  },
}))
