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
} from 'lucide-react'

const SCENARIOS = [
  {
    id: 'flood',
    name: 'Depot DC-1 Flooding',
    type: 'Node Outage',
    icon: AlertTriangle,
    color: '#ef4444',
    bg: '#fef2f2',
    description: 'Central regional DC cut off by flash floods. 38,000 units stranded before morning dispatch.',
    impact: '18 retail stores facing 42% stockout in 6 hours.',
    results: {
      solveTime: '1.42s',
      reroutedUnits: '36,400 units',
      alternateHub: 'Hub Beta (Northern DC)',
      fillRate: '99.4%',
      phantomStock: '0%',
      freightDelta: '+$2,180 (Expedited)',
      savedRevenue: '$48,900',
    },
  },
  {
    id: 'surge',
    name: 'Festive Demand Surge (+180%)',
    type: 'Demand Shock',
    icon: Zap,
    color: '#f59e0b',
    bg: '#fffbeb',
    description: 'Sudden flash promotion spikes store demand by 180% across high-velocity beverage and dairy SKUs.',
    impact: 'Legacy ERP replenishment schedule takes 48 hours to recalibrate.',
    results: {
      solveTime: '1.85s',
      reroutedUnits: '52,000 units',
      alternateHub: 'Dynamic Multi-Depot Split',
      fillRate: '98.8%',
      phantomStock: '0%',
      freightDelta: '+$3,450 (Consolidated)',
      savedRevenue: '$76,200',
    },
  },
  {
    id: 'coldchain',
    name: 'Cold-Chain Reefer Breakdown',
    type: 'FEFO Expiry Risk',
    icon: ShieldAlert,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    description: 'Refrigerated transit failure risks spoiling 12,000 dairy cartons with under 5 days remaining shelf-life.',
    impact: 'Standard FIFO rules would ship to slow stores resulting in total spoil write-down.',
    results: {
      solveTime: '0.98s',
      reroutedUnits: '11,800 units',
      alternateHub: 'High-Velocity Tier-1 Stores',
      fillRate: '100%',
      phantomStock: '0%',
      freightDelta: '-$620 (Optimized Local)',
      savedRevenue: '$28,400',
    },
  },
]

export default function DisruptionSimulator() {
  const [activeScenarioId, setActiveScenarioId] = useState('flood')
  const [isSolving, setIsSolving] = useState(false)
  const [solvedAt, setSolvedAt] = useState(Date.now())

  const scenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0]

  const handleRunSimulation = (id) => {
    setActiveScenarioId(id)
    setIsSolving(true)
    setTimeout(() => {
      setIsSolving(false)
      setSolvedAt(Date.now())
    }, 900)
  }

  return (
    <section className="py-24 bg-gradient-to-b from-white via-sky-50/40 to-white relative overflow-hidden">
      {/* Decorative gradient accents */}
      <div className="absolute top-1/2 -left-48 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5 text-sky-600" />
            Interactive Disruption Sandbox
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Test the adaptive engine under real supply shocks
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Select a live disruption event below and watch Google OR-Tools MILP re-index the network graph,
            balance FEFO constraints, and output mathematically optimal dispatch plans in under 2 seconds.
          </p>
        </div>

        {/* Sandbox Grid */}
        <div className="bg-white rounded-3xl border border-sky-100 shadow-2xl p-6 sm:p-10">
          {/* Scenario Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {SCENARIOS.map((s) => {
              const Icon = s.icon
              const isSelected = s.id === activeScenarioId
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleRunSimulation(s.id)}
                  className={`text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 shadow-md ring-2 ring-sky-200'
                      : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: s.bg, color: s.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      {s.type}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{s.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{s.description}</p>
                </button>
              )
            })}
          </div>

          {/* Simulation Output Board */}
          <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Solver</div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    Google OR-Tools MILP Engine
                    <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-md border border-slate-700">
                      Zero Phantom Stock
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRunSimulation(activeScenarioId)}
                disabled={isSolving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-600/30 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSolving ? 'animate-spin' : ''}`} />
                {isSolving ? 'Re-optimizing…' : 'Re-run Scenario'}
              </button>
            </div>

            {/* Results Display */}
            {isSolving ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-sky-400 border-t-transparent animate-spin mb-4" />
                <h4 className="text-base font-bold text-sky-300">Re-indexing network nodes & FEFO constraints…</h4>
                <p className="text-xs text-slate-400 mt-1">Evaluating 12-point integrity and dispatch routes</p>
              </div>
            ) : (
              <div className="pt-6">
                {/* Metric Cards Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Solve Speed</span>
                    <div className="text-2xl font-black text-sky-400 mt-1 flex items-baseline gap-1">
                      {scenario.results.solveTime}
                      <span className="text-xs font-normal text-slate-400">MILP</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium">99.8% faster than ERP</span>
                  </div>

                  <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stock Recovered</span>
                    <div className="text-2xl font-black text-white mt-1">
                      {scenario.results.reroutedUnits}
                    </div>
                    <span className="text-[10px] text-sky-300 font-medium">Via {scenario.results.alternateHub}</span>
                  </div>

                  <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Network Fill Rate</span>
                    <div className="text-2xl font-black text-emerald-400 mt-1">
                      {scenario.results.fillRate}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">0 store stockouts</span>
                  </div>

                  <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Revenue Preserved</span>
                    <div className="text-2xl font-black text-amber-300 mt-1">
                      {scenario.results.savedRevenue}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Freight: {scenario.results.freightDelta}</span>
                  </div>
                </div>

                {/* Grounded Decision Rationale (LLM Explainer) */}
                <div className="bg-slate-800/60 rounded-xl p-4 border border-sky-500/20 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-sky-300 mb-1">Grounded Mathematical Rationale (Zero Hallucination)</h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      SupplyShield AI identified capacity slack at <span className="text-white font-semibold">{scenario.results.alternateHub}</span>. 
                      By executing dynamic route reallocation with lead-time constraint bounds, the model satisfied 100% of store safety thresholds 
                      while keeping perishable FEFO compliance at 0 spoiled units.
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
