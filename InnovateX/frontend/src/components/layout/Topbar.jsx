import { Menu, Bell, Search, ChevronDown } from 'lucide-react'
import { useUIStore, useAuthStore } from '../../store/index.js'
import { useState } from 'react'

export function Topbar({ pageTitle, breadcrumbs = [] }) {
  const { toggleSidebar, setSidebarMobileOpen } = useUIStore()
  const { user } = useAuthStore()
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="ss-topbar" role="banner">
      {/* Mobile hamburger */}
      <button
        id="mobile-menu-btn"
        className="ss-btn-ghost"
        style={{ padding: '8px', display: 'none' }}
        onClick={() => setSidebarMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop collapse toggle */}
      <button
        id="desktop-toggle-btn"
        className="ss-btn-ghost"
        style={{ padding: '8px' }}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Page title & breadcrumbs */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {breadcrumbs.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#64778b',
              marginBottom: '1px',
            }}
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {i > 0 && <span style={{ opacity: 0.5 }}>/</span>}
                <span>{crumb}</span>
              </span>
            ))}
          </div>
        )}
        <h1
          style={{
            margin: 0,
            fontSize: '17px',
            fontWeight: 700,
            color: '#17324d',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Right side actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Search */}
        <button
          id="global-search-btn"
          className="ss-btn-ghost"
          style={{ padding: '8px' }}
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            id="notifications-btn"
            className="ss-btn-ghost"
            style={{ padding: '8px', position: 'relative' }}
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell size={18} />
            {/* Badge */}
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#d94b50',
                border: '2px solid white',
              }}
              aria-hidden="true"
            />
          </button>

          {notifOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '320px',
                background: '#fff',
                border: '1px solid #d7e6f5',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(16,47,80,0.15)',
                overflow: 'hidden',
                zIndex: 100,
                animation: 'fade-in-scale 0.2s ease',
              }}
              role="dialog"
              aria-label="Notifications"
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #d7e6f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#17324d' }}>
                  Notifications
                </span>
                <span className="ss-badge ss-badge-critical">3 new</span>
              </div>

              {[
                {
                  title: 'Stock Alert',
                  body: 'Store S-04 (Mumbai South) is at 8% stock level for SKU-MILK-001',
                  time: '5m ago',
                  type: 'critical',
                },
                {
                  title: 'Route Disruption',
                  body: 'Highway NH-48 partially blocked affecting 3 routes',
                  time: '22m ago',
                  type: 'warning',
                },
                {
                  title: 'Optimization Complete',
                  body: 'Scenario SC-2024-07 resolved. Plan ready for review.',
                  time: '1h ago',
                  type: 'success',
                },
              ].map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: '14px 20px',
                    borderBottom: i < 2 ? '1px solid #eef6ff' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fbff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '13px',
                          color: '#17324d',
                          marginBottom: '3px',
                        }}
                      >
                        {n.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64778b', lineHeight: 1.4 }}>
                        {n.body}
                      </div>
                    </div>
                    <span
                      className={`ss-badge ss-badge-${n.type}`}
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    >
                      {n.time}
                    </span>
                  </div>
                </div>
              ))}

              <div
                style={{
                  padding: '12px 20px',
                  textAlign: 'center',
                  borderTop: '1px solid #eef6ff',
                }}
              >
                <button
                  className="ss-btn-ghost"
                  style={{ fontSize: '13px', color: '#247bc1' }}
                  onClick={() => setNotifOpen(false)}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background 0.15s',
            border: '1px solid #d7e6f5',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#eef6ff')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #102f50, #247bc1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <span
            style={{ fontSize: '13px', fontWeight: 600, color: '#17324d', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {user?.name || 'User'}
          </span>
          <ChevronDown size={14} color="#64778b" />
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
