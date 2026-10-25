import { useState, useEffect } from 'react'
import {
  X,
  Warehouse,
  Store,
  Layers,
  Zap,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { getInventoryScale, INVENTORY_SCALE_TIERS } from '../../utils/inventoryScale.js'

export default function InventoryShelfModal({
  isOpen,
  onClose,
  node,
  onTriggerRescue,
}) {
  const [activeScale, setActiveScale] = useState(null)

  const invInfo = getInventoryScale(node)

  // Sync activeScale with node's natural scale whenever node opens
  useEffect(() => {
    if (node) {
      const info = getInventoryScale(node)
      setActiveScale(info.scale)
    }
  }, [node])

  if (!isOpen || !node) return null

  const displayScale = activeScale || invInfo.scale
  const currentTier = INVENTORY_SCALE_TIERS[displayScale - 1]
  const isNaturalScale = displayScale === invInfo.scale

  const isStore =
    node.type === 'Retail Store' ||
    node.type === 'Store' ||
    String(node.name || '').toLowerCase().includes('store')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md ${
                isStore ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
            >
              {isStore ? <Store size={22} /> : <Warehouse size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {node.name || node.shortCode || node.id}
                </h2>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider"
                  style={{
                    backgroundColor: currentTier.badgeBg,
                    color: currentTier.badgeColor,
                    borderColor: currentTier.borderColor,
                  }}
                >
                  {currentTier.shortLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isStore ? 'Retail Store Front' : 'Regional Warehouse DC'} • 3D Shelving Rack Visualizer
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main 3D Shelf Image Render */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner group">
            <img
              src={`/stocks/${displayScale}.png`}
              alt={`3D Inventory Shelf Scale ${displayScale} of 7`}
              className="w-full h-64 sm:h-72 object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                // Fallback to public root if needed
                if (!e.target.dataset.triedFallback) {
                  e.target.dataset.triedFallback = 'true'
                  e.target.src = `/${displayScale}.png`
                }
              }}
            />

            {/* Overlaid Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-slate-900/90 text-white backdrop-blur-md shadow-md border border-white/10 flex items-center gap-1.5">
                <Layers size={13} className="text-sky-400" />
                <span>Level {displayScale} of 7</span>
              </span>
              <span
                className="px-2.5 py-1 rounded-xl text-xs font-bold border shadow-sm backdrop-blur-md"
                style={{
                  backgroundColor: currentTier.badgeBg,
                  color: currentTier.badgeColor,
                  borderColor: currentTier.borderColor,
                }}
              >
                {currentTier.range}
              </span>
            </div>

            {/* Live Indicator overlay */}
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 backdrop-blur-md shadow-xs border border-slate-200/60 dark:border-slate-700">
                {isNaturalScale ? '● Live Telemetry Match' : 'Simulating Scale'}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-xs border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-white">{currentTier.title}</span>
                <p className="text-[11px] text-slate-300 mt-0.5">{currentTier.description}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <span className="text-sm font-black text-amber-300 font-mono">
                  {invInfo.percent}%
                </span>
                <span className="text-[10px] text-slate-400 block">Actual Fullness</span>
              </div>
            </div>
          </div>

          {/* 7-Level Scale Interactive Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Full 7-Tier Inventory Scale (Click to inspect each stage)
              </span>
              {displayScale !== invInfo.scale && (
                <button
                  type="button"
                  onClick={() => setActiveScale(invInfo.scale)}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
                >
                  Reset to Live Level ({invInfo.scale}/7)
                </button>
              )}
            </div>

            <div className="grid grid-cols-7 gap-1.5 p-2 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              {INVENTORY_SCALE_TIERS.map((tier) => {
                const isSelected = displayScale === tier.scale
                const isActual = invInfo.scale === tier.scale
                return (
                  <button
                    key={tier.scale}
                    type="button"
                    onClick={() => setActiveScale(tier.scale)}
                    className={`relative p-2 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 shadow-md ring-2 ring-sky-500 scale-105 z-10'
                        : 'hover:bg-white/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: tier.barColor }}
                    />
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {tier.scale}
                    </span>
                    <span className="text-[9px] text-slate-500 hidden sm:block truncate w-full">
                      {tier.range}
                    </span>
                    {isActual && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -top-1 -right-1 ring-2 ring-white" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Stock On-Hand</span>
              <strong className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                {invInfo.stockOnHand.toLocaleString()}
              </strong>
              <span className="text-[10px] text-slate-400 block">units in racks</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Maximum Capacity</span>
              <strong className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                {invInfo.capacity.toLocaleString()}
              </strong>
              <span className="text-[10px] text-slate-400 block">max bay limits</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Weekly Velocity</span>
              <strong className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                {(node.weeklyDemand || 1420).toLocaleString()}
              </strong>
              <span className="text-[10px] text-slate-400 block">u/week demand</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Days of Supply</span>
              <strong className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                {node.daysOfSupply ? `${node.daysOfSupply}d` : '14.2d'}
              </strong>
              <span className="text-[10px] text-slate-400 block">before run-out</span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span>Geographic Node:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {node.coordinates ? `${node.coordinates[1].toFixed(3)}°N, ${node.coordinates[0].toFixed(3)}°E` : 'Active'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isStore && (
              <button
                type="button"
                onClick={() => {
                  if (onTriggerRescue) {
                    onTriggerRescue(node)
                  }
                  onClose()
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
              >
                <Zap size={14} />
                <span>⚡ Auto-Rescue Store</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
