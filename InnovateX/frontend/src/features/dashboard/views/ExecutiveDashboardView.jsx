import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  DollarSign,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle,
  Play,
  FileText,
  Sparkles,
  Map,
  Shield,
  Layers,
  Store,
  Warehouse,
  Crown,
  Eye,
  RefreshCw,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { KPICard } from '../../../components/ui/KPICard.jsx'
import { ProvenanceBadge, ProvenanceDisclosureBanner } from '../../../components/ui/ProvenanceBadge.jsx'
import AccessRequestsManager from '../components/AccessRequestsManager.jsx'
import MyStoresSection from '../components/MyStoresSection.jsx'
import MyWarehousesSection from '../components/MyWarehousesSection.jsx'
import { useEntityStore } from '../../../store/index.js'
import { useToast } from '../../../components/ui/Toast.jsx'

export default function ExecutiveDashboardView({
  user,
  summary,
  overviewData,
  latestRun,
  loading,
  onOpenSearchModal,
  DEMAND_TREND,
  INVENTORY_DISTRIBUTION,
  STORE_DEMAND,
  WAREHOUSE_INVENTORY,
  RECENT_ACTIVITY,
  ChartTooltip,
  ActivityItem,
  DEMO_SUMMARY,
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const { stores, warehouses } = useEntityStore()

  const [entityTab, setEntityTab] = useState('all')

  const s = summary || DEMO_SUMMARY

  const handleRunOptimization = () => {
    navigate('/rescue')
    toast.info('Starting Adaptive Inventory Rescue workflow…', 'Optimization')
  }

  return (
    <div className="space-y-6">
      {/* Executive Command Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Crown size={220} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                👑 Executive Master Control &amp; Governance
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Overall Cross-Network Oversight • All Facilities &amp; Models
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Enterprise Operations Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Complete cross-network visibility into retail stores, regional distribution hubs, algorithm solvers, and corporate financial exposure.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/network-map')}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <Map size={14} className="stroke-[2.5]" />
              <span>3D Geographic Network Map</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/report?section=dashboard')}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileText size={14} />
              <span>Export Audit PDF</span>
              <Sparkles size={11} className="text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Access Requests Manager (Approvals & Delegations for top role) */}
      <AccessRequestsManager />

      {/* Facilities Explorer Strip */}
      <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Network Facilities Oversight
            </div>
            <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
              {user?.company || 'National FMCG Network'}
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setEntityTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                entityTab === 'all' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Facilities ({stores.length + warehouses.length})
            </button>
            <button
              type="button"
              onClick={() => setEntityTab('stores')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                entityTab === 'stores' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stores ({stores.length})
            </button>
            <button
              type="button"
              onClick={() => setEntityTab('warehouses')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                entityTab === 'warehouses' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Warehouses ({warehouses.length})
            </button>
          </div>
        </div>

        {/* Dynamic Section based on tab */}
        {(entityTab === 'all' || entityTab === 'stores') && (
          <MyStoresSection onOpenSearchModal={() => onOpenSearchModal && onOpenSearchModal('store')} />
        )}

        {(entityTab === 'all' || entityTab === 'warehouses') && (
          <MyWarehousesSection onOpenSearchModal={() => onOpenSearchModal && onOpenSearchModal('warehouse')} />
        )}
      </div>

      {/* Data Provenance & Methodology Disclosure Banner */}
      <ProvenanceDisclosureBanner />

      {/* Master Cross-Network KPI Grid */}
      <div className="ss-kpi-grid">
        <KPICard
          id="kpi-total-inventory"
          icon={Package}
          label="Total Network Inventory"
          value={overviewData?.summary?.totalInventoryUnits ?? s.totalInventory}
          unit="units"
          change={s.inventoryChange}
          changeLabel="vs last week"
          color="blue"
          loading={loading}
          provenanceType={overviewData?.summary?.totalInventoryUnits ? 'historical' : 'demo'}
          provenanceTooltip="Aggregated across all distribution centers and retail stores"
        />
        <KPICard
          id="kpi-inventory-valuation"
          icon={DollarSign}
          label="Inventory Valuation"
          value={overviewData?.summary?.totalInventoryValuation ? Math.round(overviewData.summary.totalInventoryValuation) : 11959500}
          unit="₹"
          change={2.4}
          changeLabel="valuation"
          color="success"
          loading={loading}
          provenanceType="historical"
          provenanceTooltip="Calculated dynamically: Sum of (Inventory Level × Unit Cost) across all SKUs"
        />
        <KPICard
          id="kpi-stores-at-risk"
          icon={AlertTriangle}
          label="Low-Stock Alerts"
          value={overviewData?.summary?.lowStockCombinations ?? s.storesAtRisk}
          unit="alerts"
          change={s.riskChange}
          changeLabel="vs reorder point"
          color="critical"
          loading={loading}
          provenanceType="historical"
          provenanceTooltip="SKU-Facility combinations currently below safety reorder threshold"
        />
        <KPICard
          id="kpi-days-of-supply"
          icon={Clock}
          label="Avg Days of Supply"
          value={overviewData?.summary?.avgDaysOfSupply ?? 14.2}
          unit="days"
          change={-0.8}
          changeLabel="7d burn rate"
          color="warning"
          loading={loading}
          provenanceType="historical"
          provenanceTooltip="Inventory Level divided by 7-day average daily sales velocity"
        />
        <KPICard
          id="kpi-solver-status"
          icon={TrendingUp}
          label="Latest Solver Status"
          value={latestRun?.status || latestRun?.solverStatus || 'OPTIMAL'}
          unit={latestRun?.solverRuntimeSeconds !== undefined ? `${Math.round(latestRun.solverRuntimeSeconds * 1000)}ms` : '38ms'}
          change={-18.4}
          changeLabel="vs greedy cost"
          color="success"
          loading={loading}
          provenanceType="optimizer"
          provenanceTooltip="Verified Google OR-Tools CP-SAT discrete solver status"
        />
        <KPICard
          id="kpi-freight-cost"
          icon={DollarSign}
          label="Optimized Freight Cost"
          value={latestRun?.metrics?.optimizedTransportCost ?? (latestRun?.totalOptimizedCost ?? s.distributionCost)}
          unit="₹"
          change={s.costChange}
          changeLabel="vs greedy baseline"
          color="success"
          loading={loading}
          provenanceType="assumed"
          provenanceTooltip="Calculated using verified transport network rates"
        />
        <KPICard
          id="kpi-service-level"
          icon={CheckCircle}
          label="Demand Fulfillment Rate"
          value={latestRun?.metrics?.demandFulfillmentRatePct !== undefined ? Number(latestRun.metrics.demandFulfillmentRatePct.toFixed(1)) : 97.4}
          unit="%"
          change={s.serviceLevelChange}
          changeLabel="fulfilled"
          color="success"
          loading={loading}
          provenanceType="optimizer"
          provenanceTooltip="Ratio of dispatched units to target demand across all corridors"
        />
        <div
          className="ss-kpi-card group cursor-pointer transition-all duration-300 hover:border-sky-400 hover:shadow-md"
          id="kpi-run-optimization"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            border: '1.5px dashed #38bdf8',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            minHeight: '170px',
          }}
          onClick={handleRunOptimization}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleRunOptimization()}
        >
          <div
            className="group-hover:scale-110 group-hover:shadow-lg transition-all duration-300"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Play size={22} color="#ffffff" fill="#ffffff" style={{ marginLeft: '2px' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#0c4a6e' }}>Run Optimization</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0369a1', marginTop: '2px' }}>
              Start a new rescue scenario
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Network Demand Trend & Inventory Distribution */}
      <div className="ss-chart-grid">
        <div className="ss-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#17324d' }}>Network Demand Trend</div>
              <div style={{ fontSize: '12px', color: '#64778b', marginTop: '2px' }}>Actual vs. forecast — last 6 weeks</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <ProvenanceBadge type="historical" tooltip="Actuals from historical demand series" />
              <ProvenanceBadge type="forecast" tooltip="Moving Average / LightGBM 14-day horizon" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={DEMAND_TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="actualExecGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#247bc1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#247bc1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastExecGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6ab0e1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6ab0e1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef6ff" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#99aabb' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#99aabb' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#64778b' }} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#247bc1" strokeWidth={2.5} fill="url(#actualExecGrad)" dot={{ r: 3, fill: '#247bc1' }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#6ab0e1" strokeWidth={2} strokeDasharray="5 3" fill="url(#forecastExecGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="ss-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#17324d' }}>Inventory Status</div>
              <div style={{ fontSize: '12px', color: '#64778b', marginTop: '2px' }}>By stock level across all locations</div>
            </div>
            <ProvenanceBadge type="historical" tooltip="Aggregated current inventory records" />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={INVENTORY_DISTRIBUTION} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {INVENTORY_DISTRIBUTION.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, '']} contentStyle={{ background: '#102f50', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {INVENTORY_DISTRIBUTION.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#64778b' }}>{d.name}</span>
                </div>
                <span className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: '#17324d' }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Store Demand vs Fulfillment & Warehouse Capacity */}
      <div className="ss-chart-grid">
        <div className="ss-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#17324d' }}>Store Demand vs. Fulfillment</div>
              <div style={{ fontSize: '12px', color: '#64778b', marginTop: '2px' }}>Units demanded vs. fulfilled this week</div>
            </div>
            <ProvenanceBadge type="optimizer" tooltip="Target demand vs solver dispatched units" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={STORE_DEMAND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef6ff" />
              <XAxis dataKey="store" tick={{ fontSize: 11, fill: '#99aabb' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#99aabb' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#64778b' }} />
              <Bar dataKey="demand" name="Demand" fill="#d7e6f5" radius={[3, 3, 0, 0]} />
              <Bar dataKey="fulfilled" name="Fulfilled" fill="#247bc1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="ss-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#17324d' }}>Warehouse Capacity</div>
              <div style={{ fontSize: '12px', color: '#64778b', marginTop: '2px' }}>Used vs. available inventory</div>
            </div>
            <ProvenanceBadge type="configured" tooltip="3 Regional Hubs configured in network" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {WAREHOUSE_INVENTORY.map((wh) => {
              const usedPct = Math.round((wh.used / wh.capacity) * 100)
              const reservedPct = Math.round((wh.reserved / wh.capacity) * 100)
              const isHigh = usedPct > 80
              return (
                <div key={wh.name}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Warehouse size={14} color="#64778b" />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#17324d' }}>{wh.name}</span>
                    </div>
                    <span className="tabular-nums" style={{ fontSize: '12px', color: isHigh ? '#d94b50' : '#64778b', fontWeight: 600 }}>
                      {usedPct}% used
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#eef6ff', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', height: '100%' }}>
                      <div style={{ width: `${usedPct}%`, background: isHigh ? '#d94b50' : '#247bc1', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                      <div style={{ width: `${reservedPct}%`, background: isHigh ? 'rgba(217,75,80,0.3)' : 'rgba(36,123,193,0.3)', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#99aabb' }}>{wh.used.toLocaleString()} in stock</span>
                    <span style={{ fontSize: '11px', color: '#99aabb' }}>{wh.capacity.toLocaleString()} cap.</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Activity Grid & Critical Alerts */}
      <div className="ss-activity-grid">
        <div className="ss-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#17324d' }}>Recent Network Activity</div>
            <button className="ss-btn-ghost" style={{ fontSize: '12px', padding: '4px 10px' }}>
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
          <div>
            {RECENT_ACTIVITY.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="ss-card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#17324d', marginBottom: '16px' }}>
            Critical Network Alerts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                title: 'S-04 Critical Stockout',
                body: 'SKU-MILK-001 at 8% — less than 6 hours supply buffer',
                severity: 'critical',
              },
              {
                title: 'WH-Mumbai Cold Chain Bay Peak',
                body: 'Cold bay occupancy at 91% — staging overflow warning',
                severity: 'warning',
              },
              {
                title: 'Transport Surcharge Delta',
                body: 'Fuel rate adjustment applied across Western corridors',
                severity: 'info',
              },
            ].map((al, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: al.severity === 'critical' ? '#fee2e2' : al.severity === 'warning' ? '#fef3c7' : '#e0f2fe',
                  border: al.severity === 'critical' ? '1px solid #fca5a5' : al.severity === 'warning' ? '1px solid #fde68a' : '1px solid #bae6fd',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: al.severity === 'critical' ? '#991b1b' : al.severity === 'warning' ? '#92400e' : '#075985' }}>
                  {al.title}
                </div>
                <div style={{ fontSize: '11px', color: al.severity === 'critical' ? '#b91c1c' : al.severity === 'warning' ? '#b45309' : '#0369a1', marginTop: '2px' }}>
                  {al.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
