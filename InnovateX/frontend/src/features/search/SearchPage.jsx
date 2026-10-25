import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  Compass,
  Warehouse,
  Package,
  Cpu,
  ArrowRight,
  Filter,
  Sparkles,
  Store,
  Layers,
} from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout.jsx'

const SEARCH_DATABASE = [
  // --- Pages & Workbenches ---
  {
    id: 'page-network-map',
    category: 'Pages',
    title: '3D Regional Network Map',
    subtitle: 'Deck.gl + MapLibre 3D Visualization',
    description: 'Interactive geospatial map displaying multi-echelon transit lanes, facility inventory tiers, and live road conditions.',
    path: '/network-map',
    icon: Compass,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    keywords: ['map', '3d', 'network', 'transit', 'lanes', 'warehouse', 'deckgl', 'geo'],
  },
  {
    id: 'page-network-explorer',
    category: 'Pages',
    title: 'Supply Chain Network Explorer',
    subtitle: 'Topology Graph & Flow Conservation',
    description: 'Topology layout of distribution centers, regional depots, retail nodes, and multi-tier replenishment connections.',
    path: '/network-explorer',
    icon: Compass,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    keywords: ['network', 'explorer', 'nodes', 'topology', 'graph', 'depots', 'stores'],
  },
  {
    id: 'page-inventory',
    category: 'Pages',
    title: 'Inventory Matrix & Trajectory Studio',
    subtitle: 'Dynamic FEFO & Expiry Projections',
    description: 'Multi-day forward stock trajectory simulation studio, batch freshness tracking, and safety buffer models.',
    path: '/inventory',
    icon: Layers,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    keywords: ['inventory', 'stock', 'matrix', 'forecast', 'fefo', 'trajectory', 'skus', 'batches'],
  },
  {
    id: 'page-inventory-table',
    category: 'Pages',
    title: 'Inventory Batch Ledger & Table',
    subtitle: 'Real-time Stock Balances',
    description: 'Tabular overview of warehouse lots, shelf-life days, unit costs, and SKU stock levels across all regional facilities.',
    path: '/inventory-table',
    icon: Layers,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    keywords: ['table', 'batches', 'ledger', 'skus', 'shelf-life', 'lots', 'stockout'],
  },
  {
    id: 'page-dashboard',
    category: 'Pages',
    title: 'Executive Distribution Dashboard',
    subtitle: 'FMCG Network Operations Overview',
    description: 'Central operations command center with high-level KPIs, fill-rates, active alerts, and stockout probability gauges.',
    path: '/dashboard',
    icon: Compass,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    keywords: ['dashboard', 'executive', 'kpi', 'metrics', 'fill-rate', 'overview'],
  },
  {
    id: 'page-forecasting',
    category: 'Pages',
    title: 'AI Demand Forecasting Studio',
    subtitle: 'LightGBM & Statistical Models',
    description: '7-day forward machine learning predictions with holiday surge detection and promotional lift calculations.',
    path: '/forecasting',
    icon: Cpu,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    keywords: ['forecasting', 'demand', 'prediction', 'ml', 'lightgbm', 'sales', 'surge'],
  },
  {
    id: 'page-optimization',
    category: 'Pages',
    title: 'MILP Optimization Workbench',
    subtitle: 'Google OR-Tools Mathematical Solver',
    description: 'Formulate and trigger mixed-integer linear programming solve runs for cross-docking and truckload optimization.',
    path: '/optimization',
    icon: Cpu,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    keywords: ['optimization', 'milp', 'or-tools', 'solver', 'dispatch', 'fleet', 'costs'],
  },
  {
    id: 'page-scenarios',
    category: 'Pages',
    title: 'Run History & Scenario Audits',
    subtitle: 'Immutable Optimization Ledger',
    description: 'Review historical solver run executions, dual variable shadow prices, and audit logs of all past plan dispatches.',
    path: '/scenarios',
    icon: Compass,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    keywords: ['scenarios', 'history', 'runs', 'solver', 'audit', 'logs'],
  },
  {
    id: 'page-onboarding',
    category: 'Pages',
    title: 'Ray AI Facility Onboarding',
    subtitle: 'Conversational Setup Agent',
    description: 'Intelligent setup wizard for connecting new warehouses, distribution centers, retail stores, and transport corridors.',
    path: '/onboarding',
    icon: Sparkles,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    keywords: ['onboarding', 'ray', 'agent', 'setup', 'add', 'facility', 'store', 'create'],
  },

  // --- Facilities & Distribution Centers ---
  {
    id: 'fac-mum-01',
    category: 'Facilities',
    title: 'Bhiwandi Central DC (WH-MUM-01)',
    subtitle: 'Primary Western Regional Warehouse',
    description: '24,000 sq ft facility with ambient & cold-chain zones; 78% capacity utilization; 14 loading docks.',
    path: '/network-map',
    icon: Warehouse,
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    keywords: ['mumbai', 'bhiwandi', 'wh-mum-01', 'warehouse', 'dc', 'central'],
  },
  {
    id: 'fac-pun-02',
    category: 'Facilities',
    title: 'Pune Metro Hub (WH-PUN-02)',
    subtitle: 'High-Velocity Cross-Dock Center',
    description: '18,500 sq ft facility in Hinjewadi; handles regional cross-docking and daily supermarket replenishments.',
    path: '/network-map',
    icon: Warehouse,
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    keywords: ['pune', 'wh-pun-02', 'hub', 'cross-dock', 'fulfillment'],
  },
  {
    id: 'fac-nag-03',
    category: 'Facilities',
    title: 'Nagpur Cold-Chain Center (WH-NAG-03)',
    subtitle: 'Deep-Freeze & Dairy Storage',
    description: '12,000 sq ft multi-temperature cold storage facility specializing in ultra-fresh dairy and frozen staples.',
    path: '/network-map',
    icon: Warehouse,
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    keywords: ['nagpur', 'wh-nag-03', 'cold-chain', 'freezer', 'dairy'],
  },

  // --- Stores ---
  {
    id: 'store-s-04',
    category: 'Stores',
    title: 'Store S-04 (Mumbai South Supermarket)',
    subtitle: 'High-Velocity Colaba Store',
    description: 'Metropolitan supermarket; daily milk turnover 420L; POS replenishment integrated.',
    path: '/inventory-table',
    icon: Store,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    keywords: ['s-04', 'store', 'colaba', 'mumbai', 'south', 'retail'],
  },
  {
    id: 'store-s-02',
    category: 'Stores',
    title: 'Store S-02 (Pune Kothrud Express)',
    subtitle: 'Suburban High-Density Outlet',
    description: 'Express grocery outlet; high yogurt & fresh paneer sales velocity.',
    path: '/inventory-table',
    icon: Store,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    keywords: ['s-02', 'kothrud', 'pune', 'express', 'store'],
  },
  {
    id: 'store-s-03',
    category: 'Stores',
    title: 'Store S-03 (Thane Central Mart)',
    subtitle: 'Large-Format Suburban Store',
    description: 'Serves suburban Thane families; high volume weekend pantry shopping.',
    path: '/inventory-table',
    icon: Store,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    keywords: ['s-03', 'thane', 'mart', 'store', 'retail'],
  },

  // --- SKUs & Products ---
  {
    id: 'sku-milk-001',
    category: 'Products',
    title: 'SKU-MILK-001 (Pasteurized Toned Milk 1L)',
    subtitle: 'Perishable Dairy • 4-Day Shelf Life',
    description: 'Core staple with high daily sales velocity. Monitored with strict Dynamic FEFO dispatch priority.',
    path: '/inventory',
    icon: Package,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    keywords: ['milk', 'sku-milk-001', 'dairy', 'perishable', 'toned'],
  },
  {
    id: 'sku-butter-002',
    category: 'Products',
    title: 'SKU-BUTTER-002 (Salted Table Butter 500g)',
    subtitle: 'Chilled Storage • 90-Day Shelf Life',
    description: 'Cold-chain required product with high gross margins; reorder point set at 280 units.',
    path: '/inventory',
    icon: Package,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    keywords: ['butter', 'sku-butter-002', 'dairy', 'salted'],
  },
  {
    id: 'sku-paneer-003',
    category: 'Products',
    title: 'SKU-PANEER-003 (Fresh Malai Paneer 200g)',
    subtitle: 'Fresh Dairy • 7-Day Expiry Window',
    description: 'Ultra-perishable fresh cottage cheese; algorithm triggers markdown alerts if remaining life ≤ 48 hours.',
    path: '/inventory',
    icon: Package,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    keywords: ['paneer', 'sku-paneer-003', 'fresh', 'malai', 'dairy'],
  },
  {
    id: 'sku-yogurt-004',
    category: 'Products',
    title: 'SKU-YOGURT-004 (Greek Probiotic Yogurt 400g)',
    subtitle: 'Refrigerated • 14-Day Expiry',
    description: 'Specialty fermented dairy SKU with steady suburban demand; temperature logging tracked in realtime.',
    path: '/inventory',
    icon: Package,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    keywords: ['yogurt', 'sku-yogurt-004', 'greek', 'probiotic', 'perishable'],
  },
]

const CATEGORIES = ['All', 'Pages', 'Facilities', 'Stores', 'Products']

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const navigate = useNavigate()

  // Filter results by search query and category
  const filteredResults = useMemo(() => {
    return SEARCH_DATABASE.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false
      }

      // Query filter
      if (!query.trim()) return true

      const q = query.toLowerCase().trim()
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      )
    })
  }, [query, selectedCategory])

  const handleNavigate = (path) => {
    navigate(path)
  }

  return (
    <AppLayout
      pageTitle="Global Network Search"
      breadcrumbs={['SupplyShield', 'Global Search']}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Header Banner */}
        <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sky-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Search className="w-3.5 h-3.5" />
              Unified Platform Search
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Search any Page, Facility, Store, or SKU
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Instantly find and navigate to regional distribution centers, mathematical workbenches, inventory batch records, and live telemetry nodes.
            </p>
          </div>

          {/* Decorative ambient glow */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Search Input Box */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search... (e.g. 'Network Map', 'Bhiwandi', 'Milk', 'OR-Tools', 'Colaba')"
              className="w-full pl-12 pr-10 py-3.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 text-slate-900 placeholder:text-slate-400 text-base font-medium transition-all outline-none"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills & Quick Suggestions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Filter:
              </span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick shortcuts */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold">Quick:</span>
              {['Milk', 'Bhiwandi DC', '3D Map', 'OR-Tools'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setQuery(chip)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count & Overview */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {filteredResults.length} {filteredResults.length === 1 ? 'match' : 'matches'}
            {query && (
              <span>
                {' '}
                for &ldquo;<strong className="text-slate-800">{query}</strong>&rdquo;
              </span>
            )}
          </p>
        </div>

        {/* Results Grid */}
        {filteredResults.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No matching results</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              We couldn&apos;t find any page, warehouse, store, or SKU matching &ldquo;{query}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSelectedCategory('All')
              }}
              className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 transition-colors"
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResults.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className="group bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Icon + Badge + Title */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 group-hover:bg-sky-50 group-hover:border-sky-200 text-slate-700 group-hover:text-sky-700 flex items-center justify-center transition-colors shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-500">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${item.badgeColor}`}
                      >
                        {item.category}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mt-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-slate-400 group-hover:text-slate-600">
                      {item.path}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-sky-600 group-hover:text-sky-700 group-hover:translate-x-0.5 transition-all">
                      <span>Navigate</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
