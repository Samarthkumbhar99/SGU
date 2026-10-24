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
  ArrowRight,
  Check,
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
    codeSnippet: `minimize: sum(c[w,s] * x[w,s,p]) + sum(P_short * s[s,p])
subject to:
  sum(x[w,s,p]) <= Supply[w,p]       (Dock capacity)
  sum(x[w,s,p]) + s[s,p] >= Demand   (Demand fulfillment)
  sum(vol[p] * x) <= TruckMaxVol     (Hard vehicle bound)`,
  },
  {
    id: 'integrity',
    title: '12-Point Data Integrity Gate',
    subtitle: 'Rejects corrupted ERP tables before solver execution.',
    icon: ShieldCheck,
    color: '#10b981',
    tagline: 'Validates multi-echelon feeds in milliseconds',
    points: [
      'Validates node coordinates, non-negative stock counts, and positive transit hours',
      'Detects cyclic lane dependencies and orphaned retail stores',
      'Strict schema enforcement via Zod with human-readable error diagnostics',
      'Auto-flags batch expiry records with missing or inconsistent timestamps',
    ],
    codeSnippet: `gate = IntegrityGate()
results = gate.validate_network(warehouses, stores, lanes)
if not results.is_valid:
    return reject_plan(errors=results.flags)
# Passed 12/12 gates -> Proceed to MILP solver`,
  },
  {
    id: 'fefo',
    title: 'Dynamic FEFO Expiry Rescue',
    subtitle: 'First-Expired, First-Out routing driven by store sales velocity.',
    icon: Clock,
    color: '#f59e0b',
    tagline: 'Prevents perishables from decaying in warehouse bays',
    points: [
      'Guarantees shelf life constraint: (Transit Time + Dwell Time < Expiry Date)',
      'Automatically shunts aging batches to high-velocity metropolitan stores',
      'Reduces supermarket spoiled returns and write-downs by up to 85%',
      'Generates automated pick-list slips prioritized by batch expiration date',
    ],
    codeSnippet: `for batch in inventory:
    usable_days = batch.expiry - (now + lane.transit_hours)
    if usable_days < product.min_shelf_life:
        flag_for_express_rescue(batch, target=high_velocity_nodes)`,
  },
  {
    id: 'explainer',
    title: 'Evidence-Grounded AI Explainer',
    subtitle: 'Zero hallucinations. Directly cites mathematical solver deltas.',
    icon: Sparkles,
    color: '#8b5cf6',
    tagline: 'Translates dual variables and shadow costs into human ops rationale',
    points: [
      'Grounded strictly on OR-Tools constraint deltas with temperature = 0.0',
      'Explains why alternate hubs were chosen over primary routes with dollar clarity',
      'Synthesizes executive summaries for Ops Managers and DC dock supervisors',
      'Includes RFC 4180 CSV export and printable dispatch pick slips',
    ],
    codeSnippet: `explanation = explainer.synthesize(
    delta_vector=solution.deltas,
    disruption=event.metadata,
    grounding_rules=STRICT_SOLVER_CITATIONS
)`,
  },
]

export default function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState(0)
  const pillar = PILLARS[activeTab]
  const Icon = pillar.icon

  return (
    <section className="py-24 bg-slate-50 border-y border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            Architectural Supremacy
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Engineered for zero tolerance in FMCG logistics
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Unlike heuristic schedulers that leave trucks half-empty or black-box neural networks that hallucinate phantom inventory,
            SupplyShield AI operates with pure mathematical determinism and explainable verification.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {PILLARS.map((p, idx) => {
            const PIcon = p.icon
            const isSelected = idx === activeTab
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/15 scale-105'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <PIcon className="w-4 h-4" style={{ color: isSelected ? '#38bdf8' : p.color }} />
                <span>{p.title}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content Box */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Detail Column */}
          <div className="p-8 sm:p-12 lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: pillar.color }}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {pillar.tagline}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                {pillar.title}
              </h3>
              <p className="text-base font-medium text-sky-800 mb-6">{pillar.subtitle}</p>

              <div className="space-y-3.5 mb-8">
                {pillar.points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className="text-sm text-slate-700 leading-relaxed font-normal">{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Production Verified
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Network className="w-4 h-4 text-sky-500" /> Multi-Echelon Ready
              </span>
            </div>
          </div>

          {/* Right: Code & Model Logic Preview */}
          <div className="bg-slate-950 p-8 sm:p-10 lg:col-span-5 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-800 text-slate-200 font-mono text-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-bold">
                Constraint Formulation
              </span>
            </div>
            <pre className="overflow-x-auto text-sky-300 leading-relaxed font-mono">
              <code>{pillar.codeSnippet}</code>
            </pre>
            <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 font-sans">
              <span>Optimization Standard: Google OR-Tools v9.8</span>
              <span className="text-emerald-400 font-semibold font-mono">0.0% Gap</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
