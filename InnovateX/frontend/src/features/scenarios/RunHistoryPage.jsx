import { useState, useEffect } from 'react'
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Cpu,
  Layers,
  DollarSign,
  Percent,
} from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { optimizationAPI } from '../../services/api.js'
import { ProvenanceBadge, ProvenanceDisclosureBanner } from '../../components/ui/ProvenanceBadge.jsx'

export default function RunHistoryPage() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedRun, setSelectedRun] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchRuns = async (pageNum = page, type = selectedType) => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page: pageNum,
        limit: 15,
      }
      if (type !== 'ALL') {
        params.runType = type
      }

      const res = await optimizationAPI.getRuns(params)
      if (res.data?.success) {
        setRuns(res.data.data || [])
        setTotalPages(res.data.pagination?.pages || 1)
        setTotalCount(res.data.pagination?.total || 0)
      } else {
        setError('Failed to load optimization run history.')
      }
    } catch (err) {
      setError('Error loading runs from MongoDB. Ensure backend is operational.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRuns(page, selectedType)
  }, [page, selectedType])

  const handleInspectRun = async (runId) => {
    setDetailLoading(true)
    try {
      const res = await optimizationAPI.getRunById(runId)
      if (res.data?.success) {
        setSelectedRun(res.data.data)
      }
    } catch (err) {
      // Fallback
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <AppLayout breadcrumbs={['History & Audit', 'Optimization Runs']}>
      <div className="space-y-5">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Optimization & Simulation Run History
              </h1>
              <ProvenanceBadge type="historical" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Immutable audit ledger of all solved distribution dispatches and stress-tested disruption scenarios.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            Total Logged Runs: <span className="text-slate-900 dark:text-white font-bold">{totalCount}</span>
          </div>
        </div>

        {/* Provenance Disclosure */}
        <ProvenanceDisclosureBanner message="All runs are persisted in MongoDB `OptimizationRun` collection. Proposed allocations are audit-only recommendations and do not overwrite warehouse stock records." />

        {/* Filters and Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Filter by Run Type:</span>
            {['ALL', 'solve', 'simulate'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  selectedType === type
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {type === 'ALL' ? 'All Runs' : type === 'solve' ? 'Optimizations' : 'Simulations'}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchRuns(page, selectedType)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Runs Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Run Identifier</th>
                  <th className="py-2.5 px-4">Execution Timestamp</th>
                  <th className="py-2.5 px-4">Run Type</th>
                  <th className="py-2.5 px-4">Scenario / Objective</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Runtime</th>
                  <th className="py-2.5 px-4 text-right">Transport Cost</th>
                  <th className="py-2.5 px-4 text-right">Fulfillment</th>
                  <th className="py-2.5 px-4 text-center">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {runs.length > 0 ? (
                  runs.map((r) => {
                    const isOptimal = r.status === 'OPTIMAL'
                    const cost = r.metrics?.optimizedTransportCost ?? r.total_transport_cost ?? 0
                    const fulfill = r.metrics?.demandFulfillmentRatePct ?? r.demand_fulfillment_rate ?? 100.0

                    return (
                      <tr key={r.runId || r._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {r.runId}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {new Date(r.createdAt || r.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.runType === 'simulate'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            }`}
                          >
                            {r.runType}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          {r.scenarioName || 'Baseline Optimization'}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOptimal
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-500 font-mono">
                          {(r.solverRuntimeSeconds || 0).toFixed(3)}s
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white font-mono">
                          ${cost.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-600 font-mono">
                          {fulfill.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => handleInspectRun(r.runId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400">
                      {loading ? 'Querying MongoDB run ledger...' : 'No optimization or simulation runs recorded yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Page <strong className="text-slate-800 dark:text-slate-200">{page}</strong> of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Run Detail Modal */}
        {selectedRun && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl max-w-lg w-full space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Run Audit: {selectedRun.runId}</h3>
                </div>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Scenario Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRun.scenarioName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Solver Engine:</span>
                  <span>{selectedRun.solver || 'Google OR-Tools CP-SAT'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status & Feasibility:</span>
                  <span className="font-bold text-emerald-600">{selectedRun.status} (Feasible)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Solver Runtime:</span>
                  <span>{(selectedRun.solverRuntimeSeconds || 0).toFixed(3)} seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Optimized Freight Cost:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    ${(selectedRun.metrics?.optimizedTransportCost || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Demand Fulfillment:</span>
                  <span className="font-bold text-emerald-600">
                    {(selectedRun.metrics?.demandFulfillmentRatePct || 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {selectedRun.resilienceInsights && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 space-y-1">
                  <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">Resilience Insights</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {selectedRun.resilienceInsights.primary_bottleneck}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    {selectedRun.resilienceInsights.executive_summary}
                  </div>
                </div>
              )}

              {selectedRun.allocationsSample?.length > 0 && (
                <div className="space-y-2">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Dispatched Allocations Sample ({selectedRun.allocationsSample.length} rows):
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="p-1.5">Route</th>
                          <th className="p-1.5">SKU</th>
                          <th className="p-1.5 text-right">Units</th>
                          <th className="p-1.5 text-right">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedRun.allocationsSample.map((a, i) => (
                          <tr key={i}>
                            <td className="p-1.5">{a.warehouse_id} → {a.store_id}</td>
                            <td className="p-1.5 font-mono text-blue-600">{a.product_id}</td>
                            <td className="p-1.5 text-right font-bold">{a.allocated_units}</td>
                            <td className="p-1.5 text-right">${(a.total_transport_cost || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedRun(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
