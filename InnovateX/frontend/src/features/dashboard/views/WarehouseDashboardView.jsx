import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Warehouse,
  Truck,
  Package,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Route,
  Shield,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
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

// Warehouse Category Share
const DC_CATEGORY_DATA = [
  { name: 'Dairy & Cold Chain', value: 38, color: '#3b82f6' },
  { name: 'Dry FMCG Goods', value: 32, color: '#10b981' },
  { name: 'Packaged Foods', value: 18, color: '#f59e0b' },
  { name: 'Beverages', value: 12, color: '#8b5cf6' },
]

// Mock Outbound Fleet Dispatch Manifests
const INITIAL_MANIFESTS = [
  {
    id: 'MAN-2026-081',
    destStore: 'Store S-04 [Metro Central - Critical]',
    units: 2400,
    truckId: 'MH-12-TR-9902',
    roadDistanceKm: 148,
    eta: '2h 15m',
    highway: 'NH-48 Corridor',
    status: 'In-Transit',
    urgency: 'high',
  },
  {
    id: 'MAN-2026-082',
    destStore: 'Store S-01 [Indiranagar]',
    units: 1800,
    truckId: 'KA-04-TR-4421',
    roadDistanceKm: 312,
    eta: '4h 40m',
    highway: 'NH-44 Corridor',
    status: 'In-Transit',
    urgency: 'medium',
  },
  {
    id: 'MAN-2026-083',
    destStore: 'Store S-02 [Koramangala]',
    units: 2100,
    truckId: 'MH-14-TR-1109',
    roadDistanceKm: 324,
    eta: '4h 55m',
    highway: 'NH-44 Corridor',
    status: 'Loading Dock #3',
    urgency: 'medium',
  },
  {
    id: 'MAN-2026-084',
    destStore: 'Store S-03 [Whitefield]',
    units: 3200,
    truckId: 'KA-53-TR-8722',
    roadDistanceKm: 345,
    eta: '5h 15m',
    highway: 'NH-75 Expressway',
    status: 'Staged on Apron',
    urgency: 'normal',
  },
]

// Inbound Supplier Arrivals
const INBOUND_SCHEDULE = [
  { po: 'PO-8819', vendor: 'Amul Cooperative Ltd.', goods: 'Whole Milk & Butter (8 Pallets)', dock: 'Dock 1 (Cold)', eta: '11:30 AM' },
  { po: 'PO-8822', vendor: 'Britannia Industries', goods: 'Biscuits & Breads (14 Pallets)', dock: 'Dock 4 (Dry)', eta: '01:15 PM' },
  { po: 'PO-8825', vendor: 'Tata Consumer Products', goods: 'Pulses & Salt (18 Pallets)', dock: 'Dock 6 (Bulk)', eta: '03:45 PM' },
]

export default function WarehouseDashboardView({ user, onOpenSearchModal }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { warehouses } = useEntityStore()

  const [activeDC, setActiveDC] = useState('WH-Mumbai Central DC')
  const [manifests, setManifests] = useState(INITIAL_MANIFESTS)

  const handleLaunchShortestRoute = (destName) => {
    navigate('/network-map')
    toast.info(`Tracing shortest road transport corridor from ${activeDC} to ${destName}…`, 'Road Transport')
  }

  return (
    <div className="space-y-6">
      {/* Warehouse DC Command Center Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Warehouse size={220} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30">
                🏭 Distribution Center Command Hub
              </span>
              <span className="text-xs text-blue-200 font-medium">
                Primary Regional Hub • 6 Active Docks
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeDC} Operations
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
              Real-time pallet dock telemetry, temperature-controlled bay allocation, and outbound retail fleet dispatch manifests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                navigate('/network-map')
                toast.info('Viewing 3D Distribution Network & road transport lanes…', 'Network Map')
              }}
              className="px-4 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-900 font-extrabold text-xs shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <Route size={14} className="stroke-[2.5]" />
              <span>🛣️ Trace Shortest Road Routes</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenSearchModal && onOpenSearchModal('warehouse')}
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-xs backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle size={14} />
              <span>Connect DC Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warehouse-Specific KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Capacity Utilization */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Storage Capacity</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Warehouse size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">84.2%</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">High Occupancy</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            53,880 / 64,000 units on-hand (10,120 u buffer)
          </div>
        </div>

        {/* KPI 2: Pallets Staged */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pallets Staged</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">142</span>
            <span className="text-xs font-bold text-slate-500">pallets</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-2 font-semibold flex items-center gap-1">
            <span>✓ Verified</span>
            <span className="text-slate-400 font-normal">ready on outbound logistics apron</span>
          </div>
        </div>

        {/* KPI 3: Active Fleet Dispatches */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Fleet Dispatches</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Truck size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">5 Trucks</span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">En-Route</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Supplying Store S-04, S-01, S-02, S-03
          </div>
        </div>

        {/* KPI 4: Inbound Supplier Deliveries */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inbound Docks Today</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">8 Loads</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Scheduled</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Next truck: Amul 11:30 AM on Dock 1
          </div>
        </div>
      </div>

      {/* Storage Bay & Dock Capacity Monitor */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-blue-600" />
              <span>DC Storage Bay &amp; Apron Capacity Monitor</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Current floor plan allocations across Ambient, Cold Chain, and Pallet Staging zones
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Hub Location:</span>
            <select
              value={activeDC}
              onChange={(e) => setActiveDC(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer"
            >
              <option value="WH-Mumbai Central DC">WH-Mumbai Central DC (Maharashtra)</option>
              <option value="WH-Delhi North Hub">WH-Delhi North Hub (NCR)</option>
              <option value="WH-Bangalore South Hub">WH-Bangalore South Hub (Karnataka)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Ambient Dry Storage */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Ambient Dry Goods</span>
              <span>78% Occupied</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '78%' }} />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>31,200 units</span>
              <span>Cap: 40,000 u</span>
            </div>
          </div>

          {/* Cold Chain Storage */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80">
            <div className="flex justify-between text-xs font-bold text-rose-800 mb-1">
              <span>Cold Chain Zone (2-4°C)</span>
              <span>91% Occupied</span>
            </div>
            <div className="w-full h-2 bg-rose-200 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: '91%' }} />
            </div>
            <div className="text-[11px] text-rose-700/80 flex justify-between">
              <span>14,560 units (High)</span>
              <span>Cap: 16,000 u</span>
            </div>
          </div>

          {/* Outbound Staging Apron */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Pallet Staging Apron</span>
              <span>65% Occupied</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: '65%' }} />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>52 Pallets staged</span>
              <span>Cap: 80 Pallets</span>
            </div>
          </div>

          {/* Loading Docks */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Active Loading Docks</span>
              <span>4 / 6 Bays Active</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '66.7%' }} />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Docks 1, 2, 3, 5 busy</span>
              <span>Docks 4, 6 idle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outbound Fleet Dispatch Manifests Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck size={18} className="text-indigo-600" />
              <span>Outbound Fleet Dispatch Manifests</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live truck manifests dispatched to retail storehouse nodes via calculated shortest road corridors
            </p>
          </div>

          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl">
            4 Active Manifests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Manifest #</th>
                <th className="py-3 px-4">Destination Store</th>
                <th className="py-3 px-4">Allocated Units</th>
                <th className="py-3 px-4">Road Distance &amp; ETA</th>
                <th className="py-3 px-4">Highway Route</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Route Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {manifests.map((man) => (
                <tr key={man.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>{man.id}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{man.truckId}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {man.destStore}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-slate-900">{man.units.toLocaleString()}</span>{' '}
                    <span className="text-slate-400 text-[11px]">units</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-sky-700">{man.roadDistanceKm} km</div>
                    <div className="text-[10px] text-slate-400">{man.eta} transit</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {man.highway}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        man.status === 'In-Transit'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {man.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleLaunchShortestRoute(man.destStore)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                    >
                      <Route size={12} />
                      <span>Trace Road Path</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Inbound Supplier Schedule & Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbound Supplier Deliveries */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today's Inbound Supplier Schedule</h3>
              <p className="text-xs text-slate-500">Scheduled freight arrivals across warehouse receiving bays</p>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Dock Manifest
            </span>
          </div>

          <div className="space-y-3">
            {INBOUND_SCHEDULE.map((item) => (
              <div
                key={item.po}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{item.vendor}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({item.po})</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{item.goods}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-extrabold text-blue-700">{item.eta}</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    {item.dock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Share Pie Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">DC Inventory Share by Category</h3>
              <p className="text-xs text-slate-500">Storage allocation across product lines</p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              Category Breakdown
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ResponsiveContainer width="45%" height={180}>
              <PieChart>
                <Pie data={DC_CATEGORY_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {DC_CATEGORY_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, '']}
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1 space-y-2 text-xs">
              {DC_CATEGORY_DATA.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-600 font-medium">{cat.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
