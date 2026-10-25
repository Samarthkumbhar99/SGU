import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  LayoutDashboard,
  MapPin,
  Package,
  TrendingUp,
  Sparkles,
  BarChart3,
  History,
  Settings,
  User,
  Store,
  Warehouse,
  Bell,
  ArrowRight,
  Shield,
  Activity,
  Bot,
  Zap,
} from 'lucide-react'
import { useUIStore, useEntityStore, useNotificationStore } from '../../store/index.js'

export default function GlobalSearchModal() {
  const { searchModalOpen, setSearchModalOpen, setProfileModalOpen } = useUIStore()
  const { stores, warehouses } = useEntityStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Base list of all navigable pages, modules, and components
  const staticItems = [
    {
      id: 'page-dashboard',
      category: 'Pages',
      title: 'Dashboard Overview',
      subtitle: 'Main FMCG network pulse, KPIs, and live distribution summary',
      icon: LayoutDashboard,
      url: '/dashboard',
      keywords: ['home', 'main', 'kpi', 'metrics', 'stats', 'activity', 'overview'],
    },
    {
      id: 'page-network-map',
      category: 'Pages',
      title: 'Interactive Network Map',
      subtitle: 'Geographic GIS map with warehouse and retail store nodes',
      icon: MapPin,
      url: '/network-map',
      keywords: ['map', 'gis', 'geo', 'routes', 'lanes', 'leaflet', 'locations', 'gps'],
    },
    {
      id: 'page-inventory',
      category: 'Pages',
      title: 'Inventory Management',
      subtitle: 'Real-time SKU stock levels, expiry tracking, batch replenishment',
      icon: Package,
      url: '/inventory',
      keywords: ['stock', 'sku', 'fefo', 'expiry', 'safety stock', 'items', 'batches', 'products'],
    },
    {
      id: 'page-forecasting',
      category: 'Pages',
      title: 'Demand Forecasting',
      subtitle: 'Holt-Winters & Exponential Smoothing predictive models',
      icon: TrendingUp,
      url: '/forecasting',
      keywords: ['forecast', 'demand', 'projection', 'predictive', 'ml', 'sales', 'smoothing'],
    },
    {
      id: 'page-rescue',
      category: 'Pages',
      title: 'Adaptive Inventory Rescue',
      subtitle: 'Emergency stockout resolution and autonomous rerouting',
      icon: Sparkles,
      url: '/rescue',
      keywords: ['rescue', 'stockout', 'emergency', 'mitigation', 're-plan', 'critical'],
    },
    {
      id: 'page-optimization',
      category: 'Pages',
      title: 'Optimization Results',
      subtitle: 'MILP Solver shipment recommendations and cost analysis',
      icon: BarChart3,
      url: '/optimization',
      keywords: ['milp', 'solver', 'or-tools', 'cost', 'freight', 'routing', 'efficiency'],
    },
    {
      id: 'page-scenarios',
      category: 'Pages',
      title: 'Scenario History',
      subtitle: 'Audit trail of executed disruption plans and simulations',
      icon: History,
      url: '/scenarios',
      keywords: ['scenario', 'history', 'audit', 'logs', 'past', 'runs', 'versions'],
    },
    {
      id: 'page-settings',
      category: 'Pages',
      title: 'Settings & Data Management',
      subtitle: 'Network configuration, integration tokens, and system health',
      icon: Settings,
      url: '/settings',
      keywords: ['settings', 'config', 'preferences', 'tokens', 'api', 'system', 'admin'],
    },
    {
      id: 'page-onboarding',
      category: 'Pages',
      title: 'RAY AI Conversational Assistant',
      subtitle: 'FMCG distribution agent and profile setup assistant',
      icon: Bot,
      url: '/onboarding',
      keywords: ['ray', 'ai', 'chatbot', 'assistant', 'onboarding', 'setup', 'llm'],
    },
    {
      id: 'comp-my-stores',
      category: 'Components & Sections',
      title: 'My Stores Replenishment Section',
      subtitle: 'Manage store safety stock, daily demand velocity, and retail pins',
      icon: Store,
      url: '/dashboard#my-stores',
      keywords: ['stores', 'retail', 'shops', 'outlets', 'replenishment', 'velocity'],
    },
    {
      id: 'comp-my-warehouses',
      category: 'Components & Sections',
      title: 'My Distribution Centers (Warehouses)',
      subtitle: 'DC pallet capacities, cold-chain controls, and fleet deployment',
      icon: Warehouse,
      url: '/dashboard#my-warehouses',
      keywords: ['warehouses', 'dc', 'distribution center', 'depot', 'pallets', 'fleet', 'cold chain'],
    },
    {
      id: 'comp-recent-activity',
      category: 'Components & Sections',
      title: 'Recent Dispatch Activity Stream',
      subtitle: 'Live chronological timeline of orders, dispatches, and alerts',
      icon: Activity,
      url: '/dashboard#recent-activity',
      keywords: ['activity', 'dispatch', 'timeline', 'events', 'stream', 'orders'],
    },
    {
      id: 'action-profile',
      category: 'User & Profile',
      title: 'User Profile & Store/DC Details',
      subtitle: 'View detailed user info, permissions, and managed assets',
      icon: User,
      action: 'open-profile',
      keywords: ['profile', 'user', 'account', 'me', 'role', 'company', 'phone', 'details'],
    },
    {
      id: 'action-notifications',
      category: 'User & Profile',
      title: 'Open Realtime Notifications Drawer',
      subtitle: 'Inspect live WebSocket risk alerts and engine logs',
      icon: Bell,
      action: 'open-notifications',
      keywords: ['notifications', 'alerts', 'risks', 'drawer', 'bell', 'messages'],
    },
  ]

  // Dynamically include user's managed stores & warehouses in search index
  const dynamicItems = [
    ...stores.map((s) => ({
      id: `store-${s._id || s.code}`,
      category: 'My Stores',
      title: `${s.name} (${s.code || 'Store'})`,
      subtitle: `${s.category || 'Supermarket'} • ${s.location?.city || 'Local Hub'} • ${s.currentStockUnits || 0} units stock`,
      icon: Store,
      url: '/dashboard#my-stores',
      keywords: ['store', s.name.toLowerCase(), (s.code || '').toLowerCase(), (s.location?.city || '').toLowerCase()],
    })),
    ...warehouses.map((w) => ({
      id: `warehouse-${w._id || w.code}`,
      category: 'My Warehouses',
      title: `${w.name} (${w.code || 'DC'})`,
      subtitle: `${w.type || 'RDC'} • ${w.location?.city || 'Hub'} • ${w.totalPalletCapacity || 0} pallets`,
      icon: Warehouse,
      url: '/dashboard#my-warehouses',
      keywords: ['warehouse', 'dc', w.name.toLowerCase(), (w.code || '').toLowerCase(), (w.location?.city || '').toLowerCase()],
    })),
  ]

  const allSearchable = [...staticItems, ...dynamicItems]

  // Filter based on query
  const filteredResults = query.trim() === ''
    ? staticItems.slice(0, 8)
    : allSearchable.filter((item) => {
        const q = query.toLowerCase()
        const titleMatch = item.title.toLowerCase().includes(q)
        const subMatch = (item.subtitle || '').toLowerCase().includes(q)
        const categoryMatch = item.category.toLowerCase().includes(q)
        const keywordMatch = item.keywords?.some((k) => k.toLowerCase().includes(q))
        return titleMatch || subMatch || categoryMatch || keywordMatch
      })

  // Keyboard navigation & global shortcuts (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchModalOpen(!searchModalOpen)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [searchModalOpen, setSearchModalOpen])

  useEffect(() => {
    if (searchModalOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [searchModalOpen])

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!searchModalOpen) return null

  const handleSelect = (item) => {
    setSearchModalOpen(false)
    if (item.action === 'open-profile') {
      setProfileModalOpen(true)
    } else if (item.action === 'open-notifications') {
      useNotificationStore.getState().openDrawer()
    } else if (item.url) {
      navigate(item.url)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredResults.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(filteredResults.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setSearchModalOpen(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto select-none" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setSearchModalOpen(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24">
        <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden transform transition-all duration-200 animate-scale-up">
          {/* Search Input Bar */}
          <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/60">
            <Search className="w-5 h-5 text-sky-600 mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, components, stores, DCs, or actions… (e.g. 'inventory', 'store', 'mumbai')"
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 mr-1"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
              ESC
            </kbd>
          </div>

          {/* Search Results List */}
          <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
            {filteredResults.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">No results found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-slate-400 mt-1">Try searching for &lsquo;dashboard&rsquo;, &lsquo;map&rsquo;, &lsquo;store&rsquo;, or &lsquo;profile&rsquo;.</p>
              </div>
            ) : (
              filteredResults.map((item, index) => {
                const Icon = item.icon
                const isSelected = index === selectedIndex

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-50/80 text-sky-950' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200/60">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {item.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight size={15} />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Quick Keys */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-2xs">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-2xs">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-2xs">↵</kbd>
                <span>Select &amp; Redirect</span>
              </span>
            </div>
            <span>SupplyShield Global Finder</span>
          </div>
        </div>
      </div>
    </div>
  )
}
