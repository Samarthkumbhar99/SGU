import { useState } from 'react'
import { Users, Truck, ShieldAlert, LineChart, CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const PERSONAS = [
  {
    id: 'ops',
    name: 'Vikram Malhotra',
    role: 'Distribution Operations Manager',
    tagline: 'Instant disruption re-routing & cost control',
    pain: 'When a regional highway shuts down or an unexpected blizzard hits, legacy ERPs take 24 to 48 hours to re-plan dispatches. Stores stock out by 8 AM while planners drown in spreadsheets.',
    solution:
      'SupplyShield AI detects node outages, checks fleet capacity bounds, and outputs a clean, balanced dispatch re-routing in under 2.8 seconds, keeping retail shelves 100% full.',
    stats: [
      { label: 'Re-planning Speed', val: '< 2.8s', delta: 'vs 36h in ERP' },
      { label: 'Store Fill Rate', val: '99.4%', delta: '+4.2% lift' },
      { label: 'Freight Waste', val: '-28%', delta: 'Less panic expediting' },
    ],
    avatarBg: '#0284c7',
  },
  {
    id: 'batch',
    name: 'Rajesh Nair',
    role: 'Warehouse Batch & FEFO Controller',
    tagline: 'Strict FEFO expiry compliance & dock limits',
    pain: 'Standard FIFO warehouse systems ship oldest stock to nearest stores regardless of sales velocity. Perishables arrive with only 3 days of shelf life and get dumped as spoiled write-downs.',
    solution:
      'Dynamic FEFO intelligence prioritizes batches by expiry date, matching aging stock to high-velocity metropolitan retail stores where (Transit + Dwell Time < Expiry).',
    stats: [
      { label: 'Perishable Waste', val: '-85%', delta: 'Write-downs averted' },
      { label: 'Min Shelf Life', val: '7+ Days', delta: 'Guaranteed at dock' },
      { label: 'Phantom Stock', val: '0 Units', delta: '100% physically real' },
    ],
    avatarBg: '#f59e0b',
  },
  {
    id: 'analyst',
    name: 'Ananya Roy',
    role: 'Chief Supply Chain Analyst',
    tagline: 'Baseline vs. Rescue trade-off analytics & grounded auditability',
    pain: 'Senior management demands explanations for every extra logistics dollar spent during emergencies. Black-box AI tools cannot justify why specific routes were chosen.',
    solution:
      'Zero-hallucination grounded AI explanations directly cite mathematical solver deltas, dual variables, and shadow prices so every single dollar spent is auditable and defensible.',
    stats: [
      { label: 'Explanation Accuracy', val: '100%', delta: 'Zero AI hallucinations' },
      { label: 'Audit Compliance', val: 'ISO/RFC', delta: 'Standardized logs' },
      { label: 'Planner Hours Saved', val: '18h/wk', delta: 'Automated triage' },
    ],
    avatarBg: '#8b5cf6',
  },
]

export default function PersonaSection() {
  const [activePersona, setActivePersona] = useState(0)
  const persona = PERSONAS[activePersona]

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Users className="w-3.5 h-3.5 text-sky-600" />
            Built for Real Operations
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-slate-900 tracking-tight leading-tight">
            Designed for the three{' '}
            <span className="font-cursive text-sky-600 font-semibold italic text-[1.08em] px-1">
              operational leaders
            </span>{' '}
            who keep supply chains moving
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            From the high-pressure warehouse loading dock to executive quarterly reviews, SupplyShield AI aligns the entire operational team.
          </p>
        </div>

        {/* Persona Selector Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {PERSONAS.map((p, idx) => {
            const isSelected = idx === activePersona
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePersona(idx)}
                className={`p-6 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/80 shadow-md ring-2 ring-sky-200/70 scale-[1.01]'
                    : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
                    style={{ backgroundColor: p.avatarBg }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{p.name}</h4>
                    <span className="text-xs text-sky-700 font-semibold">{p.role}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{p.tagline}</p>
              </button>
            )
          })}
        </div>

        {/* Active Persona Deep Dive (Professional Enterprise Spec) */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Story & Solution */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-800 text-xs font-bold uppercase tracking-wider mb-4">
                <span className="w-2 h-2 rounded-full bg-sky-600" />
                Operational Role Blueprint
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">{persona.name}</h3>
              <p className="text-sm font-semibold text-sky-700 mb-6">{persona.role}</p>

              <div className="space-y-4 mb-8">
                {/* Challenge Card */}
                <div className="bg-rose-50/60 rounded-2xl p-5 border border-rose-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wider mb-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    The Operational Vulnerability
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{persona.pain}</p>
                </div>

                {/* Solution Card */}
                <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    How SupplyShield Solves It
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{persona.solution}</p>
                </div>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-sky-600/20 transition-all hover:scale-[1.01]"
              >
                <span>Experience {persona.name.split(' ')[0]}'s Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Impact Metrics (Crisp Enterprise Monospace Cards) */}
            <div className="lg:col-span-5 grid grid-cols-1 gap-4">
              {persona.stats.map((st, i) => (
                <div
                  key={i}
                  className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{st.label}</span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-0.5 block">
                      {st.val}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-full border border-emerald-200/80">
                    {st.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
