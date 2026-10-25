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
  FileText,
  Sparkles,
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
import { dashboardAPI, analyticsAPI, optimizationAPI } from '../../services/api.js'
import { ProvenanceBadge, ProvenanceDisclosureBanner } from '../../components/ui/ProvenanceBadge.jsx'
import { SkeletonKPICard, SkeletonCard } from '../../components/ui/Skeleton.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { useAuthStore, useEntityStore } from '../../store/index.js'
import { getRoleScope, isExecutiveRole, getRoleBadge, ROLE_GROUPS } from '../../utils/rbac.js'
import RetailerDashboardView from './views/RetailerDashboardView.jsx'
import WarehouseDashboardView from './views/WarehouseDashboardView.jsx'
import AnalystDashboardView from './views/AnalystDashboardView.jsx'
import ExecutiveDashboardView from './views/ExecutiveDashboardView.jsx'
import { Eye, Crown, ShieldCheck } from 'lucide-react'
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
function KPICard({
  icon: Icon,
  label,
  value,
  unit = '',
  change,
  changeLabel,
  color,
  loading,
  id,
  provenanceType,
  provenanceTooltip,
}) {
  const isPositive = change > 0
  const trendColor = change > 0 ? (color === 'success' ? '#166a52' : '#b03035') : '#166a52'

  if (loading) return <SkeletonKPICard />

  const iconBg =
    color === 'success' ? '#ecfdf5' :
    color === 'warning' ? '#fffbeb' :
    color === 'critical' ? '#fff1f2' :
    '#eff6ff'

  const iconBorder =
    color === 'success' ? '#a7f3d0' :
    color === 'warning' ? '#fde68a' :
    color === 'critical' ? '#fecdd3' :
    '#bfdbfe'

  const iconColor =
    color === 'success' ? '#059669' :
    color === 'warning' ? '#d97706' :
    color === 'critical' ? '#e11d48' :
    '#2563eb'

  return (
    <div className="ss-kpi-card group hover:border-sky-300 transition-all duration-200" id={id}>
      <div>
        {/* Top Header: Label & Category Icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            {label}
          </span>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: iconBg,
              border: `1px solid ${iconBorder}`,
            }}
          >
            <Icon size={17} color={iconColor} />
          </div>
        </div>

        {/* Provenance Badge */}
        {provenanceType && (
          <div style={{ marginBottom: '12px' }}>
            <ProvenanceBadge type={provenanceType} tooltip={provenanceTooltip} />
          </div>
        )}

        {/* Metric Value */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
          <span
            className="tabular-nums font-mono tracking-tight"
            style={{ fontSize: '27px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && (
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Metric Trend & Context */}
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
          {change >= 0 ? (
            <ArrowUpRight size={14} color={trendColor} />
          ) : (
            <ArrowDownRight size={14} color={trendColor} />
          )}
          <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 700, color: trendColor }}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && (
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>
              {changeLabel}
            </span>
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
  const [overviewData, setOverviewData] = useState(null)
  const [latestRun, setLatestRun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()
  const { user, token } = useAuthStore()
  const { setNetworkData, stores, warehouses } = useEntityStore()

  // Search network modal
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [searchModalType, setSearchModalType] = useState('all')

  const userScope = getRoleScope(user?.role)
  const isExecutive = isExecutiveRole(user?.role)
  const roleBadge = getRoleBadge(user?.role)

  // For executives, allow switching operational view lens
  const [viewLens, setViewLens] = useState(userScope)

  // Keep viewLens in sync if user role updates
  useEffect(() => {
    setViewLens(getRoleScope(user?.role))
  }, [user?.role])

  const activeScope = isExecutive ? viewLens : userScope

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, overviewRes, runsRes] = await Promise.allSettled([
          dashboardAPI.getSummary(),
          analyticsAPI.getOverview(),
          optimizationAPI.getRuns({ limit: 1 }),
        ])
        if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
          setSummary(summaryRes.value.data)
        } else {
          setSummary(DEMO_SUMMARY)
        }
        if (overviewRes.status === 'fulfilled' && overviewRes.value?.data?.data) {
          setOverviewData(overviewRes.value.data.data)
        }
        const runList = Array.isArray(runsRes.value?.data?.data)
          ? runsRes.value.data.data
          : (Array.isArray(runsRes.value?.data?.runs) ? runsRes.value.data.runs : [])
        if (runList.length > 0) {
          setLatestRun(runList[0])
        }
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

      {/* Role-Specific Dashboard Views with Executive Perspective Lens */}
      {isExecutive && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-900/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase text-amber-300">
                  Master Executive Access
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Full Authority
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">
                You have unrestricted overall network accessibility. Switch perspective to inspect role-specific dashboards:
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-800/90 rounded-xl border border-slate-700">
            {[
              { id: ROLE_GROUPS.EXECUTIVE, label: 'Master Executive', icon: Crown },
              { id: ROLE_GROUPS.RETAILER, label: 'Store Retailer', icon: Eye },
              { id: ROLE_GROUPS.WAREHOUSE, label: 'DC Warehouse', icon: Eye },
              { id: ROLE_GROUPS.ANALYST, label: 'SC Analyst', icon: Eye },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewLens(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeScope === id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RENDER ACTIVE ROLE VIEW */}
      {activeScope === ROLE_GROUPS.RETAILER && (
        <RetailerDashboardView user={user} onOpenRescue={handleRunOptimization} />
      )}

      {activeScope === ROLE_GROUPS.WAREHOUSE && (
        <WarehouseDashboardView user={user} />
      )}

      {activeScope === ROLE_GROUPS.ANALYST && (
        <AnalystDashboardView user={user} latestRun={latestRun} summary={s} />
      )}

      {activeScope === ROLE_GROUPS.EXECUTIVE && (
        <ExecutiveDashboardView
          user={user}
          summary={summary}
          overviewData={overviewData}
          latestRun={latestRun}
          loading={loading}
          onOpenSearchModal={(type) => {
            setSearchModalType(type)
            setIsSearchModalOpen(true)
          }}
          DEMAND_TREND={DEMAND_TREND}
          INVENTORY_DISTRIBUTION={INVENTORY_DISTRIBUTION}
          STORE_DEMAND={STORE_DEMAND}
          WAREHOUSE_INVENTORY={WAREHOUSE_INVENTORY}
          RECENT_ACTIVITY={RECENT_ACTIVITY}
          ChartTooltip={ChartTooltip}
          ActivityItem={ActivityItem}
          DEMO_SUMMARY={DEMO_SUMMARY}
        />
      )}

      {/* Global Facility Discovery / Search Modal */}
      <SearchNetworkModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        defaultType={searchModalType}
      />



    </AppLayout>
  )
}
