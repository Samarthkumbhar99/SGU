import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Store,
  AlertTriangle,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle2,
  Package,
  Zap,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  ShieldAlert,
  ChevronRight,
  Check,
  MapPin,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useEntityStore } from '../../../store/index.js'
import { useToast } from '../../../components/ui/Toast.jsx'

// Retailer specific weekly POS sales vs deliveries
const STORE_SALES_DATA = [
  { day: 'Mon', posSales: 2150, deliveries: 2400 },
  { day: 'Tue', posSales: 2380, deliveries: 2200 },
  { day: 'Wed', posSales: 2540, deliveries: 2600 },
  { day: 'Thu', posSales: 2290, deliveries: 2100 },
  { day: 'Fri', posSales: 2890, deliveries: 3100 },
  { day: 'Sat', posSales: 3420, deliveries: 3200 },
  { day: 'Sun', posSales: 3180, deliveries: 3000 },
]

// Mock Store shelf inventory items
const INITIAL_STORE_ITEMS = [
  {
    sku: 'SKU-MILK-001',
    name: 'Farm Fresh Whole Milk 1L',
    category: 'Dairy',
    capacity: 600,
    currentStock: 48,
    dailyVelocity: 180,
    daysLeft: 0.3,
    status: 'Critical Stockout',
    supplierHub: 'WH-Mumbai Central DC',
  },
  {
    sku: 'SKU-BTR-004',
    name: 'Pasteurized Butter 500g',
    category: 'Dairy',
    capacity: 450,
    currentStock: 62,
    dailyVelocity: 110,
    daysLeft: 0.6,
    status: 'Critical Stockout',
    supplierHub: 'WH-Mumbai Central DC',
  },
  {
    sku: 'SKU-BRD-002',
    name: 'Artisan Whole Wheat Bread 400g',
    category: 'Bakery',
    capacity: 500,
    currentStock: 140,
    dailyVelocity: 160,
    daysLeft: 0.9,
    status: 'Low Stock',
    supplierHub: 'WH-Delhi North Hub',
  },
  {
    sku: 'SKU-EGG-012',
    name: 'Organic Grade A Eggs (12-pack)',
    category: 'Poultry',
    capacity: 800,
    currentStock: 290,
    dailyVelocity: 140,
    daysLeft: 2.1,
    status: 'Low Stock',
    supplierHub: 'WH-Bangalore South Hub',
  },
  {
    sku: 'SKU-YGT-007',
    name: 'Greek Probiotic Yogurt 200g',
    category: 'Dairy',
    capacity: 400,
    currentStock: 340,
    dailyVelocity: 65,
    daysLeft: 5.2,
    status: 'Healthy',
    supplierHub: 'WH-Mumbai Central DC',
  },
  {
    sku: 'SKU-CR-009',
    name: 'Multigrain Crunchy Cereal 750g',
    category: 'Dry Goods',
    capacity: 350,
    currentStock: 310,
    dailyVelocity: 35,
    daysLeft: 8.8,
    status: 'Healthy',
    supplierHub: 'WH-Delhi North Hub',
  },
]

export default function RetailerDashboardView({ user, onOpenSearchModal }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { stores } = useEntityStore()

  const [shelfItems, setShelfItems] = useState(INITIAL_STORE_ITEMS)
  const [requestedSkus, setRequestedSkus] = useState({})
  const [selectedStore, setSelectedStore] = useState('Store S-04 [Metro Central]')

  const handleRequestRefill = (sku, name, supplierHub) => {
    setRequestedSkus((prev) => ({ ...prev, [sku]: true }))
    toast.success(
      `Replenishment PO dispatched to ${supplierHub} for ${name}. Expected transit ETA: ~2h 15m.`,
      'Refill Scheduled'
    )
  }

  const handleTriggerStoreRescue = () => {
    navigate('/network-map')
    toast.info('Connecting Store S-04 with nearest Regional Warehouse via Shortest Road Path…', 'Auto-Rescue')
  }

  return (
    <div className="space-y-6">
      {/* Retailer Operational Header Strip */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Store size={220} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30">
                🛒 Retail Store Command Center
              </span>
              <span className="text-xs text-emerald-100 font-medium">
                Store ID: S-04 • Pune / Mumbai Corridor
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Store Director'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
              Real-time point-of-sale shelf telemetry, localized stockout early warnings, and direct emergency DC refill routing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleTriggerStoreRescue}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
              title="Launch instant shortest road path rescue"
            >
              <Zap size={14} className="fill-slate-900" />
              <span>⚡ Store Emergency Rescue</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenSearchModal && onOpenSearchModal('store')}
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-xs backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle size={14} />
              <span>Connect Store</span>
            </button>
          </div>
        </div>
      </div>

      {/* Retailer Specific KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Stores Monitored */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stores Monitored</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stores.length > 0 ? stores.length : 7}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Active Outlets</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-rose-500 font-bold">1 Critical</span> • 2 Low Stock • 4 Healthy
          </div>
        </div>

        {/* KPI 2: Shelf Stockouts */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs relative overflow-hidden bg-rose-50/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Critical Shelf Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">2 SKUs</span>
            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">&lt; 12h Buffer</span>
          </div>
          <div className="text-[11px] text-rose-600/80 mt-2 font-medium">
            Immediate warehouse replenishment required
          </div>
        </div>

        {/* KPI 3: Daily POS Sales Velocity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily POS Velocity</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">2,420</span>
            <span className="text-xs font-bold text-slate-500">units/day</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-2 font-semibold flex items-center gap-1">
            <span>↑ 4.8%</span>
            <span className="text-slate-400 font-normal">vs previous week average</span>
          </div>
        </div>

        {/* KPI 4: Inbound Replenishment ETA */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inbound Truck Refill</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Truck size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-700">~2h 15m</span>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">En-Route</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Dispatch #TRK-8821 from Mumbai Central DC
          </div>
        </div>
      </div>

      {/* Emergency Store Rescue Alert Callout */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-amber-600 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <ShieldAlert size={22} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-extrabold flex items-center gap-2">
              <span>Store S-04 has 2 SKUs in Critical Stockout State</span>
              <span className="bg-white text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Action Needed</span>
            </div>
            <div className="text-xs text-rose-100 mt-0.5">
              Milk &amp; Butter run-out estimated in &lt; 8 hours. Connect with nearest supplying warehouse via shortest road path.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTriggerStoreRescue}
          className="px-4 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 text-xs font-extrabold shadow-sm transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <span>Connect Shortest Road Rescue</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Main Store Shelf Inventory Console */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package size={18} className="text-emerald-600" />
              <span>Real-Time Store Shelf Inventory &amp; Refill Dispatch</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live shelf capacity, sales velocity, and automated replenishment dispatch to regional warehouses
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Store:</span>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer"
            >
              <option value="Store S-04 [Metro Central]">Store S-04 [Metro Central - Critical]</option>
              <option value="Store S-01 [Indiranagar]">Store S-01 [Indiranagar - Low Stock]</option>
              <option value="Store S-02 [Koramangala]">Store S-02 [Koramangala - Low Stock]</option>
              <option value="Store S-03 [Whitefield]">Store S-03 [Whitefield - Healthy]</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Product SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Shelf Stock / Cap</th>
                <th className="py-3 px-4">Daily Sales Velocity</th>
                <th className="py-3 px-4">Days Left</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Replenishment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {shelfItems.map((item) => {
                const isRequested = requestedSkus[item.sku]
                const fillPct = Math.round((item.currentStock / item.capacity) * 100)
                const isCritical = item.status === 'Critical Stockout'
                const isWarning = item.status === 'Low Stock'

                return (
                  <tr key={item.sku} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{item.category}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.currentStock}</span>
                        <span className="text-slate-400 text-[11px]">/ {item.capacity} u</span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, fillPct)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {item.dailyVelocity} u/day
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-extrabold ${
                          isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.daysLeft} d
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isCritical
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isWarning
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isRequested ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <Check size={12} />
                          <span>PO En-Route</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRequestRefill(item.sku, item.name, item.supplierHub)}
                          className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs ${
                            isCritical
                              ? 'bg-rose-600 hover:bg-rose-500 text-white'
                              : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200'
                          }`}
                        >
                          <Zap size={12} />
                          <span>Request Refill</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: POS Sales Trend & Inbound Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store POS Demand vs Deliveries */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">POS Demand vs. Inbound Delivery Flow</h3>
              <p className="text-xs text-slate-500">Weekly customer purchase velocity vs inventory refills</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Live POS Stream
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={STORE_SALES_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              <Bar dataKey="posSales" name="POS Customer Demand (u)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deliveries" name="Warehouse Deliveries (u)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inbound Delivery Manifests */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Inbound Store Deliveries</h3>
                <p className="text-xs text-slate-500">Verified deliveries received from regional distribution hubs</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>View Full Matrix</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'DEL-9081',
                  time: 'Today, 09:30 AM',
                  from: 'WH-Mumbai Central DC',
                  units: '2,400 units (Dairy & Packaged)',
                  status: 'Delivered',
                },
                {
                  id: 'DEL-9042',
                  time: 'Yesterday, 04:15 PM',
                  from: 'WH-Mumbai Central DC',
                  units: '1,850 units (Beverages & Dry Goods)',
                  status: 'Delivered',
                },
                {
                  id: 'DEL-8994',
                  time: '24 Oct, 11:00 AM',
                  from: 'WH-Delhi North Hub',
                  units: '3,100 units (Full Weekly Stock)',
                  status: 'Delivered',
                },
              ].map((del) => (
                <div
                  key={del.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{del.id}</span>
                        <span className="text-[10px] text-slate-400 font-normal">• {del.time}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {del.from} • <strong className="text-slate-700">{del.units}</strong>
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {del.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dock gate check-in confirmed via barcode scanner</span>
            <span className="font-bold text-slate-800">Store Gate #2</span>
          </div>
        </div>
      </div>
    </div>
  )
}
