import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronDown, CheckCircle2, ArrowRight, X } from 'lucide-react'

// Supply Chain Tier Data matching the exact 5 cards in the reference image
const SUPPLY_CHAIN_TIERS = [
  {
    id: 'raw-material',
    title: 'Raw material',
    hasSolutions: false,
    headerBg: 'bg-[#f1f5f9]',
    solutions: [
      'Inbound agricultural & ingredient lead-time buffers',
      'Supplier harvest volatility & crop yield tracking',
      'Quality grading & temperature threshold validation',
    ],
    route: '/inventory',
    // 2x2 Produce Cluster: Strawberry, Carrot, Apple, Broccoli
    renderIcon: () => (
      <svg viewBox="0 0 54 54" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Strawberry (Top-Left) */}
        <g transform="translate(8, 7) scale(0.8)">
          <path d="M12 2C6.5 2 4 6 4 12C4 18 10 22 12 23C14 22 20 18 20 12C20 6 17.5 2 12 2Z" fill="#E11D48" />
          {/* Leaves */}
          <path d="M12 2C10 0 7 1 6 3M12 2C14 0 17 1 18 3M12 2V0" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" />
          {/* Seeds */}
          <circle cx="8" cy="8" r="0.7" fill="#FEF08A" />
          <circle cx="16" cy="8" r="0.7" fill="#FEF08A" />
          <circle cx="12" cy="12" r="0.7" fill="#FEF08A" />
          <circle cx="8" cy="16" r="0.7" fill="#FEF08A" />
          <circle cx="16" cy="16" r="0.7" fill="#FEF08A" />
        </g>

        {/* Carrot (Top-Right) */}
        <g transform="translate(28, 5) rotate(22) scale(0.78)">
          <path d="M12 4C8 4 6 8 8 16L12 26L16 16C18 8 16 4 12 4Z" fill="#F97316" />
          {/* Ridges */}
          <path d="M8.5 10H14M9.5 15H14.5M10.5 20H13.5" stroke="#EA580C" strokeWidth="1.2" strokeLinecap="round" />
          {/* Leaves */}
          <path d="M12 4V0M12 4C10 2 8 2 7 1M12 4C14 2 16 2 17 1" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Apple (Bottom-Left) */}
        <g transform="translate(8, 25) scale(0.8)">
          <path d="M12 5C7 5 4 8.5 4 14C4 19.5 8 23 12 23C16 23 20 19.5 20 14C20 8.5 17 5 12 5Z" fill="#DC2626" />
          <path d="M12 5C11 2 13 1 14 0" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 2C16 2 17 3 17 4C17 5 15 5 14 2Z" fill="#22C55E" />
        </g>

        {/* Broccoli (Bottom-Right) */}
        <g transform="translate(26, 25) scale(0.82)">
          {/* Stalk */}
          <path d="M10 14H14V22C14 23 13 24 12 24C11 24 10 23 10 22V14Z" fill="#86EFAC" />
          {/* Florets */}
          <circle cx="8" cy="11" r="5" fill="#15803D" />
          <circle cx="16" cy="11" r="5" fill="#15803D" />
          <circle cx="12" cy="7" r="5.5" fill="#16A34A" />
          <circle cx="12" cy="12" r="4" fill="#166534" />
        </g>
      </svg>
    ),
  },
  {
    id: 'manufacturers',
    title: 'Manufacturers',
    hasSolutions: true,
    headerBg: 'bg-[#e5f1fb]',
    solutions: [
      'Multi-SKU batch production scheduling & lot sizing',
      'Production downtime & changeover cost minimization',
      'Packaging line constraints & supplier replenishment sync',
      'Dynamic Bill of Materials (BOM) safety-buffer modeling',
    ],
    route: '/inventory',
    // Factory Silhouette exactly like reference image
    renderIcon: () => (
      <svg viewBox="0 0 54 54" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Factory base & sawtooth peaks */}
        <path
          d="M9 41V24L18 29V24L27 29V14H38V41H9Z"
          fill="#1E4287"
        />
        {/* Chimney / tall stack */}
        <rect x="40" y="10" width="5" height="31" fill="#2563EB" rx="1" />
        {/* Windows */}
        <rect x="12" y="32" width="3.5" height="3.5" fill="#BFDBFE" rx="0.5" />
        <rect x="18" y="32" width="3.5" height="3.5" fill="#BFDBFE" rx="0.5" />
        <rect x="24" y="32" width="3.5" height="3.5" fill="#BFDBFE" rx="0.5" />
        <rect x="30" y="32" width="3.5" height="3.5" fill="#BFDBFE" rx="0.5" />
        <rect x="12" y="36.5" width="3.5" height="2.5" fill="#BFDBFE" rx="0.5" />
        <rect x="18" y="36.5" width="3.5" height="2.5" fill="#BFDBFE" rx="0.5" />
        <rect x="24" y="36.5" width="3.5" height="2.5" fill="#BFDBFE" rx="0.5" />
        <rect x="30" y="36.5" width="3.5" height="2.5" fill="#BFDBFE" rx="0.5" />
        <rect x="31" y="18" width="4" height="9" fill="#BFDBFE" rx="0.5" />
      </svg>
    ),
  },
  {
    id: 'distributors',
    title: 'Distributors',
    hasSolutions: true,
    headerBg: 'bg-[#e5f1fb]',
    solutions: [
      'Google OR-Tools MILP regional routing & cross-docking',
      'Dynamic FEFO allocation to prioritize high-velocity depots',
      'Fleet capacity constraints & multi-temperature transport',
      'Disruption mitigation: 2.8s re-solve on highway closures',
    ],
    route: '/network-map',
    // Delivery Van / Logistics Truck Silhouette exactly like reference image
    renderIcon: () => (
      <svg viewBox="0 0 54 54" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main Cargo Container */}
        <rect x="7" y="18" width="26" height="18" rx="2" fill="#1E4287" />
        {/* Truck Front Cab */}
        <path
          d="M33 21H39C40.6 21 42 22 42.8 23.5L46 29.5V36H33V21Z"
          fill="#1E4287"
        />
        {/* Windshield */}
        <path
          d="M34.5 23H38.5L41.5 28.5H34.5V23Z"
          fill="#BFDBFE"
          rx="1"
        />
        {/* Headlight beam */}
        <rect x="44" y="30.5" width="2.5" height="2.5" rx="0.5" fill="#FDE047" />
        {/* Front Wheel */}
        <circle cx="16" cy="37" r="5" fill="#0F172A" />
        <circle cx="16" cy="37" r="2.2" fill="#94A3B8" />
        {/* Rear Wheel */}
        <circle cx="39" cy="37" r="5" fill="#0F172A" />
        <circle cx="39" cy="37" r="2.2" fill="#94A3B8" />
      </svg>
    ),
  },
  {
    id: 'retailers',
    title: 'Retailers',
    hasSolutions: true,
    headerBg: 'bg-[#e5f1fb]',
    solutions: [
      'Point-of-Sale (POS) shelf replenishment sync',
      'Elimination of phantom stockouts via barcode telemetry',
      'Store-level promotional demand spike absorption',
      'Markdown reduction by matching expiry to foot-traffic',
    ],
    route: '/inventory-table',
    // Storefront with Awning exactly like reference image
    renderIcon: () => (
      <svg viewBox="0 0 54 54" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Awning Roof */}
        <path d="M11 18L13.5 24.5H40.5L43 18H11Z" fill="#1E4287" />
        {/* Awning Light Blue Stripes */}
        <path d="M15.5 18L17.5 24.5H21L19.5 18H15.5Z" fill="#BFDBFE" />
        <path d="M25 18L26 24.5H29.5L29 18H25Z" fill="#BFDBFE" />
        <path d="M34 18L34.5 24.5H38L37.5 18H34Z" fill="#BFDBFE" />
        {/* Storefront Wall */}
        <rect x="13.5" y="24.5" width="27" height="16.5" fill="#DBEAFE" />
        {/* Door */}
        <rect x="17.5" y="29.5" width="6" height="11.5" fill="#1E4287" />
        <rect x="18.5" y="30.5" width="2" height="5" fill="#BFDBFE" />
        {/* Large Window */}
        <rect x="27" y="27.5" width="11" height="8.5" fill="#BFDBFE" rx="1" />
        <line x1="32.5" y1="27.5" x2="32.5" y2="36" stroke="#1E4287" strokeWidth="1.2" />
        <line x1="27" y1="31.5" x2="38" y2="31.5" stroke="#1E4287" strokeWidth="1.2" />
        {/* Foundation */}
        <rect x="11" y="41" width="32" height="2.5" fill="#1E4287" rx="0.5" />
      </svg>
    ),
  },
  {
    id: 'consumers',
    title: 'Consumers',
    hasSolutions: false,
    headerBg: 'bg-[#f1f5f9]',
    solutions: [
      'Guaranteed freshness index on perishable staples',
      '100% on-shelf availability for preferred brands',
      'Zero expired goods reaching consumer households',
    ],
    route: '/network-explorer',
    // Supermarket Shelves exactly like reference image
    renderIcon: () => (
      <svg viewBox="0 0 54 54" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shelving Frame */}
        <rect x="9" y="11" width="36" height="2.5" fill="#1E4287" rx="1" />
        <rect x="9" y="22" width="36" height="2.5" fill="#1E4287" rx="1" />
        <rect x="9" y="33" width="36" height="2.5" fill="#1E4287" rx="1" />
        <rect x="9" y="43" width="36" height="2.5" fill="#1E4287" rx="1" />
        <rect x="9" y="11" width="2.5" height="34.5" fill="#1E4287" />
        <rect x="42.5" y="11" width="2.5" height="34.5" fill="#1E4287" />
        {/* Top Shelf Products */}
        <rect x="14" y="14.5" width="5.5" height="7.5" fill="#2563EB" rx="0.5" />
        <rect x="21" y="15.5" width="4.5" height="6.5" fill="#3B82F6" rx="0.5" />
        <rect x="27" y="14.5" width="7.5" height="7.5" fill="#1D4ED8" rx="0.5" />
        <rect x="36" y="15.5" width="5" height="6.5" fill="#60A5FA" rx="0.5" />
        {/* Middle Shelf Products */}
        <rect x="14" y="25.5" width="6.5" height="7.5" fill="#1D4ED8" rx="0.5" />
        <rect x="22" y="26.5" width="4.5" height="6.5" fill="#60A5FA" rx="0.5" />
        <rect x="28" y="25.5" width="5.5" height="7.5" fill="#2563EB" rx="0.5" />
        <rect x="35" y="25.5" width="6.5" height="7.5" fill="#3B82F6" rx="0.5" />
        {/* Bottom Shelf Products */}
        <rect x="14" y="36.5" width="8.5" height="6.5" fill="#3B82F6" rx="0.5" />
        <rect x="24" y="37.5" width="5.5" height="5.5" fill="#2563EB" rx="0.5" />
        <rect x="31" y="36.5" width="4.5" height="6.5" fill="#60A5FA" rx="0.5" />
        <rect x="37" y="36.5" width="4.5" height="6.5" fill="#1D4ED8" rx="0.5" />
      </svg>
    ),
  },
]

export default function SupplyChainJourney() {
  const [activeTierId, setActiveTierId] = useState(null)

  const activeTier = SUPPLY_CHAIN_TIERS.find((t) => t.id === activeTierId)

  const handleToggle = (tierId, hasSolutions) => {
    if (!hasSolutions) return
    setActiveTierId((prev) => (prev === tierId ? null : tierId))
  }

  return (
    <section className="relative w-full py-12 sm:py-16 bg-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading: How SupplyShield Works */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-sky-800 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            End-to-End FMCG Distribution Network
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-slate-900 tracking-tight leading-tight">
            How{' '}
            <span className="font-cursive text-sky-600 font-semibold italic text-[1.08em] px-1">
              SupplyShield
            </span>{' '}
            Works
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto mt-2.5 leading-relaxed">
            From raw ingredient harvest to consumer pantries, deterministic optimization synchronizes every tier in real time.
          </p>
        </div>

        {/* 5-Card Horizontal Supply Chain Grid with Connectors */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-0 relative">
          {SUPPLY_CHAIN_TIERS.map((tier, idx) => {
            const isLast = idx === SUPPLY_CHAIN_TIERS.length - 1
            const isOpen = activeTierId === tier.id

            return (
              <div key={tier.id} className="w-full lg:w-auto flex-1 flex items-center">
                {/* Single Supply Chain Step Card */}
                <div
                  onClick={() => tier.hasSolutions && handleToggle(tier.id, tier.hasSolutions)}
                  className={`relative flex-1 w-full bg-white rounded-2xl sm:rounded-[26px] border transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[240px] sm:min-h-[255px] ${
                    isOpen
                      ? 'border-sky-500 shadow-xl shadow-sky-900/10 ring-2 ring-sky-400/25'
                      : 'border-slate-200/90 shadow-md shadow-slate-200/40 hover:shadow-lg hover:border-slate-300'
                  } ${tier.hasSolutions ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {/* Top Area: Smooth curved convex background with centered icon */}
                  <div
                    className={`relative w-full h-[130px] sm:h-[140px] ${tier.headerBg} rounded-b-[48px] flex items-center justify-center p-4 transition-colors`}
                  >
                    <div className="transform transition-transform duration-300 hover:scale-110">
                      {tier.renderIcon()}
                    </div>
                  </div>

                  {/* Bottom Area: Centered bold title + Optional 'View solutions ⌵' Link */}
                  <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                      {tier.title}
                    </h3>

                    {tier.hasSolutions ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggle(tier.id, true)
                        }}
                        className="mt-2.5 inline-flex items-center gap-1 text-xs sm:text-[13px] font-semibold text-sky-600 hover:text-sky-700 transition-colors cursor-pointer group"
                      >
                        <span className="hover:underline">View solutions</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-sky-700' : 'group-hover:translate-y-0.5'
                          }`}
                        />
                      </button>
                    ) : (
                      // Spacer to ensure identical card height
                      <div className="h-5 mt-2.5" />
                    )}
                  </div>
                </div>

                {/* Connecting Right-Arrow Badge between cards (hidden after the last card) */}
                {!isLast && (
                  <div className="hidden lg:flex items-center justify-center z-10 shrink-0 mx-[-14px]">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-sky-600 transition-all">
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Interactive Expandable Solution Drawer */}
        {activeTier && (
          <div className="mt-8 bg-gradient-to-r from-sky-50 via-white to-sky-50/50 rounded-2xl border border-sky-200/80 p-5 sm:p-6 shadow-xl shadow-sky-900/5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-sky-100 mb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-sky-100 text-sky-800 font-bold text-xs uppercase tracking-wider">
                  {activeTier.title} Operational Suite
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  SupplyShield AI deterministic solver solutions
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTierId(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {activeTier.solutions.map((sol, sIdx) => (
                <div key={sIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{sol}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2">
              <Link
                to={activeTier.route}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-all hover:scale-102"
              >
                <span>Launch {activeTier.title} Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
