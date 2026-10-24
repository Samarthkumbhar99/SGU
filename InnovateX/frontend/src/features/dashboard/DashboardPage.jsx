import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  CheckCircle,
  XCircle,
  RefreshCw,
  Warehouse,
  Store,
  Zap,
  BarChart2,
} from 'lucide-react'
import {
  LineChart,
  Line,
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
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { dashboardAPI } from '../../services/api.js'
import { SkeletonKPICard, SkeletonCard } from '../../components/ui/Skeleton.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { useAuthStore, useEntityStore } from '../../store/index.js'
import LiveLocationBar from './components/LiveLocationBar.jsx'
import MyStoresSection from './components/MyStoresSection.jsx'
import MyWarehousesSection from './components/MyWarehousesSection.jsx'
import AccessRequestsManager from './components/AccessRequestsManager.jsx'
import SearchNetworkModal from './components/SearchNetworkModal.jsx'
import RaySymbol from '../onboarding/RaySymbol.jsx'

// ——— Demo data (used as fallback when API is unavailable) ———
const DEMO_SUMMARY = {
  totalInventory: 284750,
  inventoryChange: 3.2,
  storesAtRisk: 4,
  riskChange: -1,
  expiringProducts: 12,
  expiryChange: 2,
  openScenarios: 3,
  distributionCost: 12090,
  costChange: -18.4,
  serviceLevel: 96.8,
  serviceLevelChange: 1.4,
  pendingApprovals: 2,
}

const DEMAND_TREND = [
  { period: 'Week 38', actual: 8400, forecast: 8200 },
  { period: 'Week 39', actual: 9100, forecast: 8900 },
  { period: 'Week 40', actual: 8750, forecast: 8800 },
  { period: 'Week 41', actual: 9600, forecast: 9400 },
  { period: 'Week 42', actual: 10200, forecast: 9800 },
  { period: 'Week 43', actual: 9850, forecast: 10100 },
  { period: 'Week 44', actual: null, forecast: 10400 },
  { period: 'Week 45', actual: null, forecast: 10700 },
]

const INVENTORY_DISTRIBUTION = [
  { name: 'Adequate', value: 68, color: '#208567' },
  { name: 'Low Stock', value: 20, color: '#d99a27' },
  { name: 'Critical', value: 8, color: '#d94b50' },
  { name: 'Surplus', value: 4, color: '#247bc1' },
]

const WAREHOUSE_INVENTORY = [
  { name: 'WH-Delhi', capacity: 85000, used: 67400, reserved: 8200 },
  { name: 'WH-Mumbai', capacity: 70000, used: 58900, reserved: 6800 },
  { name: 'WH-Bangalore', capacity: 65000, used: 49200, reserved: 5600 },
]

const STORE_DEMAND = [
  { store: 'S-01', demand: 1820, fulfilled: 1750 },
  { store: 'S-02', demand: 2340, fulfilled: 2280 },
  { store: 'S-03', demand: 1650, fulfilled: 1650 },
  { store: 'S-04', demand: 2890, fulfilled: 2420 },
  { store: 'S-05', demand: 1980, fulfilled: 1960 },
  { store: 'S-06', demand: 2150, fulfilled: 2100 },
  { store: 'S-07', demand: 3100, fulfilled: 2950 },
  { store: 'S-08', demand: 1720, fulfilled: 1720 },
  { store: 'S-09', demand: 2460, fulfilled: 2380 },
  { store: 'S-10', demand: 1900, fulfilled: 1850 },
]

const RECENT_ACTIVITY = [
  {
    id: 1,
    type: 'optimization',
    status: 'success',
    title: 'Route SC-2024-07 optimized',
    detail: 'Cost reduced by ₹18,400 (18.4%). 340 unit shortage resolved.',
    time: '5 minutes ago',
  },
  {
    id: 2,
    type: 'alert',
    status: 'warning',
    title: 'Stock alert — SKU-MILK-001',
    detail: 'Store S-04 (Mumbai South) at 8% stock level. Replenishment recommended.',
    time: '22 minutes ago',
  },
  {
    id: 3,
    type: 'approval',
    status: 'pending',
    title: 'Plan P-2024-12 awaiting approval',
    detail: 'Scenario: Route NH-48 closure. 12 shipment recommendations pending.',
    time: '1 hour ago',
  },
  {
    id: 4,
    type: 'expiry',
    status: 'warning',
    title: 'Batch expiry risk detected',
    detail: 'Batch B-2024-089 (SKU-YOGURT-003, WH-Delhi) expires in 6 days.',
    time: '2 hours ago',
  },
  {
    id: 5,
    type: 'import',
    status: 'success',
    title: 'Inventory import completed',
    detail: '1,247 records validated and loaded from weekly_stock_update.csv.',
    time: '4 hours ago',
  },
]

// ——— KPI Card ———
function KPICard({ icon: Icon, label, value, unit = '', change, changeLabel, color, loading, id }) {
  const isPositive = change > 0
  const trendColor = change > 0 ? (color === 'success' ? '#208567' : '#d94b50') : '#208567'

  if (loading) return <SkeletonKPICard />

  return (
    <div className="ss-kpi-card" id={id}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#64778b', letterSpacing: '0.01em' }}>
          {label}
        </div>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background:
              color === 'success' ? '#ebfdf5' :
              color === 'warning' ? '#fffbeb' :
              color === 'critical' ? '#fff5f5' :
              '#eef6ff',
          }}
        >
          <Icon
            size={18}
            color={
              color === 'success' ? '#208567' :
              color === 'warning' ? '#d99a27' :
              color === 'critical' ? '#d94b50' :
              '#247bc1'
            }
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
        <span
          className="tabular-nums"
          style={{ fontSize: '28px', fontWeight: 800, color: '#17324d', lineHeight: 1 }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span style={{ fontSize: '14px', fontWeight: 600, color: '#64778b' }}>{unit}</span>}
      </div>

      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {change >= 0 ? (
            <ArrowUpRight size={13} color={trendColor} />
          ) : (
            <ArrowDownRight size={13} color={trendColor} />
          )}
          <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 600, color: trendColor }}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && (
            <span style={{ fontSize: '12px', color: '#99aabb' }}>{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ——— Custom Tooltip ———
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#102f50',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '12px',
        color: '#fff',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '6px', color: 'rgba(255,255,255,0.75)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.65)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{(p.value || 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ——— Activity Item ———
function ActivityItem({ item }) {
  const iconMap = {
    success: <CheckCircle size={16} color="#208567" />,
    warning: <AlertTriangle size={16} color="#d99a27" />,
    pending: <Clock size={16} color="#247bc1" />,
    error: <XCircle size={16} color="#d94b50" />,
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px 0',
        borderBottom: '1px solid #eef6ff',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: item.status === 'success' ? '#ebfdf5' : item.status === 'warning' ? '#fffbeb' : '#eef6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px',
        }}
      >
        {iconMap[item.status]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '13px', color: '#17324d', marginBottom: '3px' }}>
          {item.title}
        </div>
        <div style={{ fontSize: '12px', color: '#64778b', lineHeight: 1.4 }}>{item.detail}</div>
        <div style={{ fontSize: '11px', color: '#99aabb', marginTop: '4px' }}>{item.time}</div>
      </div>
    </div>
  )
}

// ——— Main Dashboard Component ———
export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()
  const { user, token } = useAuthStore()
  const { setNetworkData, stores, warehouses } = useEntityStore()

  // Search network modal
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [searchModalType, setSearchModalType] = useState('all')

  // Entity tab selection ('all' | 'stores' | 'warehouses')
  const isRetailer = user?.role === 'Retailer'
  const isWarehouseMgr = user?.role === 'Warehouse Manager' || user?.role === 'Warehouse Controller'
  const [entityTab, setEntityTab] = useState(isRetailer ? 'stores' : isWarehouseMgr ? 'warehouses' : 'all')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardAPI.getSummary()
        setSummary(res.data)
      } catch {
        // Fall back to demo data when backend is unavailable
        setSummary(DEMO_SUMMARY)
      } finally {
        setLoading(false)
      }
    }
    load()

    // Fetch user-specific stores, warehouses, and access requests
    const loadMyNetwork = async () => {
      if (!token) return
      try {
        const res = await fetch('http://localhost:5000/api/v1/entities/my-network', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json()
        if (data.success) {
          setNetworkData(data.data)
        }
      } catch (e) {
        console.error('Failed to load my-network data:', e)
      }
    }
    loadMyNetwork()
  }, [token])

  const handleRunOptimization = () => {
    navigate('/rescue')
    toast.info('Starting Adaptive Inventory Rescue workflow…', 'Optimization')
  }

  const s = summary || DEMO_SUMMARY

  return (
    <AppLayout pageTitle="Overview Dashboard" breadcrumbs={['Home', 'Dashboard']}>
      {/* RAY AI Onboarding Notification Banner if not onboarded */}
      {!user?.isOnboarded && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RaySymbol size={28} className="shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">
                Setup your FMCG Profile with RAY AI Agent
              </div>
              <div className="text-[11px] text-slate-600">
                Calibrate live GPS, configure retail stores or warehouse DCs, and set up automatic replenish bounds in under 2 minutes.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
          >
            <span>Launch AI Onboarding (RAY)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Live GPS Telemetry Bar */}
      <LiveLocationBar />

      {/* Access Requests Manager (Approvals & Sent Requests) */}
      <AccessRequestsManager />

      {/* User-Specific Entity Management Section */}
      <div className="mb-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {user?.role || 'Supply Chain'} Workspace
            </div>
            <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
              {user?.company || 'FMCG Network'}
            </span>
          </div>

          {/* Entity Tab Filters */}
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

        {/* Dynamic Section based on role and tab */}
        {(entityTab === 'all' || entityTab === 'stores') && (
          <MyStoresSection
            onOpenSearchModal={() => {
              setSearchModalType('store')
              setIsSearchModalOpen(true)
            }}
          />
        )}

        {(entityTab === 'all' || entityTab === 'warehouses') && (
          <MyWarehousesSection
            onOpenSearchModal={() => {
              setSearchModalType('warehouse')
              setIsSearchModalOpen(true)
            }}
          />
        )}
      </div>

      {/* Global Network Search & Claim Modal */}
      <SearchNetworkModal
        isOpen={isSearchModalOpen}
        defaultType={searchModalType}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* KPI Grid */}
      <div className="ss-kpi-grid" style={{ marginBottom: '20px' }}>
        <KPICard
          id="kpi-total-inventory"
          icon={Package}
          label="Total Network Inventory"
          value={s.totalInventory}
          unit="units"
          change={s.inventoryChange}
          changeLabel="vs last week"
          color="blue"
          loading={loading}
        />
        <KPICard
          id="kpi-stores-at-risk"
          icon={AlertTriangle}
          label="Stores at Stockout Risk"
          value={s.storesAtRisk}
          change={s.riskChange}
          changeLabel="vs last week"
          color="critical"
          loading={loading}
        />
        <KPICard
          id="kpi-expiring"
          icon={Clock}
          label="Products Near Expiry"
          value={s.expiringProducts}
          unit="batches"
          change={s.expiryChange}
          changeLabel="this week"
          color="warning"
          loading={loading}
        />
        <KPICard
          id="kpi-service-level"
          icon={TrendingUp}
          label="Network Service Level"
          value={s.serviceLevel}
          unit="%"
          change={s.serviceLevelChange}
          changeLabel="vs target"
          color="success"
          loading={loading}
        />
        <KPICard
          id="kpi-cost"
          icon={DollarSign}
          label="Distribution Cost (₹)"
          value={s.distributionCost}
          unit="K"
          change={s.costChange}
          changeLabel="vs baseline"
          color="success"
          loading={loading}
        />
        <KPICard
          id="kpi-scenarios"
          icon={Activity}
          label="Open Scenarios"
          value={s.openScenarios}
          changeLabel="awaiting action"
          color="blue"
          loading={loading}
        />
        <KPICard
          id="kpi-pending"
          icon={CheckCircle}
          label="Pending Approvals"
          value={s.pendingApprovals}
          changeLabel="need review"
          color="warning"
          loading={loading}
        />
        <div className="ss-kpi-card" id="kpi-run-optimization" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', border: '1.5px dashed #247bc1', background: 'linear-gradient(135deg, #f8fbff, #eef6ff)' }}
          onClick={handleRunOptimization}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleRunOptimization()}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #247bc1, #6ab0e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(36,123,193,0.35)' }}>
            <Play size={22} color="#fff" fill="#fff" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#17324d' }}>Run Optimization</div>
            <div style={{ fontSize: '12px', color: '#64778b', marginTop: '2px' }}>Start a new rescue scenario</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="ss-chart-grid" style={{ marginBottom: '20px' }}>
        {/* Demand Trend */}
        <div className="ss-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#17324d' }}>Network Demand Trend</div>
              <div style={{ fontSize: '12px', color: '#64778b', marginTop: '2px' }}>Actual vs. forecast — last 6 weeks</div>
            </div>
            <span className="ss-badge ss-badge-info">
              <BarChart2 size={10} />
              Synthetic data
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={DEMAND_TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#247bc1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#247bc1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6ab0e1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6ab0e1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef6ff" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#99aabb' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#99aabb' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#64778b' }} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#247bc1" strokeWidth={2.5} fill="url(#actualGrad)" dot={{ r: 3, fill: '#247bc1' }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#6ab0e1" strokeWidth={2} strokeDasharray="5 3" fill="url(#forecastGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Status Pie */}
        <div className="ss-card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#17324d' }}>Inventory Status</div>
            <div style={{ fontSize: '12px', color: '#64778b', marginTop: '2px' }}>By stock level across all locations</div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={INVENTORY_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {INVENTORY_DISTRIBUTION.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}%`, '']}
                contentStyle={{ background: '#102f50', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
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

      {/* Charts Row 2 */}
      <div className="ss-chart-grid" style={{ marginBottom: '20px' }}>
        {/* Store Demand Histogram */}
        <div className="ss-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#17324d' }}>Store Demand vs. Fulfillment</div>
              <div style={{ fontSize: '12px', color: '#64778b', marginTop: '2px' }}>Units demanded vs. fulfilled this week</div>
            </div>
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

        {/* Warehouse Inventory */}
        <div className="ss-card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#17324d' }}>Warehouse Capacity</div>
            <div style={{ fontSize: '12px', color: '#64778b', marginTop: '2px' }}>Used vs. available inventory</div>
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

      {/* Bottom Row: Activity + Alerts */}
      <div className="ss-activity-grid">
        {/* Activity Feed */}
        <div className="ss-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#17324d' }}>Recent Activity</div>
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

        {/* Critical Alerts */}
        <div className="ss-card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#17324d', marginBottom: '16px' }}>
            Critical Alerts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                title: 'S-04 Critical Stockout',
                body: 'SKU-MILK-001 at 8% — less than 6 hours supply',
                severity: 'critical',
              },
              {
                title: 'Batch Expiry in 6 Days',
                body: 'B-2024-089 — 840 units YOGURT at WH-Delhi',
                severity: 'warning',
              },
              {
                title: 'NH-48 Route Partially Closed',
                body: '3 shipments affected, estimated 4h delay',
                severity: 'warning',
              },
              {
                title: '2 Plans Need Approval',
                body: 'P-2024-11 and P-2024-12 awaiting sign-off',
                severity: 'info',
              },
            ].map((alert, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background:
                    alert.severity === 'critical' ? '#fff5f5' :
                    alert.severity === 'warning' ? '#fffbeb' :
                    '#eef6ff',
                  border: `1px solid ${
                    alert.severity === 'critical' ? '#fde8e9' :
                    alert.severity === 'warning' ? '#fef3cd' :
                    '#d7e6f5'
                  }`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <AlertTriangle
                    size={13}
                    color={
                      alert.severity === 'critical' ? '#d94b50' :
                      alert.severity === 'warning' ? '#d99a27' :
                      '#247bc1'
                    }
                  />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#17324d' }}>{alert.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64778b', lineHeight: 1.4 }}>{alert.body}</p>
              </div>
            ))}

            <button
              id="run-rescue-cta"
              className="ss-btn-primary"
              style={{ width: '100%', marginTop: '4px' }}
              onClick={handleRunOptimization}
            >
              <Zap size={15} />
              Run Inventory Rescue
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .ss-chart-grid > *:last-child,
          .ss-chart-grid + div > *:last-child {
            display: none;
          }
        }
      `}</style>
    </AppLayout>
  )
}
