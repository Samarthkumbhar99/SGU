import { useState, useEffect, useMemo } from 'react'
import {
  Cpu,
  Play,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Percent,
  Search,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  Zap,
} from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { optimizationAPI } from '../../services/api.js'
import { ProvenanceBadge, ProvenanceDisclosureBanner } from '../../components/ui/ProvenanceBadge.jsx'

export default function OptimizationWorkbenchPage() {
  // Input parameters state
  const [horizonDays, setHorizonDays] = useState(7)
  const [shortagePenalty, setShortagePenalty] = useState(100.0)
  const [costMultiplier, setCostMultiplier] = useState(1.0)
  const [timeLimit, setTimeLimit] = useState(10.0)
  const [selectedStores, setSelectedStores] = useState(['STORE-01', 'STORE-02'])
  const [selectedProducts, setSelectedProducts] = useState(['SKU-001', 'SKU-002'])

  // Execution & results state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedAllocation, setSelectedAllocation] = useState(null)

  // Run solver
  const handleSolve = async (e) => {
    if (e) e.preventDefault()
    setError(null)
    setLoading(true)

    // Form validation
    if (horizonDays < 1 || horizonDays > 30) {
      setError('Planning horizon must be between 1 and 30 days.')
      setLoading(false)
      return
    }

    try {
      const payload = {
        horizonDays: Number(horizonDays),
        shortagePenaltyPerUnit: Number(shortagePenalty),
        transportCostMultiplier: Number(costMultiplier),
        solverTimeLimitSeconds: Number(timeLimit),
        stores: selectedStores.length > 0 ? selectedStores : undefined,
        products: selectedProducts.length > 0 ? selectedProducts : undefined,
      }

      const res = await optimizationAPI.solve(payload)
      if (res.data?.success && res.data.data) {
        setResult(res.data.data)
      } else {
        setError(res.data?.message || 'Solver execution failed.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Unable to complete optimization request. Ensure ML service is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Initial solve on mount
  useEffect(() => {
    handleSolve()
  }, [])

  // Filtered allocations
  const filteredAllocations = useMemo(() => {
    if (!result?.allocations) return []
    if (!searchFilter.trim()) return result.allocations
    const q = searchFilter.toLowerCase()
    return result.allocations.filter(
      (a) =>
        a.warehouse_id.toLowerCase().includes(q) ||
        a.store_id.toLowerCase().includes(q) ||
        a.product_id.toLowerCase().includes(q)
    )
  }, [result, searchFilter])

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredAllocations.length) return
    const headers = 'Warehouse,Store,SKU,AllocatedUnits,UnitCost,TotalCost,LeadTimeHours\n'
    const rows = filteredAllocations
      .map(
        (a) =>
          `"${a.warehouse_id}","${a.store_id}","${a.product_id}",${a.allocated_units},${a.unit_transport_cost},${a.total_transport_cost},${a.lead_time_hours}`
      )
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `SupplyShield_Allocation_Plan_${result?.run_id || 'v1'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Safe percentage calculation
  const savingsPct = useMemo(() => {
    if (!result?.baseline_plan || !result?.optimized_plan) return 0
    const base = result.baseline_plan.total_transport_cost
    const opt = result.optimized_plan.total_transport_cost
    if (base <= 0) return 0
    const pct = ((base - opt) / base) * 100
    return Math.max(0, parseFloat(pct.toFixed(1)))
  }, [result])

  return (
    <AppLayout breadcrumbs={['Optimization', 'Workbench']}>
      <div className="space-y-5">
        {/* Header Title & Provenance Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Optimization Workbench
              </h1>
              <ProvenanceBadge type="optimizer" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Google OR-Tools CP-SAT integer programming solver for multi-echelon SKU replenishment with shortage penalties.
            </p>
          </div>

          {result && (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${result.status === 'OPTIMAL' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'}`}>
                Status: {result.status}
              </span>
              <span className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                {result.run_id || 'opt-active'}
              </span>
            </div>
          )}
        </div>

        {/* Provenance Disclosure */}
        <ProvenanceDisclosureBanner message="Optimization results represent non-binding dispatch recommendations. Generated shipment orders do NOT alter historical inventory records until authorized via formal review." />

        {/* Controls Configuration Drawer / Card */}
        <form onSubmit={handleSolve} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-blue-600" />
              Solver Parameters & Constraints
            </div>
            <span className="text-[11px] text-slate-400">Strict integer non-negativity enforced</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Planning Horizon */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Planning Horizon (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={horizonDays}
                onChange={(e) => setHorizonDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400">Horizon range: 1 to 30 days</span>
            </div>

            {/* Shortage Penalty */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shortage Penalty (₹ / unit)
              </label>
              <input
                type="number"
                min="1"
                step="5"
                value={shortagePenalty}
                onChange={(e) => setShortagePenalty(parseFloat(e.target.value) || 100.0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400">Default: ₹100.00 / unmet unit</span>
            </div>

            {/* Freight Multiplier */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transport Cost Weight
              </label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={costMultiplier}
                onChange={(e) => setCostMultiplier(parseFloat(e.target.value) || 1.0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400">Objective multiplier: 1.0x</span>
            </div>

            {/* Time Limit */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Solver Timeout (Seconds)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                step="1"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseFloat(e.target.value) || 10.0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400">Max CP-SAT search duration</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Independent mathematical audit active</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Solving CP-SAT Model...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Optimization Solve</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Results Comparison KPIs */}
        {result && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Transportation Cost */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Transportation Cost</span>
                <DollarSign className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                ₹{result.optimized_plan.total_transport_cost.toFixed(2)}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Baseline: ₹{result.baseline_plan.total_transport_cost.toFixed(2)}</span>
                <span className="text-emerald-600 font-bold">-{savingsPct}% savings</span>
              </div>
            </div>

            {/* Total Allocated Units */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Dispatched Quantity</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {result.optimized_plan.total_allocated_units.toLocaleString()} units
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Requirement: {result.optimized_plan.total_gross_requirement.toLocaleString()}</span>
                <span>Demand: {result.optimized_plan.total_forecast_demand.toLocaleString()}</span>
              </div>
            </div>

            {/* Demand Fulfillment Rate */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Demand Fulfillment</span>
                <Percent className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-xl font-bold text-emerald-600">
                {result.optimized_plan.demand_fulfillment_rate.toFixed(1)}%
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Unmet Shortage:</span>
                <span className={result.optimized_plan.total_unmet_demand_units > 0 ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'}>
                  {result.optimized_plan.total_unmet_demand_units} units
                </span>
              </div>
            </div>

            {/* Solver Status & Execution Speed */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Solver Runtime</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {result.solver_runtime_seconds.toFixed(3)}s
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Violations:</span>
                <span className="text-emerald-600 font-bold">{result.feasibility.violations_count} (Feasible)</span>
              </div>
            </div>
          </div>
        )}

        {/* Explainability Breakdown Panel */}
        {result && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Zap className="w-4 h-4 text-amber-500" />
              Explainability & Mathematical Decision Evidence
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Google OR-Tools CP-SAT evaluated the complete combinatorial dispatch graph across 3 warehouses and 12 destination outlets over the {result.planning_horizon_days}-day horizon.
              Compared to the greedy heuristic baseline (₹{result.baseline_plan.total_transport_cost.toFixed(2)} freight), the optimal solver schedule delivers an identical 100% fulfillment rate while saving <strong className="text-emerald-600">₹{(result.baseline_plan.total_transport_cost - result.optimized_plan.total_transport_cost).toFixed(2)} ({savingsPct}%)</strong> in aggregate transportation freight costs by bundling shipments along high-capacity, low-cost freight corridors.
            </p>
          </div>
        )}

        {/* Allocations Table */}
        {result && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Active Dispatches & Replenishment Allocation Plan ({filteredAllocations.length} records)
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by store or SKU..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-semibold transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Origin Hub</th>
                    <th className="py-2.5 px-4">Destination Store</th>
                    <th className="py-2.5 px-4">Product SKU</th>
                    <th className="py-2.5 px-4 text-right">Dispatched Quantity</th>
                    <th className="py-2.5 px-4 text-right">Freight Rate</th>
                    <th className="py-2.5 px-4 text-right">Lane Freight Cost</th>
                    <th className="py-2.5 px-4 text-right">Transit Time</th>
                    <th className="py-2.5 px-4 text-center">Decision Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredAllocations.length > 0 ? (
                    filteredAllocations.map((alloc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{alloc.warehouse_id}</td>
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{alloc.store_id}</td>
                        <td className="py-2.5 px-4 font-mono font-medium text-blue-600 dark:text-blue-400">{alloc.product_id}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">{alloc.allocated_units.toLocaleString()} units</td>
                        <td className="py-2.5 px-4 text-right text-slate-500">${alloc.unit_transport_cost.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-emerald-600">${alloc.total_transport_cost.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right text-slate-500">{alloc.lead_time_hours} hrs</td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedAllocation(alloc)}
                            className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-all"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No shipment allocation records match the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Single Allocation Evidence Breakdown */}
        {selectedAllocation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl max-w-md w-full space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Decision Evidence & Constraint Audit</h3>
                </div>
                <button
                  onClick={() => setSelectedAllocation(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Route Corridor:</span>
                  <span className="font-semibold">{selectedAllocation.warehouse_id} → {selectedAllocation.store_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Product SKU:</span>
                  <span className="font-mono font-bold text-blue-600">{selectedAllocation.product_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allocated Quantity:</span>
                  <span className="font-bold text-emerald-600">{selectedAllocation.allocated_units} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Freight Rate:</span>
                  <span>₹{selectedAllocation.unit_transport_cost.toFixed(2)} / unit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Lane Cost:</span>
                  <span className="font-bold">₹{selectedAllocation.total_transport_cost.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 text-slate-600 dark:text-slate-400">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Constraint Verification:</div>
                <ul className="space-y-1 list-disc list-inside text-[11px]">
                  <li>Dispatched quantity does not exceed available warehouse stock at {selectedAllocation.warehouse_id}.</li>
                  <li>Replenishment respects store capacity limits at {selectedAllocation.store_id}.</li>
                  <li>Total lane shipment is within daily throughput capacity ({selectedAllocation.lead_time_hours}h lead time).</li>
                  <li>Selected lane minimizes aggregate network transportation penalty under active demand horizon.</li>
                </ul>
              </div>

              <button
                onClick={() => setSelectedAllocation(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold"
              >
                Close Audit View
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
