import React from 'react'
import { Database, TrendingUp, Cpu, Network, DollarSign, AlertOctagon, Info } from 'lucide-react'

const BADGE_CONFIG = {
  historical: {
    label: 'Historical Dataset',
    detail: 'Verified baseline records (50 SKUs, 5 warehouses, 91,250 observations)',
    icon: Database,
    bg: '#f1f5f9',
    text: '#0f172a',
    border: '#cbd5e1',
    iconColor: '#475569',
    dotColor: '#64748b',
  },
  forecast: {
    label: 'Forecasted Demand',
    detail: 'Phase 3 ML demand forecasting model prediction (LightGBM / Ridge)',
    icon: TrendingUp,
    bg: '#eef2ff',
    text: '#1e1b4b',
    border: '#c7d2fe',
    iconColor: '#4f46e5',
    dotColor: '#6366f1',
  },
  optimizer: {
    label: 'Optimizer Recommendation',
    detail: 'Google OR-Tools CP-SAT discrete mathematical optimization (MILP solver)',
    icon: Cpu,
    bg: '#ecfdf5',
    text: '#064e3b',
    border: '#a7f3d0',
    iconColor: '#059669',
    dotColor: '#10b981',
  },
  demo: {
    label: 'Configured Demo Network',
    detail: '12 retail stores & 36 transport lanes configured for simulation testing',
    icon: Network,
    bg: '#fffbeb',
    text: '#78350f',
    border: '#fde68a',
    iconColor: '#b45309',
    dotColor: '#f59e0b',
  },
  configured: {
    label: 'Configured Network',
    detail: '3 Regional Hubs & facilities configured in verified active topology',
    icon: Network,
    bg: '#fffbeb',
    text: '#78350f',
    border: '#fde68a',
    iconColor: '#b45309',
    dotColor: '#f59e0b',
  },
  freight: {
    label: 'Assumed Freight Rate',
    detail: 'Scenario rate (₹0.10 - ₹0.40/unit) assuming carrier tariff benchmarks',
    icon: DollarSign,
    bg: '#faf5ff',
    text: '#4c1d95',
    border: '#e9d5ff',
    iconColor: '#7c3aed',
    dotColor: '#8b5cf6',
  },
  assumed: {
    label: 'Assumed Baseline',
    detail: 'Scenario freight tariff benchmark (₹0.10 - ₹0.40/unit per corridor)',
    icon: DollarSign,
    bg: '#faf5ff',
    text: '#4c1d95',
    border: '#e9d5ff',
    iconColor: '#7c3aed',
    dotColor: '#8b5cf6',
  },
  disrupted: {
    label: 'Simulated Disruption',
    detail: 'In-memory cloned network shock (does not mutate live production inventory)',
    icon: AlertOctagon,
    bg: '#fff1f2',
    text: '#881337',
    border: '#fecdd3',
    iconColor: '#e11d48',
    dotColor: '#f43f5e',
  },
  risk: {
    label: 'Risk Alert',
    detail: 'Active corridor disruption or inventory bottleneck alert',
    icon: AlertOctagon,
    bg: '#fff1f2',
    text: '#881337',
    border: '#fecdd3',
    iconColor: '#e11d48',
    dotColor: '#f43f5e',
  },
}

export function ProvenanceBadge({
  type = 'historical',
  tooltip,
  title,
  showDetail = false,
  className = '',
}) {
  const normalizedType = type?.toLowerCase?.() || 'historical'
  const config = BADGE_CONFIG[normalizedType] || BADGE_CONFIG.historical
  const Icon = config.icon
  const activeTooltip = tooltip || title || config.detail

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight select-none transition-all cursor-help hover:opacity-90 shadow-2xs ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
      }}
      title={activeTooltip}
    >
      <Icon
        className="w-3 h-3 shrink-0"
        style={{ color: config.iconColor }}
        aria-hidden="true"
      />
      <span>{config.label}</span>
      {showDetail && (
        <span
          className="text-[10px] font-normal opacity-85 ml-1 border-l pl-1"
          style={{ borderColor: config.border }}
        >
          {config.detail}
        </span>
      )}
    </span>
  )
}

export function ProvenanceDisclosureBanner({ message }) {
  return (
    <div
      className="flex items-start gap-3 p-3.5 rounded-xl text-xs leading-relaxed transition-all shadow-2xs"
      style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        color: '#334155',
      }}
    >
      <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
      <div>
        <span style={{ fontWeight: 700, color: '#0f172a' }}>Data Provenance Disclosure: </span>
        {message ||
          'Historical figures reflect real dataset observations. Point-of-sale store demand, transport lane rates, and capacity limits are configured benchmark assumptions for scenario testing.'}
      </div>
    </div>
  )
}

export default ProvenanceBadge
