import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  Compass,
  Warehouse,
  Package,
  Cpu,
  ArrowRight,
  CornerDownLeft,
} from 'lucide-react'

const SEARCH_DATABASE = [
  // --- Pages & Routes ---
  {
    id: 'page-network-map',
    category: 'Pages',
    title: '3D Regional Network Map',
    description: 'Deck.gl + MapLibre interactive 3D logistics transit lanes and facility nodes',
    path: '/network-map',
    icon: Compass,
    keywords: ['map', '3d', 'network', 'transit', 'lanes', 'warehouse', 'deckgl', 'geo'],
  },
  {
    id: 'page-network-explorer',
    category: 'Pages',
    title: 'Supply Chain Network Explorer',
    description: 'Topology graph of regional distribution centers, stores, and transport links',
    path: '/network-explorer',
    icon: Compass,
    keywords: ['network', 'explorer', 'nodes', 'topology', 'graph', 'depots'],
  },
  {
    id: 'page-inventory',
    category: 'Pages',
    title: 'Inventory Matrix & Trajectory Studio',
    description: 'Multi-day forward stock trajectory, FEFO batches, and safety buffer projections',
    path: '/inventory',
    icon: Compass,
    keywords: ['inventory', 'stock', 'matrix', 'forecast', 'fefo', 'trajectory', 'skus'],
  },
  {
    id: 'page-inventory-table',
    category: 'Pages',
    title: 'Inventory Batch Ledger & Table',
    description: 'Tabular overview of warehouse lots, shelf-life days, unit costs, and stock levels',
    path: '/inventory-table',
    icon: Compass,
    keywords: ['table', 'batches', 'ledger', 'skus', 'shelf-life', 'lots', 'stockout'],
  },
  {
    id: 'page-onboarding',
    category: 'Pages',
    title: 'Ray AI Facility Onboarding',
    description: 'Setup wizard for onboarding new regional warehouses, retail stores, and transport lanes',
    path: '/onboarding',
    icon: Compass,
    keywords: ['onboarding', 'ray', 'agent', 'setup', 'add', 'facility', 'store', 'create'],
  },
  {
    id: 'page-simulator',
    category: 'Pages',
    title: 'Disruption Sandbox Simulator',
    description: 'Simulate highway closures, demand spikes, and supplier delays in real time',
    path: '/',
    icon: Compass,
    keywords: ['disruption', 'simulator', 'sandbox', 'highway', 'closure', 'delay'],
  },
  {
    id: 'page-roi',
    category: 'Pages',
    title: 'Quantifiable ROI Calculator',
    description: 'Calculate bottom-line cost savings from eliminated food waste and fuel reductions',
    path: '/',
    icon: Compass,
    keywords: ['roi', 'calculator', 'savings', 'cost', 'metrics', 'financial'],
  },

  // --- Facilities & Warehouses ---
  {
    id: 'fac-mum-01',
    category: 'Warehouses',
    title: 'Bhiwandi Central DC (WH-MUM-01)',
    description: 'Primary Western regional cold & ambient distribution center (Bhiwandi)',
    path: '/network-map',
    icon: Warehouse,
    keywords: ['mumbai', 'bhiwandi', 'wh-mum-01', 'warehouse', 'dc', 'central'],
  },
  {
    id: 'fac-pun-02',
    category: 'Warehouses',
    title: 'Pune Metro Hub (WH-PUN-02)',
    description: 'Cross-docking and high-velocity fulfillment center (Hinjewadi, Pune)',
    path: '/network-map',
    icon: Warehouse,
    keywords: ['pune', 'wh-pun-02', 'hub', 'cross-dock', 'fulfillment'],
  },
  {
    id: 'fac-nag-03',
    category: 'Warehouses',
    title: 'Nagpur Cold-Chain Center (WH-NAG-03)',
    description: 'Temperature-controlled dairy and perishable regional warehouse (Nagpur)',
    path: '/network-map',
    icon: Warehouse,
    keywords: ['nagpur', 'wh-nag-03', 'cold-chain', 'freezer', 'dairy'],
  },
  {
    id: 'store-s-04',
    category: 'Stores',
    title: 'Store S-04 (Mumbai South Supermarket)',
    description: 'High-velocity retail store located in Colaba, Mumbai',
    path: '/inventory-table',
    icon: Warehouse,
    keywords: ['s-04', 'store', 'colaba', 'mumbai', 'south', 'retail'],
  },
  {
    id: 'store-s-02',
    category: 'Stores',
    title: 'Store S-02 (Pune Kothrud Express)',
    description: 'High-footfall suburban retail store in Kothrud, Pune',
    path: '/inventory-table',
    icon: Warehouse,
    keywords: ['s-02', 'kothrud', 'pune', 'express', 'store'],
  },

  // --- Products & SKUs ---
  {
    id: 'sku-milk-001',
    category: 'SKUs',
    title: 'SKU-MILK-001 (Pasteurized Toned Milk 1L)',
    description: 'High-velocity staple; 4-day shelf life with Dynamic FEFO priority',
    path: '/inventory',
    icon: Package,
    keywords: ['milk', 'sku-milk-001', 'dairy', 'perishable', 'toned'],
  },
  {
    id: 'sku-butter-002',
    category: 'SKUs',
    title: 'SKU-BUTTER-002 (Salted Table Butter 500g)',
    description: 'Cold-chain required staple; 90-day shelf life; high margin',
    path: '/inventory',
    icon: Package,
    keywords: ['butter', 'sku-butter-002', 'dairy', 'salted'],
  },
  {
    id: 'sku-paneer-003',
    category: 'SKUs',
    title: 'SKU-PANEER-003 (Fresh Malai Paneer 200g)',
    description: 'Ultra-perishable fresh cottage cheese; zero-waste algorithm monitored',
    path: '/inventory',
    icon: Package,
    keywords: ['paneer', 'sku-paneer-003', 'fresh', 'malai', 'dairy'],
  },
  {
    id: 'sku-yogurt-004',
    category: 'SKUs',
    title: 'SKU-YOGURT-004 (Greek Probiotic Yogurt 400g)',
    description: 'Refrigerated fermented yogurt with 14-day expiry threshold',
    path: '/inventory',
    icon: Package,
    keywords: ['yogurt', 'sku-yogurt-004', 'greek', 'probiotic', 'perishable'],
  },

  // --- Optimization Engines ---
  {
    id: 'eng-milp',
    category: 'Engines',
    title: 'Google OR-Tools MILP Solver',
    description: 'Mixed-Integer Linear Programming mathematical network dispatch optimizer',
    path: '/network-map',
    icon: Cpu,
    keywords: ['google', 'or-tools', 'milp', 'solver', 'optimization', 'math', 'linear'],
  },
  {
    id: 'eng-fefo',
    category: 'Engines',
    title: 'Dynamic FEFO Spoilage Defense',
    description: 'First-Expired, First-Out dynamic routing engine preventing retail waste',
    path: '/inventory',
    icon: Cpu,
    keywords: ['fefo', 'expiry', 'spoilage', 'waste', 'dynamic', 'freshness'],
  },
]

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Filter items based on query
  const results = query.trim()
    ? SEARCH_DATABASE.filter((item) => {
        const q = query.toLowerCase()
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        )
      })
    : SEARCH_DATABASE.slice(0, 8) // default suggestions

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  const handleSelect = (item) => {
    onClose()
    navigate(item.path)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto p-4 sm:p-6 md:p-20 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative mx-auto max-w-2xl transform rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 transition-all overflow-hidden">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-200 px-4 py-3 bg-slate-50/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Search pages, warehouses, SKUs, or AI tools... (e.g. 'map', 'milk', 'pune')"
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="ml-3 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
          {results.length === 0 ? (
            <div className="py-14 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-900">No results found</p>
              <p className="text-xs text-slate-500">
                No page, warehouse, or SKU matches &quot;{query}&quot;.
              </p>
            </div>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon
              const isSelected = idx === selectedIndex

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                    isSelected ? 'bg-sky-50/80 text-sky-950' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate">{item.title}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-sky-700">
                        <span>Go</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                    <ArrowRight
                      className={`w-4 h-4 ${isSelected ? 'text-sky-700 translate-x-0.5' : 'text-slate-300'}`}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 font-mono bg-white border border-slate-200 rounded">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 font-mono bg-white border border-slate-200 rounded">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 font-mono bg-white border border-slate-200 rounded">↵</kbd> to select
            </span>
          </div>
          <span className="text-slate-400">Clicking redirect takes you immediately to that component</span>
        </div>
      </div>
    </div>
  )
}
