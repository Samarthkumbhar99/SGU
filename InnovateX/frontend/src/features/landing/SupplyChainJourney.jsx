import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronDown, CheckCircle2, ArrowRight, X } from 'lucide-react'

// Supply Chain Tier Data matching the exact 5 cards in the reference image
const SUPPLY_CHAIN_TIERS = [
  {
    id: 'raw-material',
    title: 'Raw material',
    hasSolutions: false,
    headerBg: 'bg-slate-100/70',
    solutions: [
      'Inbound agricultural & ingredient lead-time buffers',
      'Supplier harvest volatility & crop yield tracking',
      'Quality grading & temperature threshold validation',
    ],
    route: '/inventory',
    // 2x2 Produce Cluster: Strawberry, Carrot, Apple, Broccoli
    renderIcon: () => (
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Strawberry (Top-Left) */}
        <g transform="translate(6, 6) scale(0.7)">
          <path d="M12 2C6.5 2 4 6 4 12C4 18 10 22 12 23C14 22 20 18 20 12C20 6 17.5 2 12 2Z" fill="#EF4444" />
          {/* Strawberry leaves */}
          <path d="M12 2C10 0 7 1 6 3M12 2C14 0 17 1 18 3M12 2V0" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
          {/* Seeds */}
          <circle cx="9" cy="8" r="0.6" fill="#FEF08A" />
          <circle cx="15" cy="8" r="0.6" fill="#FEF08A" />
          <circle cx="12" cy="12" r="0.6" fill="#FEF08A" />
          <circle cx="9" cy="16" r="0.6" fill="#FEF08A" />
          <circle cx="15" cy="16" r="0.6" fill="#FEF08A" />
        </g>

        {/* Carrot (Top-Right) */}
        <g transform="translate(24, 4) rotate(22) scale(0.68)">
          <path d="M12 4C8 4 6 8 8 16L12 26L16 16C18 8 16 4 12 4Z" fill="#F97316" />
          {/* Carrot ridges */}
          <path d="M8.5 10H14M9.5 15H14.5M10.5 20H13.5" stroke="#EA580C" strokeWidth="1" strokeLinecap="round" />
          {/* Carrot top leaves */}
          <path d="M12 4V0M12 4C10 2 8 2 7 1M12 4C14 2 16 2 17 1" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Apple (Bottom-Left) */}
        <g transform="translate(6, 22) scale(0.7)">
          <path d="M12 5C7 5 4 8.5 4 14C4 19.5 8 23 12 23C16 23 20 19.5 20 14C20 8.5 17 5 12 5Z" fill="#DC2626" />
          <path d="M12 5C11 2 13 1 14 0" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M14 2C16 2 17 3 17 4C17 5 15 5 14 2Z" fill="#4ADE80" />
        </g>

        {/* Broccoli (Bottom-Right) */}
        <g transform="translate(22, 22) scale(0.72)">
          {/* Stalk */}
          <path d="M10 14H14V22C14 23 13 24 12 24C11 24 10 23 10 22V14Z" fill="#86EFAC" />
          {/* Florets */}
          <circle cx="8" cy="11" r="4.5" fill="#15803D" />
          <circle cx="16" cy="11" r="4.5" fill="#15803D" />
          <circle cx="12" cy="7" r="5" fill="#16A34A" />
          <circle cx="12" cy="12" r="3.5" fill="#166534" />
        </g>
      </svg>
    ),
  },
  {
    id: 'manufacturers',
    title: 'Manufacturers',
    hasSolutions: true,
    headerBg: 'bg-sky-100/70',
    solutions: [
      'Multi-SKU batch production scheduling & lot sizing',
      'Production downtime & changeover cost minimization',
      'Packaging line constraints & supplier replenishment sync',
      'Dynamic Bill of Materials (BOM) safety-buffer modeling',
    ],
    route: '/inventory',
    // Factory Silhouette
    renderIcon: () => (
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Factory base & saw-tooth roof */}
        <path
          d="M8 38V22L16 27V22L24 27V12H34V38H8Z"
          fill="#1E40AF"
        />
        {/* Chimney / tall smokestack */}
        <rect x="36" y="8" width="5" height="30" fill="#2563EB" rx="1" />
        {/* Windows */}
        <rect x="11" y="30" width="3" height="3" fill="#93C5FD" rx="0.5" />
        <rect x="16" y="30" width="3" height="3" fill="#93C5FD" rx="0.5" />
        <rect x="21" y="30" width="3" height="3" fill="#93C5FD" rx="0.5" />
        <rect x="26" y="30" width="3" height="3" fill="#93C5FD" rx="0.5" />
        <rect x="11" y="34" width="3" height="2" fill="#93C5FD" rx="0.5" />
        <rect x="16" y="34" width="3" height="2" fill="#93C5FD" rx="0.5" />
        <rect x="21" y="34" width="3" height="2" fill="#93C5FD" rx="0.5" />
        <rect x="26" y="34" width="3" height="2" fill="#93C5FD" rx="0.5" />
        <rect x="28" y="16" width="3" height="8" fill="#93C5FD" rx="0.5" />
      </svg>
    ),
  },
  {
    id: 'distributors',
    title: 'Distributors',
    hasSolutions: true,
    headerBg: 'bg-sky-100/70',
    solutions: [
      'Google OR-Tools MILP regional routing & cross-docking',
      'Dynamic FEFO allocation to prioritize high-velocity depots',
      'Fleet capacity constraints & multi-temperature transport',
      'Disruption mitigation: 2.8s re-solve on highway closures',
    ],
    route: '/network-map',
    // Delivery Truck / Fleet Van Silhouette
    renderIcon: () => (
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main Cargo Box */}
        <rect x="6" y="16" width="23" height="17" rx="2" fill="#1E40AF" />
        {/* Truck Cab */}
        <path
          d="M29 19H34.5C36 19 37.2 19.8 38 21.2L41 26.5V33H29V19Z"
          fill="#1E40AF"
        />
        {/* Windshield */}
        <path
          d="M30.5 21H34.2L36.8 26H30.5V21Z"
          fill="#93C5FD"
          rx="1"
        />
        {/* Headlight */}
        <rect x="39" y="28" width="2" height="2" rx="0.5" fill="#FEF08A" />
        {/* Wheels */}
        <circle cx="14" cy="34" r="4.5" fill="#0F172A" />
        <circle cx="14" cy="34" r="2" fill="#94A3B8" />
        <circle cx="34" cy="34" r="4.5" fill="#0F172A" />
        <circle cx="34" cy="34" r="2" fill="#94A3B8" />
      </svg>
    ),
  },
  {
    id: 'retailers',
    title: 'Retailers',
    hasSolutions: true,
    headerBg: 'bg-sky-100/70',
    solutions: [
      'Point-of-Sale (POS) shelf replenishment sync',
      'Elimination of phantom stockouts via barcode telemetry',
      'Store-level promotional demand spike absorption',
      'Markdown reduction by matching expiry to foot-traffic',
    ],
    route: '/inventory-table',
    // Storefront with Awning
    renderIcon: () => (
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Store Awning */}
        <path d="M10 16L12 22H36L38 16H10Z" fill="#1E40AF" />
        {/* Awning Stripes */}
        <path d="M14 16L15.5 22H18.5L17.5 16H14Z" fill="#93C5FD" />
        <path d="M22 16L23 22H26L25.5 16H22Z" fill="#93C5FD" />
        <path d="M30 16L30.5 22H33.5L33.5 16H30Z" fill="#93C5FD" />
        {/* Store Wall */}
        <rect x="12" y="22" width="24" height="15" fill="#DBEAFE" />
        {/* Store Door */}
        <rect x="16" y="27" width="5" height="10" fill="#1E40AF" />
        <rect x="17" y="28" width="1.5" height="4" fill="#93C5FD" />
        {/* Store Window */}
        <rect x="24" y="25" width="10" height="7" fill="#93C5FD" rx="1" />
        <line x1="29" y1="25" x2="29" y2="32" stroke="#1E40AF" strokeWidth="1" />
        <line x1="24" y1="28.5" x2="34" y2="28.5" stroke="#1E40AF" strokeWidth="1" />
        {/* Foundation */}
        <rect x="10" y="37" width="28" height="2" fill="#1E40AF" rx="0.5" />
      </svg>
    ),
  },
  {
    id: 'consumers',
    title: 'Consumers',
    hasSolutions: false,
    headerBg: 'bg-slate-100/70',
    solutions: [
      'Guaranteed freshness index on perishable staples',
      '100% on-shelf availability for preferred brands',
      'Zero expired goods reaching consumer households',
    ],
    route: '/network-explorer',
    // Supermarket Shelves / Stocked Goods
    renderIcon: () => (
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shelf Frame */}
        <rect x="8" y="10" width="32" height="2" fill="#1E40AF" rx="1" />
        <rect x="8" y="20" width="32" height="2" fill="#1E40AF" rx="1" />
        <rect x="8" y="30" width="32" height="2" fill="#1E40AF" rx="1" />
        <rect x="8" y="40" width="32" height="2" fill="#1E40AF" rx="1" />
        <rect x="8" y="10" width="2" height="32" fill="#1E40AF" />
        <rect x="38" y="10" width="2" height="32" fill="#1E40AF" />
        {/* Top Shelf Items (Boxes) */}
        <rect x="12" y="13" width="5" height="7" fill="#2563EB" rx="0.5" />
        <rect x="18" y="14" width="4" height="6" fill="#3B82F6" rx="0.5" />
        <rect x="23" y="13" width="7" height="7" fill="#1D4ED8" rx="0.5" />
        <rect x="31" y="14" width="5" height="6" fill="#60A5FA" rx="0.5" />
        {/* Middle Shelf Items */}
        <rect x="12" y="23" width="6" height="7" fill="#1D4ED8" rx="0.5" />
        <rect x="19" y="24" width="4" height="6" fill="#60A5FA" rx="0.5" />
        <rect x="24" y="23" width="5" height="7" fill="#2563EB" rx="0.5" />
        <rect x="30" y="23" width="6" height="7" fill="#3B82F6" rx="0.5" />
        {/* Bottom Shelf Items */}
        <rect x="12" y="33" width="8" height="7" fill="#3B82F6" rx="0.5" />
        <rect x="21" y="34" width="5" height="6" fill="#2563EB" rx="0.5" />
        <rect x="27" y="33" width="4" height="7" fill="#60A5FA" rx="0.5" />
        <rect x="32" y="33" width="4" height="7" fill="#1D4ED8" rx="0.5" />
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
    <section className="relative w-full py-8 sm:py-12 bg-white select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Optional Section Tag */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-xs font-extrabold uppercase tracking-widest text-sky-800 bg-sky-50 inline-block px-3.5 py-1 rounded-full border border-sky-100">
            End-to-End Distribution Chain
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
                  className={`relative flex-1 w-full bg-white rounded-2xl sm:rounded-[22px] border transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[220px] sm:min-h-[235px] ${
                    isOpen
                      ? 'border-sky-500 shadow-xl shadow-sky-900/10 ring-2 ring-sky-400/20'
                      : 'border-slate-200/90 shadow-md shadow-slate-200/50 hover:shadow-lg hover:border-slate-300'
                  } ${tier.hasSolutions ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {/* Top Area: Smooth curved convex background with icon */}
                  <div
                    className={`relative w-full h-[120px] sm:h-[128px] ${tier.headerBg} rounded-b-[40px] flex items-center justify-center p-4 transition-colors`}
                  >
                    <div className="transform transition-transform duration-300 hover:scale-110">
                      {tier.renderIcon()}
                    </div>
                  </div>

                  {/* Bottom Area: Title + Optional 'View solutions ⌵' Link */}
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
                        <span>View solutions</span>
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
                  <div className="hidden lg:flex items-center justify-center z-10 shrink-0 mx-[-12px]">
                    <div className="w-7 h-7 rounded-full bg-white border border-slate-200/90 shadow-sm flex items-center justify-center text-slate-700 hover:text-sky-600 transition-all">
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
          <div className="mt-6 bg-gradient-to-r from-sky-50 via-white to-sky-50/50 rounded-2xl border border-sky-200/80 p-5 sm:p-6 shadow-lg shadow-sky-900/5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700 font-bold text-xs">
                  {activeTier.title} Solutions
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  SupplyShield AI deterministic operations suite
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTierId(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
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
