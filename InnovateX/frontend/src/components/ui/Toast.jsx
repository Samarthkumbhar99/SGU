import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useUIStore } from '../../store/index.js'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: '#208567',
  error: '#d94b50',
  warning: '#d99a27',
  info: '#247bc1',
}

function Toast({ toast }) {
  const removeToast = useUIStore((s) => s.removeToast)
  const Icon = ICONS[toast.type] || Info
  const color = COLORS[toast.type] || COLORS.info

  return (
    <div className={`ss-toast ss-toast-${toast.type}`} role="alert">
      <Icon size={18} color={color} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
            {toast.title}
          </div>
        )}
        <div style={{ fontSize: '13px', opacity: 0.85 }}>{toast.message}</div>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="ss-toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

// Standalone toast helper callable anywhere
export const toast = {
  success: (message, title) => useUIStore.getState().addToast({ type: 'success', message, title }),
  error: (message, title) => useUIStore.getState().addToast({ type: 'error', message, title }),
  warning: (message, title) => useUIStore.getState().addToast({ type: 'warning', message, title }),
  info: (message, title) => useUIStore.getState().addToast({ type: 'info', message, title }),
}

// Helper hook
export function useToast() {
  const addToast = useUIStore((s) => s.addToast)

  return {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  }
}
