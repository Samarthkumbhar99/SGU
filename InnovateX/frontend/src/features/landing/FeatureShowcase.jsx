import { useState } from 'react'
import {
  ShieldCheck,
  Cpu,
  Clock,
  Sparkles,
  FileCheck2,
  Boxes,
  Network,
  Truck,
  Layers,
  Check,
  ArrowRight,
  Database,
  GitBranch,
} from 'lucide-react'

const PILLARS = [
  {
    id: 'milp',
    title: 'Google OR-Tools MILP Engine',
    subtitle: 'Zero Phantom Inventory. Guaranteed Global Optimality.',
    icon: Cpu,
    color: '#0284c7',
    tagline: 'Solves N^M distribution search spaces in ≤ 2.0s',
    points: [
      'Strict conservation of flow across DC docks and transit lanes',
      'Mathematical global minimum on freight cost and residual shortages',
      'Zero phantom stock guarantee: every suggested box is physically verified',
      'Hard vehicle volume and weight constraint bounds adhered to 100%',
    ],
    mathFormulation: [
      { rule: 'Objective', expr: 'minimize ∑ c(w,s) · x(w,s,p) + ∑ P_short · shortage(s,p)', note: 'Global cost minimization' },
      { rule: 'DC Capacity', expr: '∑ x(w,s,p) ≤ WarehouseSupply(w,p)  ∀ w, p', note: 'No phantom inventory' },
      { rule: 'Store Demand', expr: '∑ x(w,s,p) + shortage(s,p) ≥ StoreDemand(s,p)  ∀ s, p', note: 'Safety stock fulfillment' },
      { rule: 'Vehicle Volume', expr: '∑ volume(p) · x(w,s,p) ≤ TruckMaxVolume(w,s)  ∀ w, s', note: 'Physical dock bounds' },
    ],
  },
  {
    id: 'integrity',
    title: '12-Point Data Integrity Gate',
    subtitle: 'Rejects corrupted ERP tables before solver execution.',
    icon: ShieldCheck,
    color: '#0284c7',
    tagline: 'Validates multi-echelon feeds in milliseconds',
    points: [
      'Validates node coordinates, non-negative stock counts, and positive transit hours',
      'Detects cyclic lane dependencies and orphaned retail stores',
      'Strict schema enforcement via Zod with human-readable error diagnostics',
      'Auto-flags batch expiry records with missing or inconsistent timestamps',
    ],
    mathFormulation: [
      { rule: 'Rule 01 — Non-Negativity', expr: 'Stock(w,p) ≥ 0, Demand(s,p) ≥ 0', note: 'Sanity verification' },
      { rule: 'Rule 04 — Coordinate Bounds', expr: '-90 ≤ Latitude ≤ +90, -180 ≤ Longitude ≤ +180', note: 'Geo-routing validation' },
      { rule: 'Rule 07 — Transit Positivity', expr: 'TransitHours(w,s) > 0.0', note: 'Prevents zero-time loops' },
      { rule: 'Rule 12 — Timestamp Consistency', expr: 'BatchExpiry > BatchCreationTimestamp', note: 'FEFO lifecycle gate' },
    ],
  },
  {
    id: 'fefo',
    title: 'Dynamic FEFO Expiry Rescue',
    subtitle: 'First-Expired, First-Out routing driven by store sales velocity.',
    icon: Clock,
    color: '#0284c7',
    tagline: 'Prevents perishables from decaying in warehouse bays',
    points: [
      'Guarantees shelf life constraint: (Transit Time + Dwell Time < Expiry Date)',
      'Automatically shunts aging batches to high-velocity metropolitan stores',
      'Reduces supermarket spoiled returns and write-downs by up to 85%',
      'Generates automated pick-list slips prioritized by batch expiration date',
    ],
    mathFormulation: [
      { rule: 'Shelf-Life Bound', expr: 'TransitHours(w,s) + DwellHours(s) < ExpiryHours(b)', note: 'Strict arrival condition' },
      { rule: 'Velocity Matching', expr: 'StoreSalesVelocity(s,p) ≥ MinDepletionRate(b)', note: 'Fast depletion store routing' },
      { rule: 'Pick-List Sort', expr: 'SortAscending(BatchExpiryDate, FIFO_Fallback)', note: 'Automated dock dispatch slip' },
    ],
  },
  {
    id: 'explainer',
    title: 'Evidence-Grounded AI Explainer',
    subtitle: 'Zero hallucinations. Directly cites mathematical solver deltas.',
    icon: Sparkles,
    color: '#0284c7',
    tagline: 'Translates dual variables and shadow costs into human ops rationale',
    points: [
      'Grounded strictly on OR-Tools constraint deltas with temperature = 0.0',
      'Explains why alternate hubs were chosen over primary routes with dollar clarity',
      'Synthesizes executive summaries for Ops Managers and DC dock supervisors',
      'Includes RFC 4180 CSV export and printable dispatch pick slips',
    ],
    mathFormulation: [
      { rule: 'Delta Citation', expr: 'ΔCost = Cost_Rescued - Cost_Baseline', note: 'Explicit dollar delta' },
      { rule: 'Shadow Price', expr: 'DualVariable(CapacityConstraint_DC1)', note: 'Marginal value of bottleneck' },
      { rule: 'Grounding Rule', expr: 'StrictContextBound(SolverLogVector, Temp=0.0)', note: 'Zero-hallucination verification' },
    ],
  },
]

export default function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState(0)
  const pillar = PILLARS[activeTab]
  const Icon = pillar.icon

  return (
    <section className="py-24 bg-slate-50/70 border-y border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            Mathematical Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-slate-900 tracking-tight leading-tight">
            Engineered for{' '}
            <span className="font-cursive text-sky-600 font-semibold italic text-[1.08em] px-1">
              zero tolerance
            </span>{' '}
            in FMCG logistics
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Unlike heuristic schedulers that leave trucks half-empty or ungrounded generative models that invent inventory,
            SupplyShield AI operates with deterministic mathematical proofs.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {PILLARS.map((p, idx) => {
            const isSelected = idx === activeTab
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {p.title}
              </button>
            )
          })}
        </div>

        {/* Enterprise Spec Sheet Card (Clean Light Aesthetic) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Operational Description */}
          <div className="p-8 sm:p-10 lg:col-span-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shadow-xs">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {pillar.tagline}
                </span>
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                {pillar.title}
              </h3>
              <p className="text-sm font-medium text-slate-600 mb-6">{pillar.subtitle}</p>

              <div className="space-y-3.5 mb-8">
                {pillar.points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Hard Capacity Bounds
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Network className="w-4 h-4 text-sky-600" /> Multi-Depot Transits
              </span>
            </div>
          </div>

          {/* Right: Clean Formulation Blueprint (Not a dark code editor, a clean spec ledger!) */}
          <div className="p-8 sm:p-10 lg:col-span-5 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-sky-600" />
                  Mathematical Proof Model
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  0.0% Optimality Gap
                </span>
              </div>

              {/* Formulation Cards */}
              <div className="space-y-3">
                {pillar.mathFormulation.map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-900">{m.rule}</span>
                      <span className="text-[10px] text-slate-400">{m.note}</span>
                    </div>
                    <div className="font-mono text-xs text-sky-800 font-semibold bg-sky-50/60 px-2 py-1.5 rounded-lg border border-sky-100 overflow-x-auto">
                      {m.expr}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Solver Standard: Google OR-Tools v9.8</span>
              <span className="font-semibold text-slate-700">RFC 4180 Ingestion</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
