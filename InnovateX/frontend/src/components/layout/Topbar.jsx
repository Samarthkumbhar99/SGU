import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, Bell, Search, ChevronDown, CheckCircle2, AlertTriangle, Cpu, RefreshCw, FileText, Sparkles } from 'lucide-react'
import { useUIStore, useAuthStore } from '../../store/index.js'
import { useNotificationStore } from '../../store/notificationStore.js'
import NotificationDrawer from './NotificationDrawer.jsx'

export function Topbar({ pageTitle, breadcrumbs = [] }) {
  const { toggleSidebar, setSidebarMobileOpen } = useUIStore()
  const { user } = useAuthStore()
  const { unreadCount, openDrawer, notifications, initSocket } = useNotificationStore()
  const navigate = useNavigate()
  const location = useLocation()

  const getSectionFromPath = (pathname) => {
    if (pathname.includes('/inventory')) return 'inventory'
    if (pathname.includes('/forecasting')) return 'forecasting'
    if (pathname.includes('/optimization')) return 'optimization'
    if (pathname.includes('/rescue')) return 'rescue'
    if (pathname.includes('/scenarios')) return 'scenarios'
    return 'dashboard'
  }

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)

  // Initialize WebSocket telemetry connection
  useEffect(() => {
    initSocket()
  }, [initSocket])

  // Global keyboard shortcut: Ctrl+K / Cmd+K navigates to /search page
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        navigate('/search')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  const handleOpenDrawerFromDropdown = () => {
    setNotifDropdownOpen(false)
    openDrawer() // Automatically clears unreadCount to 0 and slides open the right-side drawer
  }

  const getDropdownIcon = (type) => {
    switch (type) {
      case 'risk':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
      case 'good':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      case 'engine':
        return <Cpu className="w-3.5 h-3.5 text-sky-600 shrink-0" />
      case 'change':
      default:
        return <RefreshCw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
    }
  }

  return (
    <>
      <header className="ss-topbar" role="banner">
        {/* Mobile hamburger menu toggle */}
        <button
          id="mobile-menu-btn"
          className="ss-btn-ghost"
          style={{ padding: '7px', display: 'none', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSidebarMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop collapse toggle */}
        <button
          id="desktop-toggle-btn"
          className="ss-btn-ghost"
          style={{ padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Page title & breadcrumbs */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
          {breadcrumbs.length > 0 && (
            <div
              className="ss-topbar-breadcrumbs"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#64778b',
                marginBottom: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {breadcrumbs.map((crumb, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {i > 0 && <span style={{ opacity: 0.4 }}>/</span>}
                  <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {crumb}
                  </span>
                </span>
              ))}
            </div>
          )}
          <h1
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 700,
              color: '#0f172a',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.25,
            }}
          >
            {pageTitle}
          </h1>
        </div>

        {/* Right side actions - compact icons on mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Global AI PDF Report Export Button */}
          <button
            id="global-export-report-btn"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 hover:text-sky-800 border border-sky-200 transition-all hover:scale-105 cursor-pointer shadow-2xs active:scale-95"
            onClick={() => {
              const sec = getSectionFromPath(location.pathname)
              navigate(`/report?section=${sec}`)
            }}
            title="Export AI Audit Report (PDF) with Groq LLM"
          >
            <FileText size={14} className="text-sky-600" />
            <span>Export PDF</span>
            <Sparkles size={11} className="text-amber-500" />
          </button>

          {/* Global Search Button -> Navigates to dedicated /search page */}
          <button
            id="global-search-btn"
            className="ss-btn-ghost"
            style={{
              padding: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/search')}
            aria-label="Search"
            title="Search pages, SKUs, warehouses... (Ctrl+K)"
          >
            <Search size={18} />
          </button>

          {/* Notifications Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              id="notifications-btn"
              className="ss-btn-ghost"
              style={{
                padding: '7px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              aria-label="Notifications"
              aria-expanded={notifDropdownOpen}
              title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            >
              <Bell size={18} />

              {/* Unread count badge on notification icon */}
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    minWidth: '17px',
                    height: '17px',
                    padding: '0 4px',
                    borderRadius: '10px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                  aria-hidden="true"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Preview Dropdown */}
            {notifDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: 'min(340px, calc(100vw - 20px))',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(15, 23, 42, 0.15)',
                  overflow: 'hidden',
                  zIndex: 100,
                  animation: 'fade-in-scale 0.2s ease',
                }}
                role="dialog"
                aria-label="Notifications preview"
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                    Live Notifications
                  </span>
                  {unreadCount > 0 ? (
                    <span className="ss-badge ss-badge-critical font-bold text-[10px]">
                      {unreadCount} unread
                    </span>
                  ) : (
                    <span className="ss-badge ss-badge-success text-[10px]">All caught up</span>
                  )}
                </div>

                {/* Latest 3 Preview Notifications */}
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.slice(0, 3).map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: n.read ? 'transparent' : '#f0f9ff',
                      }}
                      onClick={handleOpenDrawerFromDropdown}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ marginTop: '2px' }}>{getDropdownIcon(n.type)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '12px',
                              color: '#0f172a',
                              marginBottom: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {n.title}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#64748b',
                              lineHeight: 1.35,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {n.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer with 'View all notifications' button -> Opens Side Drawer & Resets Count */}
                <div
                  style={{
                    padding: '10px 16px',
                    textAlign: 'center',
                    borderTop: '1px solid #f1f5f9',
                    background: '#f8fafc',
                  }}
                >
                  <button
                    className="ss-btn-ghost"
                    style={{
                      fontSize: '12px',
                      color: '#0284c7',
                      fontWeight: 700,
                      cursor: 'pointer',
                      width: '100%',
                      padding: '4px',
                    }}
                    onClick={handleOpenDrawerFromDropdown}
                  >
                    View all notifications →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Trigger Button -> Navigates to dedicated /profile page */}
          <div
            id="user-profile-btn"
            className="ss-topbar-user-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 8px',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              border: '1px solid #e2e8f0',
            }}
            onClick={() => navigate('/profile')}
            title={user?.name || user?.email || 'User profile'}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
                flexShrink: 0,
                boxShadow: '0 2px 5px rgba(2, 132, 199, 0.25)',
              }}
            >
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <span
              className="ss-topbar-user-name"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#0f172a',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name || 'User'}
            </span>
            <ChevronDown size={14} color="#64778b" className="ss-topbar-user-chevron" />
          </div>
        </div>

        <style>{`
          @media (max-width: 1024px) {
            #mobile-menu-btn { display: flex !important; }
            #desktop-toggle-btn { display: none !important; }
          }
        `}</style>
      </header>

      {/* Realtime Right-Side Notification Drawer */}
      <NotificationDrawer />
    </>
  )
}

export default Topbar
