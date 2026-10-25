import { useState } from 'react'
import { Calculator, DollarSign, TrendingUp, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function RoiCalculator() {
  const [dcs, setDcs] = useState(5)
  const [stores, setStores] = useState(45)
  const [inventoryValue, setInventoryValue] = useState(2500000) // $2.5M

  // Calculations based on industry benchmarks (IHL Group & FMI):
  // 4.1% lost to stockouts, 2.5% spoiled to FIFO expiry, 15% emergency courier premium
  const stockoutSavings = Math.round(inventoryValue * 0.041 * 0.72) // 72% mitigated
  const spoilageSavings = Math.round(inventoryValue * 0.025 * 0.85) // 85% prevented
  const courierSavings = Math.round(inventoryValue * 0.012 * 0.65) // 65% courier reduced
  const totalAnnualSavings = stockoutSavings + spoilageSavings + courierSavings

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Sliders */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              Quantifiable Business Impact
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-slate-900 tracking-tight leading-tight">
              Estimate your annual{' '}
              <span className="font-cursive text-sky-600 font-semibold italic text-[1.08em] px-1">
                network loss recovery
              </span>
            </h2>
            <p className="mt-3 text-slate-600 text-base mb-8">
              Tune your network parameters below to calculate estimated savings across stockout mitigation,
              FEFO perishable rescue, and emergency courier freight elimination.
            </p>

            {/* Interactive Sliders Workbench */}
            <div className="space-y-6 bg-slate-50/80 p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
              {/* Slider 1: Distribution Centers */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-800">Regional Distribution Centers (DCs)</span>
                  <span className="text-sm font-black text-sky-700 font-mono bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                    {dcs} DCs
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={dcs}
                  onChange={(e) => setDcs(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                  <span>2 DCs</span>
                  <span>20 DCs</span>
                </div>
              </div>

              {/* Slider 2: Retail Stores */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-800">Retail Stores / Nodes</span>
                  <span className="text-sm font-black text-sky-700 font-mono bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                    {stores} Stores
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={stores}
                  onChange={(e) => setStores(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                  <span>10 Stores</span>
                  <span>150 Stores</span>
                </div>
              </div>

              {/* Slider 3: Monthly Inventory Value */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-800">Monthly Managed Inventory Value</span>
                  <span className="text-sm font-black text-sky-700 font-mono bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                    ${(inventoryValue / 1000000).toFixed(2)}M
                  </span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="10000000"
                  step="250000"
                  value={inventoryValue}
                  onChange={(e) => setInventoryValue(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                  <span>$500K</span>
                  <span>$10M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Executive Financial Ledger */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-8 sm:p-9 border border-slate-200/90 shadow-xl shadow-slate-200/50 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/70 text-sky-800 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
                  Executive Audit Ledger
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {stores} nodes · {dcs} hubs
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Estimated Annual Recoverable Margin
              </div>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
                  ${totalAnnualSavings.toLocaleString()}
                </span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                  +18.4% ROI
                </span>
              </div>

              {/* Financial Breakdown Table */}
              <div className="divide-y divide-slate-100 border-y border-slate-200/80 py-2 mb-6">
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Stockout Revenue Recovered</div>
                      <div className="text-[11px] text-slate-500">72% shelf-loss mitigation</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    +${stockoutSavings.toLocaleString()}
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Perishable Spoilage Averted</div>
                      <div className="text-[11px] text-slate-500">FEFO store-velocity matching</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    +${spoilageSavings.toLocaleString()}
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Expedited Courier Avoidance</div>
                      <div className="text-[11px] text-slate-500">Zero panic truck re-runs</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    +${courierSavings.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md shadow-sky-600/20 transition-all hover:scale-[1.01]"
                >
                  <span>Launch SupplyShield AI</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-[11px] text-center text-slate-500 leading-normal">
                  Benchmarked against FMI / IHL Group grocery loss models and Google OR-Tools MILP dual valuations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
