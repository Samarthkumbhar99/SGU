import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  Package,
  TrendingUp,
  Shield,
  BarChart3,
  History,
  Settings,
  Sparkles,
  LogOut,
  X,
  Search,
  User,
  CreditCard,
} from 'lucide-react'
import { useUIStore, useAuthStore } from '../../store/index.js'
import BranchedMenu from '../ui/BranchedMenu.jsx'

// Hierarchical supply chain navigation for BranchedMenu
const SIDEBAR_BRANCHED_ITEMS = [
  {
    label: 'Operations & Network',
    children: [
      { value: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { value: '/network-map', label: 'Network Map', icon: Map },
      { value: '/inventory', label: 'Inventory Matrix', icon: Package },
    ],
  },
  {
    label: 'AI & Solvers',
    children: [
      { value: '/forecasting', label: 'Demand Forecasting', icon: TrendingUp },
      { value: '/rescue', label: 'Inventory Rescue', icon: Shield },
      { value: '/optimization', label: 'MILP Optimization', icon: BarChart3 },
      { value: '/scenarios', label: 'Scenario History', icon: History },
    ],
  },
  {
    label: 'Administration & Profile',
    children: [
      { value: '/search', label: 'Global Search', icon: Search },
      { value: '/profile', label: 'Operations Profile', icon: User },
      { value: '/plans', label: 'Subscription Plans', icon: CreditCard },
      { value: '/onboarding', label: 'AI Telemetry / KYC', icon: Sparkles },
      { value: '/settings', label: 'Settings & Data', icon: Settings },
    ],
  },
]

// Flattened leaf items for collapsed icon rail
const ALL_LEAF_ITEMS = SIDEBAR_BRANCHED_ITEMS.flatMap((section) => section.children || [])

export function Sidebar() {
  const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const sidebarRef = useRef(null)

  const handleLogout = () => {
    setSidebarMobileOpen(false)
    logout()
    navigate('/login')
  }

  // 1. Auto-close sidebar whenever route changes
  useEffect(() => {
    setSidebarMobileOpen(false)
  }, [location.pathname, setSidebarMobileOpen])

  // 2. Close sidebar when clicking anywhere on screen outside the sidebar
  useEffect(() => {
    if (!sidebarMobileOpen) return

    const handleClickOutside = (e) => {
      // If click was inside sidebar, do nothing
      if (sidebarRef.current && sidebarRef.current.contains(e.target)) {
        return
      }
      // If click was on mobile hamburger toggle button, ignore to avoid conflict
      const mobileBtn = document.getElementById('mobile-menu-btn')
      if (mobileBtn && mobileBtn.contains(e.target)) {
        return
      }
      setSidebarMobileOpen(false)
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSidebarMobileOpen(false)
      }
    }

    // Add mousedown, touchstart and escape key listener
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [sidebarMobileOpen, setSidebarMobileOpen])

  // Find which branch index contains the current route so it is open by default
  const activeSectionIndex = SIDEBAR_BRANCHED_ITEMS.findIndex((section) =>
    section.children?.some((kid) => kid.value === location.pathname)
  )
  const defaultOpenIndices = activeSectionIndex >= 0 ? [activeSectionIndex] : [0]

  return (
    <>
      {/* Mobile backdrop overlay — clicking it closes sidebar */}
      {sidebarMobileOpen && (
        <div
          className="ss-sidebar-overlay"
          onClick={() => setSidebarMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container (Light Theme) */}
      <nav
        ref={sidebarRef}
        className={`ss-sidebar ${sidebarCollapsed ? 'ss-sidebar-collapsed' : ''}`}
        style={{
          transform: sidebarMobileOpen ? 'translateX(0)' : undefined,
        }}
        aria-label="Main navigation"
        data-mobile-open={sidebarMobileOpen}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '16px 14px 14px 16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <img
              src="/logo.webp"
              alt="SupplyShield AI Logo"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                objectFit: 'contain',
                flexShrink: 0,
                border: '1px solid #e2e8f0',
                padding: '2px',
                background: '#ffffff',
              }}
            />

            {!sidebarCollapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '15px',
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Supply<span style={{ color: '#0284c7' }}>Shield</span>{' '}
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#0284c7',
                      background: '#f0f9ff',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      border: '1px solid #bae6fd',
                      fontWeight: 700,
                    }}
                  >
                    AI
                  </span>
                </div>
                <div
                  style={{
                    color: '#64748b',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginTop: '2px',
                  }}
                >
                  Distribution Intelligence
                </div>
              </div>
            )}
          </div>

          {/* Cross (close) button for mobile view */}
          <button
            type="button"
            onClick={() => setSidebarMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title="Close navigation"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Branched Navigation Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: sidebarCollapsed ? '14px 6px' : '16px 8px 16px 10px',
          }}
        >
          {sidebarCollapsed ? (
            /* Compact Icon Rail when sidebar is collapsed */
            <div className="flex flex-col items-center gap-2">
              {ALL_LEAF_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      navigate(item.value)
                      setSidebarMobileOpen(false)
                    }}
                    title={item.label}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-sky-50 text-sky-600 ring-2 ring-sky-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={19} />
                  </button>
                )
              })}
            </div>
          ) : (
            /* Animated BranchedMenu in Pure Light Theme */
            <BranchedMenu
              items={SIDEBAR_BRANCHED_ITEMS}
              defaultOpen={defaultOpenIndices}
              defaultActive={location.pathname}
              onSelect={(value) => {
                navigate(value)
                setSidebarMobileOpen(false)
              }}
              color="#1e293b"
              accentColor="#0284c7"
              lineColor="#cbd5e1"
              width={240}
              rowHeight={36}
              indent={36}
              trunk={14}
              radius={10}
              lineWidth={1.5}
              fontSize={13.5}
            />
          )}
        </div>

        {/* User Profile & Sign Out Footer */}
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            padding: '12px 10px',
            background: '#f8fafc',
          }}
        >
          {!sidebarCollapsed && user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '10px',
                marginBottom: '6px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                }}
              >
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: '#0f172a',
                    fontWeight: 700,
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
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: 500,
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
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold w-full transition-all cursor-pointer"
            title={sidebarCollapsed ? 'Sign out' : undefined}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </nav>
    </>
  )
}
export default Sidebar
