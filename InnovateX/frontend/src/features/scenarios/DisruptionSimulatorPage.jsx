import { useState, useEffect } from 'react'
import {
  AlertOctagon,
  Play,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Layers,
  ArrowRight,
  Info,
  Sliders,
  FileText,
} from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { optimizationAPI } from '../../services/api.js'
import { ProvenanceBadge, ProvenanceDisclosureBanner } from '../../components/ui/ProvenanceBadge.jsx'

const PRESET_SCENARIOS = [
  {
    id: 'SCN-001',
    name: 'North Lane Closure',
    type: 'route_closure',
    target: 'WH-NORTH__STORE-01',
    description: 'Complete shutdown of northern transportation corridor to Retail Outlet 01.',
  },
  {
    id: 'SCN-002',
    name: 'South Corridor Capacity Choke',
    type: 'lane_capacity_reduction',
    target: 'WH-SOUTH__STORE-04',
    changeValue: 0.50,
    description: '50% throughput reduction on southern freight lane due to highway congestion.',
  },
  {
    id: 'SCN-003',
    name: 'Western Demand Surge',
    type: 'demand_spike',
    target: 'STORE-01',
    changeValue: 0.30,
    description: '30% unexpected retail demand surge at Store 01.',
  },
]

export default function DisruptionSimulatorPage() {
  const [selectedPreset, setSelectedPreset] = useState('SCN-001')
  const [horizonDays, setHorizonDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [simulationResult, setSimulationResult] = useState(null)

  const handleSimulate = async (presetId = selectedPreset) => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        presetScenarioId: presetId,
        horizonDays: Number(horizonDays),
      }

      const res = await optimizationAPI.simulate(payload)
      if (res.data?.success && res.data.data) {
        setSimulationResult(res.data.data)
      } else {
        setError(res.data?.message || 'Scenario simulation failed.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Failed to execute disruption simulation.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Run SCN-001 initially on mount
  useEffect(() => {
    handleSimulate('SCN-001')
  }, [])

  return (
    <AppLayout breadcrumbs={['Adaptive Rescue', 'Disruption Simulator']}>
      <div className="space-y-5">
        {/* Header Title & Provenance Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Disruption Simulator & Resilience Replay
              </h1>
              <ProvenanceBadge type="disrupted" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Stress-test network resilience against warehouse outages, route closures, throughput reductions, and demand surges.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300">
              In-Memory Cloned Sandbox
            </span>
          </div>
        </div>

        {/* Provenance Disclosure */}
        <ProvenanceDisclosureBanner message="Simulation shocks evaluate cloned network topologies in memory. Disrupted dispatch allocations do NOT overwrite live inventory or change historical records." />

        {/* Preset Disruption Scenario Selector Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-500" />
              <span>Select Benchmark Disruption Shock</span>
            </div>
            <span className="text-slate-400 font-normal">Deterministic shock profiles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRESET_SCENARIOS.map((scenario) => {
              const isSelected = selectedPreset === scenario.id
              return (
                <div
                  key={scenario.id}
                  onClick={() => {
                    setSelectedPreset(scenario.id)
                    handleSimulate(scenario.id)
                  }}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/40 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{scenario.id}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{scenario.type.replace('_', ' ')}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{scenario.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{scenario.description}</p>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Evaluating under {horizonDays}-day planning horizon
            </span>

            <button
              onClick={() => handleSimulate(selectedPreset)}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating Resilience Recovery...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Re-Run Simulation Shock</span>
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
        </div>

        {/* Simulation Results Side-by-Side Comparison */}
        {simulationResult && (
          <div className="space-y-4">
            {/* Impact Metric Delta Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Freight Cost Delta */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Freight Cost Impact</span>
                  <DollarSign className="w-4 h-4 text-rose-500" />
                </div>
                <div className="mt-2 text-xl font-bold text-rose-600 dark:text-rose-400">
                  +₹{simulationResult.delta_metrics.transport_cost_delta_dollars.toFixed(2)}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Baseline: ₹{simulationResult.baseline_plan.total_transport_cost.toFixed(2)}</span>
                  <span>Disrupted: ₹{simulationResult.disrupted_plan.total_transport_cost.toFixed(2)}</span>
                </div>
              </div>

              {/* Demand Fulfillment Rate */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Service Level Maintained</span>
                  <Shield className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-2 text-xl font-bold text-emerald-600">
                  {simulationResult.disrupted_plan.demand_fulfillment_rate.toFixed(1)}%
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Delta: {simulationResult.delta_metrics.fulfillment_rate_delta_pct.toFixed(1)}%</span>
                  <span>Absorbed without outage</span>
                </div>
              </div>

              {/* Net Additional Shortage */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Additional Unmet Shortage</span>
                  <AlertOctagon className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  {simulationResult.delta_metrics.unmet_demand_delta_units} units
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Rerouted stock covered requirements
                </div>
              </div>

              {/* Solver Resilience Status */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Disrupted Plan Feasibility</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                </div>
                <div className="mt-2 text-xl font-bold text-blue-600">
                  {simulationResult.resilience_insights.solver_status}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {simulationResult.disrupted_feasibility.violations_count} constraint violations
                </div>
              </div>
            </div>

            {/* Resilience Insights Narrative Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3 text-xs">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Resilience Analysis & Root-Cause Bottleneck</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-1.5">
                <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  Identified Bottleneck
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {simulationResult.resilience_insights.primary_bottleneck}
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs pt-1">
                  {simulationResult.resilience_insights.executive_summary}
                </div>
              </div>

              {/* Affected Entities Chips */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="text-slate-500 font-medium">Affected Network Entities:</span>
                {simulationResult.affected_entities.lanes?.map((l) => (
                  <span key={l} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-mono text-[11px] border border-rose-200 dark:border-rose-900">
                    Lane: {l}
                  </span>
                ))}
                {simulationResult.affected_entities.stores?.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-mono text-[11px] border border-amber-200 dark:border-amber-900">
                    Store: {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Disrupted Plan Allocations */}
            {simulationResult.disrupted_allocations?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden text-xs">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Rescued Dispatch Allocations ({simulationResult.disrupted_allocations.length} records)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Active rerouted shipments</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Origin Hub</th>
                        <th className="py-2.5 px-4">Destination Outlet</th>
                        <th className="py-2.5 px-4">SKU</th>
                        <th className="py-2.5 px-4 text-right">Rerouted Units</th>
                        <th className="py-2.5 px-4 text-right">Freight Rate</th>
                        <th className="py-2.5 px-4 text-right">Total Freight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {simulationResult.disrupted_allocations.map((a, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{a.warehouse_id}</td>
                          <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{a.store_id}</td>
                          <td className="py-2.5 px-4 font-mono font-medium text-blue-600">{a.product_id}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">{a.allocated_units} units</td>
                          <td className="py-2.5 px-4 text-right text-slate-500">${a.unit_transport_cost.toFixed(2)}</td>
                          <td className="py-2.5 px-4 text-right font-semibold text-emerald-600">${a.total_transport_cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
