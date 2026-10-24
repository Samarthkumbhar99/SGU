import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Info,
  Clock,
  CheckCheck,
  Trash2,
  ArrowRight,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useNotificationStore } from '../../store/index.js'

function getRelativeTime(isoString) {
  if (!isoString) return 'just now'
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diffSec < 45) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

function getCategoryConfig(category, level) {
  switch (category) {
    case 'risk':
      return {
        icon: AlertTriangle,
        badgeLabel: 'Risk Alert',
        badgeBg: '#fef2f2',
        badgeText: '#b91c1c',
        badgeBorder: '#fecaca',
        accentBg: '#ef4444',
      }
    case 'good_condition':
      return {
        icon: CheckCircle2,
        badgeLabel: 'Optimal Condition',
        badgeBg: '#ecfdf5',
        badgeText: '#047857',
        badgeBorder: '#a7f3d0',
        accentBg: '#10b981',
      }
    case 'engine':
      return {
        icon: Cpu,
        badgeLabel: 'Engine Activity',
        badgeBg: '#f5f3ff',
        badgeText: '#6d28d9',
        badgeBorder: '#ddd6fe',
        accentBg: '#8b5cf6',
      }
    case 'change':
    default:
      return {
        icon: level === 'critical' ? AlertTriangle : level === 'success' ? CheckCircle2 : RefreshCw,
        badgeLabel: 'Change',
        badgeBg: '#f0f9ff',
        badgeText: '#0369a1',
        badgeBorder: '#bae6fd',
        accentBg: '#0284c7',
      }
  }
}

export default function NotificationDrawer() {
  const {
    notifications,
    isDrawerOpen,
    closeDrawer,
    isConnected,
    activeFilter,
    setActiveFilter,
    markAllAsRead,
    clearAll,
  } = useNotificationStore()

  const navigate = useNavigate()

  // Handle ESC key to close
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

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'risk') return n.category === 'risk'
    if (activeFilter === 'engine') return n.category === 'engine'
    if (activeFilter === 'good') return n.category === 'good_condition'
    if (activeFilter === 'change') return n.category === 'change'
    return true
  })

  const riskCount = notifications.filter((n) => n.category === 'risk').length
  const engineCount = notifications.filter((n) => n.category === 'engine').length
  const goodCount = notifications.filter((n) => n.category === 'good_condition').length
  const changeCount = notifications.filter((n) => n.category === 'change').length

  const handleCardClick = (actionUrl) => {
    closeDrawer()
    if (actionUrl) {
      navigate(actionUrl)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col pointer-events-auto transform transition-all duration-300 ease-out border-l border-slate-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
                  <Bell size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    Live Notifications
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    {isConnected ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-700 font-semibold">Live WebSocket</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-amber-700">Connecting…</span>
                      </>
                    )}
                    <span>• {notifications.length} events logged</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeDrawer}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
                title="Close drawer"
                aria-label="Close notifications"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions (Mark read, Clear) */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span className="text-xs font-semibold text-slate-600">Filters</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 size={13} />
                  Clear
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All', count: notifications.length },
                { id: 'risk', label: 'Risks', count: riskCount, color: 'text-red-600' },
                { id: 'engine', label: 'Engine', count: engineCount, color: 'text-purple-600' },
                { id: 'good', label: 'Good', count: goodCount, color: 'text-emerald-600' },
                { id: 'change', label: 'Changes', count: changeCount, color: 'text-sky-600' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1 rounded-full ${
                      activeFilter === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notification List Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
            {filteredNotifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Bell size={20} />
                </div>
                <div className="text-sm font-bold text-slate-700 mb-1">No notifications found</div>
                <div className="text-xs text-slate-500 max-w-xs">
                  {activeFilter === 'all'
                    ? 'Autonomous distribution events will appear here in real-time as the engine detects changes or risks.'
                    : `No events currently categorized under "${activeFilter}".`}
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const config = getCategoryConfig(notif.category, notif.level)
                const Icon = config.icon

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleCardClick(notif.actionUrl)}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-sky-300 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                  >
                    {/* Left Accent Color Stripe */}
                    <div
                      className="absolute top-0 left-0 bottom-0 w-1"
                      style={{ background: config.accentBg }}
                    />

                    <div className="pl-1">
                      {/* Top Meta row */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            background: config.badgeBg,
                            color: config.badgeText,
                            border: `1px solid ${config.badgeBorder}`,
                          }}
                        >
                          <Icon size={11} />
                          {config.badgeLabel}
                        </span>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock size={11} />
                          <span>{getRelativeTime(notif.timestamp)}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors mb-1">
                        {notif.title}
                      </h4>

                      {/* Message Body */}
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">
                        {notif.message}
                      </p>

                      {/* Footer entity tag + action prompt */}
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
                        {notif.entityName && (
                          <span className="font-mono text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {notif.entityName}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-sky-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 ml-auto">
                          View details <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-[11px] text-slate-500">
            <span>Realtime WebSocket FMCG Engine</span>
            <span className="font-mono text-emerald-600 font-semibold">Active Monitoring</span>
          </div>
        </div>
      </div>
    </div>
  )
}
