import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  X,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  ExternalLink,
  Trash2,
  CheckCheck,
  Radio,
} from 'lucide-react'
import { useNotificationStore } from '../../store/notificationStore.js'

export default function NotificationDrawer() {
  const {
    notifications,
    isDrawerOpen,
    closeDrawer,
    markAllAsRead,
    clearAll,
    filter,
    setFilter,
    isConnected,
    initSocket,
  } = useNotificationStore()

  useEffect(() => {
    initSocket()
  }, [initSocket])

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen, closeDrawer])

  if (!isDrawerOpen) return null

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true
    return n.type === filter
  })

  // Format relative timestamp
  const formatTime = (ts) => {
    if (!ts) return 'Just now'
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const getTypeStyles = (type) => {
    switch (type) {
      case 'risk':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-700" />,
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
          borderLeft: 'border-l-4 border-l-rose-500',
          bg: 'hover:bg-rose-50/40',
        }
      case 'good':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" />,
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          borderLeft: 'border-l-4 border-l-emerald-500',
          bg: 'hover:bg-emerald-50/40',
        }
      case 'engine':
        return {
          icon: <Cpu className="w-4 h-4 text-sky-700" />,
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
          borderLeft: 'border-l-4 border-l-sky-500',
          bg: 'hover:bg-sky-50/40',
        }
      case 'change':
      default:
        return {
          icon: <RefreshCw className="w-4 h-4 text-amber-700" />,
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          borderLeft: 'border-l-4 border-l-amber-500',
          bg: 'hover:bg-amber-50/40',
        }
    }
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Side Drawer from Right */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shadow-xs">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Notifications</h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    <Radio className={`w-2.5 h-2.5 ${isConnected ? 'animate-pulse text-emerald-600' : ''}`} />
                    {isConnected ? 'Realtime' : 'Connecting'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Live risk, engine & network telemetry</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={closeDrawer}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-rose-700 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>

          {/* Filter Pills */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'risk', label: 'Risks', count: notifications.filter((n) => n.type === 'risk').length },
              { id: 'good', label: 'Good Conditions', count: notifications.filter((n) => n.type === 'good').length },
              { id: 'engine', label: 'Engine Activity', count: notifications.filter((n) => n.type === 'engine').length },
              { id: 'change', label: 'Changes', count: notifications.filter((n) => n.type === 'change').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/80'
                }`}
              >
                {tab.label}
                <span className="ml-1 opacity-75 font-mono text-[10px]">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Notifications Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">No notifications</h3>
                <p className="text-xs text-slate-500 max-w-[240px]">
                  {filter === 'all'
                    ? 'All clear! Live engine alerts and condition changes will appear here in real time.'
                    : `No notifications found under the '${filter}' filter.`}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const style = getTypeStyles(notif.type)
                return (
                  <div
                    key={notif.id}
                    className={`p-4 transition-colors ${style.borderLeft} ${style.bg} ${
                      notif.read ? 'bg-white opacity-80' : 'bg-sky-50/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-white shadow-xs border border-slate-100">
                          {style.icon}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.badgeClass}`}>
                          {notif.category || notif.type}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                        {formatTime(notif.timestamp)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                      {notif.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
                      {notif.message}
                    </p>

                    {/* Metadata chips & action link */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1.5">
                        {notif.facilityId && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                            {notif.facilityId}
                          </span>
                        )}
                        {notif.skuId && (
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-[10px] font-bold">
                            {notif.skuId}
                          </span>
                        )}
                      </div>

                      {notif.link && (
                        <Link
                          to={notif.link}
                          onClick={closeDrawer}
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800 transition-colors"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
            <span>WebSocket push enabled</span>
            <span className="font-mono text-[11px] text-slate-600">
              {notifications.length} events logged
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
