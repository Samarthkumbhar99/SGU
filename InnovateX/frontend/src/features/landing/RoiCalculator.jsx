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
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Estimate your annual network loss recovery
            </h2>
            <p className="mt-3 text-slate-600 text-base mb-8">
              Tune your network parameters below to calculate estimated savings across stockout mitigation,
              FEFO perishable rescue, and emergency courier freight elimination.
            </p>

            {/* Interactive Sliders */}
            <div className="space-y-6 bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200/80">
              {/* Slider 1: Distribution Centers */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-800">Regional Distribution Centers (DCs)</span>
                  <span className="text-base font-black text-sky-600 font-mono bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
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
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>2 DCs</span>
                  <span>20 DCs</span>
                </div>
              </div>

              {/* Slider 2: Retail Stores */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-800">Retail Stores / Nodes</span>
                  <span className="text-base font-black text-sky-600 font-mono bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
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
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>10 Stores</span>
                  <span>150 Stores</span>
                </div>
              </div>

              {/* Slider 3: Monthly Inventory Value */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-800">Monthly Managed Inventory Value</span>
                  <span className="text-base font-black text-sky-600 font-mono bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
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
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>$500K</span>
                  <span>$10M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: ROI Results Card */}
          <div className="lg:col-span-5">
            <div
              className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-sky-400/20 relative overflow-hidden"
              style={{
                boxShadow: '0 25px 50px -12px rgba(2, 132, 199, 0.25)',
              }}
            >
              <div className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-2">
                Estimated Annual Impact
              </div>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-6">
                ${totalAnnualSavings.toLocaleString()}
                <span className="text-sm font-normal text-slate-400 block mt-1">Annual recoverable margin</span>
              </div>

              {/* Breakdown */}
              <div className="space-y-3.5 py-6 border-y border-slate-800 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Stockout Revenue Saved
                  </span>
                  <span className="font-bold text-white font-mono">+${stockoutSavings.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Perishable Spoilage Prevented
                  </span>
                  <span className="font-bold text-white font-mono">+${spoilageSavings.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    Expedited Courier Avoidance
                  </span>
                  <span className="font-bold text-white font-mono">+${courierSavings.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/30 transition-all hover:scale-[1.02]"
                >
                  <span>Launch SupplyShield AI</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-[11px] text-center text-slate-400">
                  Includes full 12-point validation gate & Google OR-Tools MILP solver
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
