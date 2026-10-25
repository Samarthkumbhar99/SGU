import React from 'react'
import { Database, TrendingUp, Cpu, Network, DollarSign, AlertOctagon, Info } from 'lucide-react'

const BADGE_CONFIG = {
  historical: {
    label: 'Historical Dataset',
    detail: 'Verified baseline records (50 SKUs, 5 warehouses, 91,250 observations)',
    icon: Database,
    bg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  forecast: {
    label: 'Forecasted Demand',
    detail: 'Phase 3 ML demand forecasting model prediction',
    icon: TrendingUp,
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  },
  optimizer: {
    label: 'Optimizer Recommendation',
    detail: 'Google OR-Tools CP-SAT mathematical optimization (not yet committed to inventory)',
    icon: Cpu,
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  demo: {
    label: 'Configured Demo Network',
    detail: '12 retail stores & 36 transport lanes configured for simulation testing',
    icon: Network,
    bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  freight: {
    label: 'Assumed Freight Rate',
    detail: 'Scenario rate ($0.10-$0.40/unit) assuming carrier tariff benchmarks',
    icon: DollarSign,
    bg: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  },
  disrupted: {
    label: 'Simulated Disruption',
    detail: 'In-memory cloned network shock (does not mutate live production inventory)',
    icon: AlertOctagon,
    bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  },
}

export function ProvenanceBadge({ type = 'historical', showDetail = false, className = '' }) {
  const config = BADGE_CONFIG[type] || BADGE_CONFIG.historical
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${config.bg} ${className}`}
      title={config.detail}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{config.label}</span>
      {showDetail && (
        <span className="text-[10px] opacity-75 font-normal">({config.detail})</span>
      )}
    </span>
  )
}

export function ProvenanceDisclosureBanner({ message }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400">
      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-slate-800 dark:text-slate-200">Data Provenance Disclosure: </span>
        {message || 'Historical figures reflect real dataset observations. Point-of-sale store demand, transport lane rates, and capacity limits are configured benchmark assumptions for scenario testing.'}
      </div>
    </div>
  )
}

export default ProvenanceBadge
