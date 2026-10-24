import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  Package,
  TrendingUp,
  Shield,
  BarChart3,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react'
import { useUIStore, useAuthStore } from '../../store/index.js'
import { useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/network-map', icon: Map, label: 'Network Map' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/forecasting', icon: TrendingUp, label: 'Forecasting' },
  { to: '/rescue', icon: Shield, label: 'Inventory Rescue' },
  { to: '/optimization', icon: BarChart3, label: 'Optimization' },
  { to: '/scenarios', icon: History, label: 'Scenario History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, setSidebarMobileOpen } = useUIStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="ss-sidebar-overlay"
          onClick={() => setSidebarMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav
        className={`ss-sidebar ${sidebarCollapsed ? 'ss-sidebar-collapsed' : ''}`}
        style={{
          transform: sidebarMobileOpen ? 'translateX(0)' : undefined,
        }}
        aria-label="Main navigation"
        data-mobile-open={sidebarMobileOpen}
      >
        {/* Logo */}
        <div
          style={{
            padding: '20px 16px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {/* SupplyShield Logo from public folder */}
            <img
              src="/logo.webp"
              alt="SupplyShield AI Logo"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />

            {!sidebarCollapsed && (
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '15px',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  SupplyShield
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  AI Platform
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav Items */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px 0',
          }}
        >
          {!sidebarCollapsed && (
            <div
              style={{
                padding: '10px 16px 6px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Navigation
            </div>
          )}

          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarMobileOpen(false)}
              className={({ isActive }) =>
                `ss-nav-item ${isActive ? 'ss-nav-item-active' : ''}`
              }
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="ss-nav-icon" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </div>

        {/* User section */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '12px 8px',
          }}
        >
          {!sidebarCollapsed && user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '4px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #247bc1, #6ab0e1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name || 'User'}
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: '11px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.role || 'Distribution Manager'}
                </div>
              </div>
            </div>
          )}

          <button
            id="logout-btn"
            onClick={handleLogout}
            className="ss-nav-item"
            style={{ width: 'calc(100% - 16px)', color: 'rgba(255,255,255,0.55)' }}
            title={sidebarCollapsed ? 'Sign out' : undefined}
          >
            <LogOut size={20} style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </nav>
    </>
  )
}
