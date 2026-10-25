import { useState } from 'react'
import {
  AlertTriangle,
  Zap,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Truck,
  Building2,
  PackageCheck,
  Check,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react'

const SCENARIOS = [
  {
    id: 'flood',
    name: 'Depot DC-1 Flash Flood',
    badge: 'Critical Outage',
    badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
    icon: AlertTriangle,
    iconColor: '#e11d48',
    iconBg: '#ffe4e6',
    description: 'Central regional DC cut off by flash floods. 38,000 units stranded before 5:00 AM dispatch.',
    impact: '18 retail stores facing 42% stockout by opening rush.',
    results: {
      solveTime: '1.42s',
      reroutedUnits: '36,400',
      alternateHub: 'Hub Beta (Northern DC)',
      fillRate: '99.4%',
      phantomStock: '0.0%',
      freightDelta: '+$2,180',
      savedRevenue: '$48,900',
      transfers: [
        { from: 'Hub Beta', to: 'Store #04 (Downtown Metro)', sku: 'Dairy & Chilled Beverages', qty: '12,400 units', leadTime: '3.2 hrs', status: 'Rerouted' },
        { from: 'Hub Beta', to: 'Store #11 (Westfield Mall)', sku: 'Bakery & Fresh Produce', qty: '14,800 units', leadTime: '2.8 hrs', status: 'Rerouted' },
        { from: 'DC South', to: 'Store #19 (Coastal Retail)', sku: 'Packaged Essentials', qty: '9,200 units', leadTime: '4.1 hrs', status: 'Compensated' },
      ],
      aiExplanation: 'Dynamic capacity slack at Hub Beta activated. Route bounds constrained to under 4.5 hours lead time. All 18 stores receive morning replenishment with 0 expired batches.',
    },
  },
  {
    id: 'surge',
    name: 'Weekend Retail Demand Spike',
    badge: 'Demand Shock +180%',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: Zap,
    iconColor: '#d97706',
    iconBg: '#fef3c7',
    description: 'Flash supermarket promotion generates a sudden 180% run on high-velocity beverage and dairy SKUs.',
    impact: 'Legacy ERP replenishment schedule takes 48 hours to recalibrate.',
    results: {
      solveTime: '1.85s',
      reroutedUnits: '52,000',
      alternateHub: 'Multi-Depot Consolidated Split',
      fillRate: '98.8%',
      phantomStock: '0.0%',
      freightDelta: '+$3,450',
      savedRevenue: '$76,200',
      transfers: [
        { from: 'Central DC', to: 'Store #01 (Supercentre North)', sku: 'Electrolyte & Juice (SKU-201)', qty: '22,000 units', leadTime: '2.1 hrs', status: 'Expedited' },
        { from: 'East Depot', to: 'Store #08 (Metro Hub Express)', sku: 'UHT Milk & Dairy (SKU-104)', qty: '18,500 units', leadTime: '3.0 hrs', status: 'Cross-Docked' },
        { from: 'Hub Beta', to: 'Store #14 (Suburban Plaza)', sku: 'Refrigerated Fresh (SKU-309)', qty: '11,500 units', leadTime: '2.4 hrs', status: 'Reallocated' },
      ],
      aiExplanation: 'Solver prioritized SKU-201 and SKU-104 to prevent stockout penalties. Multi-depot cross-docking maintained vehicle fill efficiency at 96.4%.',
    },
  },
  {
    id: 'coldchain',
    name: 'Reefer Transit Breakdown',
    badge: 'FEFO Expiry Risk',
    badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    icon: ShieldAlert,
    iconColor: '#4f46e5',
    iconBg: '#e0e7ff',
    description: 'Refrigerated truck failure leaves 12,000 perishable dairy cartons with under 4 days shelf-life.',
    impact: 'FIFO allocation would deliver stock to slow stores, resulting in complete write-down.',
    results: {
      solveTime: '0.98s',
      reroutedUnits: '11,800',
      alternateHub: 'High-Velocity Tier-1 Stores',
      fillRate: '100%',
      phantomStock: '0.0%',
      freightDelta: '-$620',
      savedRevenue: '$28,400',
      transfers: [
        { from: 'Transit Bay 3', to: 'Store #02 (Central Hypermarket)', sku: 'Fresh Greek Yogurt (Batch #881)', qty: '6,200 units', leadTime: '1.4 hrs', status: 'Express FEFO' },
        { from: 'Transit Bay 3', to: 'Store #05 (Urban Express)', sku: 'Pasteurized Milk (Batch #884)', qty: '5,600 units', leadTime: '1.8 hrs', status: 'Express FEFO' },
      ],
      aiExplanation: 'Batch expiry date matched against velocity metrics. Units diverted to Stores #02 & #05 where historical sell-through ensures 100% consumption before expiration.',
    },
  },
]

export default function DisruptionSimulator() {
  const [activeScenarioId, setActiveScenarioId] = useState('flood')
  const [isSolving, setIsSolving] = useState(false)

  const scenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0]

  const handleRunSimulation = (id) => {
    setActiveScenarioId(id)
    setIsSolving(true)
    setTimeout(() => {
      setIsSolving(false)
    }, 700)
  }

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5 text-sky-600" />
            Interactive Disruption Workbench
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-slate-900 tracking-tight leading-tight">
            Test the adaptive engine under{' '}
            <span className="font-cursive text-sky-600 font-semibold italic text-[1.08em] px-1">
              real supply shocks
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Select a live disruption scenario below to simulate how Google OR-Tools MILP re-indexes network nodes,
            verifies physical capacity constraints, and balances FEFO perishables in real time.
          </p>
        </div>

        {/* Workbench Layout (Professional Clean White Enterprise Card) */}
        <div className="bg-slate-50/60 rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-8">
          {/* Top Scenario Pills / Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {SCENARIOS.map((s) => {
              const Icon = s.icon
              const isSelected = s.id === activeScenarioId
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleRunSimulation(s.id)}
                  className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-white border-sky-500 shadow-md shadow-sky-500/10 ring-1 ring-sky-500'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: s.iconBg, color: s.iconColor }}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{s.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{s.description}</p>
                </button>
              )
            })}
          </div>

          {/* Workbench Console Area (Clean White Enterprise Dashboard) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header Toolbar */}
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Live Operational Solver Session
                  </div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{scenario.name}</span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="text-xs font-semibold text-sky-700">Google OR-Tools MILP</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-slate-400 font-medium">Solver Latency</div>
                  <div className="text-xs font-mono font-bold text-slate-900">{scenario.results.solveTime}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunSimulation(activeScenarioId)}
                  disabled={isSolving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSolving ? 'animate-spin' : ''}`} />
                  {isSolving ? 'Solving…' : 'Re-Solve Network'}
                </button>
              </div>
            </div>

            {/* Content Body */}
            {isSolving ? (
              <div className="py-24 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border-3 border-sky-600 border-t-transparent animate-spin mb-3" />
                <div className="text-sm font-bold text-slate-800">Solving Linear Mixed-Integer Constraints…</div>
                <div className="text-xs text-slate-500 mt-1">Checking fleet weight, loading docks, and store lead times</div>
              </div>
            ) : (
              <div className="p-6">
                {/* 4 Clean Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Solve Speed</span>
                    <div className="text-2xl font-black text-sky-600 font-mono mt-1">
                      {scenario.results.solveTime}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" /> Deterministic Guarantee
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rerouted Freight</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {scenario.results.reroutedUnits} <span className="text-xs font-normal text-slate-500">units</span>
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                      Via {scenario.results.alternateHub}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Store Fill Rate</span>
                    <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                      {scenario.results.fillRate}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">0 store stockouts</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Margin Preserved</span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {scenario.results.savedRevenue}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Freight: {scenario.results.freightDelta}</span>
                  </div>
                </div>

                {/* Dispatch Reroute Manifest Table (Real UI Component) */}
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                  <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Optimized Dispatch Manifest (RFC 4180 Verified)
                    </span>
                    <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      3 Node Transfers Scheduled
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Origin Node</th>
                          <th className="py-2.5 px-4">Destination Store</th>
                          <th className="py-2.5 px-4">SKU Batch</th>
                          <th className="py-2.5 px-4 text-right">Quantity</th>
                          <th className="py-2.5 px-4 text-right">Lead Time</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scenario.results.transfers.map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {t.from}
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium">{t.to}</td>
                            <td className="py-3 px-4 text-slate-600">{t.sku}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{t.qty}</td>
                            <td className="py-3 px-4 text-right font-mono text-slate-600">{t.leadTime}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Grounded Decision Rationale Banner */}
                <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 mb-0.5">
                      Grounded Mathematical Rationale (Zero Hallucinations)
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {scenario.results.aiExplanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
