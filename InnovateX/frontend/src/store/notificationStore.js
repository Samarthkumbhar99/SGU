import { create } from 'zustand'
import { io } from 'socket.io-client'

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
  : 'http://localhost:5000'

let socketInstance = null

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isDrawerOpen: false,
  isConnected: false,
  activeFilter: 'all', // 'all' | 'risk' | 'engine' | 'good_condition' | 'change'

  // Initialize WebSocket connection
  initSocket: () => {
    if (socketInstance) return socketInstance

    try {
      socketInstance = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        withCredentials: true,
      })

      socketInstance.on('connect', () => {
        console.log('⚡ [WebSocket] Connected to notification hub:', socketInstance.id)
        set({ isConnected: true })
      })

      socketInstance.on('disconnect', () => {
        console.log('⚡ [WebSocket] Disconnected from notification hub')
        set({ isConnected: false })
      })

      // Initial batch of notifications from server
      socketInstance.on('notifications:init', (data) => {
        const { notifications = [], unreadCount = 0 } = data || {}
        set({
          notifications,
          // Only show unread count if drawer is not currently open
          unreadCount: get().isDrawerOpen ? 0 : unreadCount,
        })
      })

      // New real-time notification arrived
      socketInstance.on('notification:new', (data) => {
        const { notification, unreadCount } = data || {}
        if (!notification) return

        set((state) => {
          // If drawer is currently open, count stays 0 and newly arrived notification is auto-marked
          const isDrawerOpen = state.isDrawerOpen
          const updatedUnread = isDrawerOpen ? 0 : (typeof unreadCount === 'number' ? unreadCount : state.unreadCount + 1)
          
          // Avoid duplicates
          const filtered = state.notifications.filter((n) => n.id !== notification.id)
          return {
            notifications: [{ ...notification, read: isDrawerOpen }, ...filtered],
            unreadCount: updatedUnread,
          }
        })
      })

      // Unread count update
      socketInstance.on('notifications:unread-count', ({ unreadCount }) => {
        if (!get().isDrawerOpen) {
          set({ unreadCount })
        }
      })
    } catch (err) {
      console.warn('⚡ [WebSocket] Could not connect to socket server:', err)
    }

    return socketInstance
  },

  // Open drawer: opens right side drawer and immediately resets unread count to 0
  openDrawer: () => {
    set({ isDrawerOpen: true, unreadCount: 0 })
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('notifications:mark-read', {})
    }
    // Also mark local items as read
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }))
  },

  closeDrawer: () => set({ isDrawerOpen: false }),

  toggleDrawer: () => {
    const nextState = !get().isDrawerOpen
    if (nextState) {
      get().openDrawer()
    } else {
      get().closeDrawer()
    }
  },

  setActiveFilter: (filter) => set({ activeFilter: filter }),

  markAllAsRead: () => {
    set((state) => ({
      unreadCount: 0,
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }))
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('notifications:mark-read', {})
    }
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 })
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('notifications:clear-all')
    }
  },
}))
