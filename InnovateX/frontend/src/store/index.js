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
      updateUser: (partial) => set((s) => ({ user: { ...s.user, ...partial } })),

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

export const useEntityStore = create((set, get) => ({
  stores: [],
  warehouses: [],
  incomingRequests: [],
  outgoingRequests: [],
  liveLocation: null,
  isLoading: false,

  setNetworkData: (data) => set({
    stores: data.stores || [],
    warehouses: data.warehouses || [],
    incomingRequests: data.incomingRequests || [],
    outgoingRequests: data.outgoingRequests || [],
  }),

  setLiveLocation: (loc) => set({ liveLocation: loc }),
  setLoading: (isLoading) => set({ isLoading }),

  addStore: (store) => set((s) => ({ stores: [store, ...s.stores] })),
  updateStoreInList: (updated) => set((s) => ({
    stores: s.stores.map((st) => (st._id === updated._id ? updated : st)),
  })),

  addWarehouse: (wh) => set((s) => ({ warehouses: [wh, ...s.warehouses] })),
  updateWarehouseInList: (updated) => set((s) => ({
    warehouses: s.warehouses.map((w) => (w._id === updated._id ? updated : w)),
  })),

  removeIncomingRequest: (id) => set((s) => ({
    incomingRequests: s.incomingRequests.filter((r) => r._id !== id),
  })),
}))

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
