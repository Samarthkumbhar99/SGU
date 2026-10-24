import { Menu, Bell, Search, ChevronDown } from 'lucide-react'
import { useUIStore, useAuthStore } from '../../store/index.js'
import { useState } from 'react'

export function Topbar({ pageTitle, breadcrumbs = [] }) {
  const { toggleSidebar, setSidebarMobileOpen } = useUIStore()
  const { user } = useAuthStore()
  const [notifOpen, setNotifOpen] = useState(false)

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
          style={{ padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
          aria-label="Search"
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
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell size={18} />
            {/* Unread badge dot */}
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ef4444',
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
                width: 'min(320px, calc(100vw - 20px))',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(15, 23, 42, 0.12)',
                overflow: 'hidden',
                zIndex: 100,
                animation: 'fade-in-scale 0.2s ease',
              }}
              role="dialog"
              aria-label="Notifications"
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
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
                    padding: '12px 18px',
                    borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
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
                          color: '#0f172a',
                          marginBottom: '3px',
                        }}
                      >
                        {n.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
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
                  padding: '10px 18px',
                  textAlign: 'center',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <button
                  className="ss-btn-ghost"
                  style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}
                  onClick={() => setNotifOpen(false)}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile — On Mobile displays ONLY avatar icon without text */}
        <div
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
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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
  )
}
export default Topbar
