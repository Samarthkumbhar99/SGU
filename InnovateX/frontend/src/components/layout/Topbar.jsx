import { Menu, Bell, Search, ChevronDown } from 'lucide-react'
import { useUIStore, useAuthStore, useNotificationStore } from '../../store/index.js'
import { useState, useEffect } from 'react'

export function Topbar({ pageTitle, breadcrumbs = [] }) {
  const { toggleSidebar, setSidebarMobileOpen, setSearchModalOpen, setProfileModalOpen } = useUIStore()
  const { user } = useAuthStore()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const { notifications, unreadCount, openDrawer, initSocket } = useNotificationStore()

  useEffect(() => {
    initSocket()
  }, [initSocket])

  return (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Global Search */}
        <button
          id="global-search-btn"
          className="ss-btn-ghost"
          style={{
            padding: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            position: 'relative',
          }}
          onClick={() => setSearchModalOpen(true)}
          aria-label="Search pages and components (Ctrl+K)"
          title="Search (Ctrl+K)"
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
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
            }}
            onClick={() => setPopoverOpen(!popoverOpen)}
            aria-label="Notifications"
            aria-expanded={popoverOpen}
            title="Real-time Notifications"
          >
            <Bell size={18} />
            {/* Unread badge count: Removed to 0 when opening drawer */}
            {unreadCount > 0 && (
              <span
                id="unread-notif-badge"
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  minWidth: '17px',
                  height: '17px',
                  padding: '0 4px',
                  borderRadius: '9999px',
                  background: '#ef4444',
                  border: '2px solid white',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  boxShadow: '0 1px 4px rgba(239, 68, 68, 0.45)',
                  animation: 'pulse 2s infinite',
                }}
                aria-label={`${unreadCount} unread notifications`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Quick Notification Dropdown Popover */}
          {popoverOpen && (
            <div
              id="notifications-popover"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: 'min(330px, calc(100vw - 20px))',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                boxShadow: '0 10px 40px rgba(15, 23, 42, 0.16)',
                overflow: 'hidden',
                zIndex: 1000,
                animation: 'fade-in-scale 0.2s ease',
              }}
              role="dialog"
              aria-label="Recent notifications"
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                    Notifications
                  </span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                </div>
                {unreadCount > 0 ? (
                  <span className="ss-badge ss-badge-critical" style={{ fontSize: '10px', padding: '2px 6px' }}>
                    {unreadCount} unread
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Up to date</span>
                )}
              </div>

              {/* Top 3 Recent Notifications */}
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {(notifications && notifications.length > 0
                  ? notifications.slice(0, 3)
                  : [
                      {
                        title: 'Stock Alert',
                        message: 'Store S-04 (Mumbai South) is at 8% stock level for SKU-MILK-001',
                        timestamp: new Date().toISOString(),
                        category: 'risk',
                      },
                      {
                        title: 'MILP Solver Converged',
                        message: 'Disruption SC-802 re-sequencing completed in 1.4s',
                        timestamp: new Date(Date.now() - 600000).toISOString(),
                        category: 'engine',
                      },
                    ]
                ).map((n, i) => (
                  <div
                    key={n.id || i}
                    onClick={() => {
                      setPopoverOpen(false)
                      openDrawer()
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#0f172a', marginBottom: '2px' }}>
                      {n.title}
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: '#64748b',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {n.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* View all notifications CTA — Opens right side drawer & clears count */}
              <div
                style={{
                  padding: '10px 16px',
                  textAlign: 'center',
                  background: '#ffffff',
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <button
                  id="view-all-notifications-btn"
                  className="ss-btn-ghost"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    color: '#0284c7',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e0f2fe'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f0f9ff'
                  }}
                  onClick={() => {
                    setPopoverOpen(false)
                    openDrawer()
                  }}
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile — Clickable to open detailed profile modal */}
        <div
          id="topbar-user-profile-btn"
          className="ss-topbar-user-btn"
          onClick={() => setProfileModalOpen(true)}
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
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Click to view detailed user profile & assets"
          role="button"
          tabIndex={0}
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
  )
}
export default Topbar
