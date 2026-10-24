import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),

      login: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      }),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
      }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'supplychield-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  toasts: [],

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),

  addToast: (toast) => {
    const id = Date.now()
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, toast.duration || 4000)
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (message, title) => useUIStore.getState().addToast({ type: 'success', message, title }),
  error: (message, title) => useUIStore.getState().addToast({ type: 'error', message, title }),
  warning: (message, title) => useUIStore.getState().addToast({ type: 'warning', message, title }),
  info: (message, title) => useUIStore.getState().addToast({ type: 'info', message, title }),
}
