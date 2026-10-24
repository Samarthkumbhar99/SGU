import { Menu, Bell, Search, ChevronDown } from 'lucide-react'
import { useUIStore, useAuthStore, useNotificationStore } from '../../store/index.js'
import { useState, useEffect } from 'react'

export function Topbar({ pageTitle, breadcrumbs = [] }) {
  const { toggleSidebar, setSidebarMobileOpen, setSearchModalOpen, setProfileModalOpen } = useUIStore()
  const { user } = useAuthStore()
  const { unreadCount, openDrawer, initSocket } = useNotificationStore()

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
            onClick={openDrawer}
            aria-label="View all notifications"
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
