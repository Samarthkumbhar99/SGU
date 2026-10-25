import { useNavigate } from 'react-router-dom'
import {
  User,
  Warehouse,
  Store,
  ShieldCheck,
  LogOut,
  Building2,
  Mail,
  Clock,
  Radio,
  PlusCircle,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { useAuthStore } from '../../store/index.js'
import { useNotificationStore } from '../../store/notificationStore.js'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const { isConnected, notifications } = useNotificationStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // User display details with smart fallbacks
  const userName = user?.name || 'SupplyChain Operations Lead'
  const userEmail = user?.email || 'operations@supplyshield.ai'
  const userRole = user?.role || 'Regional Distribution Director'
  const userCompany = user?.company || 'SupplyShield AI — Regional FMCG Network'
  const initial = userName.charAt(0).toUpperCase()

  return (
    <AppLayout
      pageTitle="Operations Lead Profile"
      breadcrumbs={['SupplyShield', 'User Profile']}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Hero Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Top Banner Gradient */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 p-6 flex items-start justify-between relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
              <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-300 animate-pulse' : 'text-amber-300'}`} />
              <span>{isConnected ? 'Live WebSocket Connected' : 'Connecting to Server'}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>

            {/* Ambient pattern */}
            <div className="absolute right-0 bottom-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* User Details Strip */}
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 sm:-mt-16 gap-4 mb-4">
              {/* Avatar */}
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-1 shadow-xl ring-4 ring-white flex items-center justify-center text-white font-extrabold text-3xl sm:text-4xl">
                    {initial}
                  </div>
                  <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{userName}</h1>
                    <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                      Verified Lead
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500">{userRole}</p>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/onboarding')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-102 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Onboard Facility with Ray AI</span>
                </button>
              </div>
            </div>

            {/* User Meta Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Email Address</div>
                  <div className="font-semibold text-slate-800 truncate">{userEmail}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Organization</div>
                  <div className="font-semibold text-slate-800 truncate">{userCompany}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Region</div>
                  <div className="font-semibold text-slate-800 truncate">Western Maharashtra Cluster</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Facilities & Retail Store Network */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Assigned Warehouses & Distribution Centers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Warehouses Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Assigned Distribution Centers (DCs)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Primary hubs monitored under your operational scope
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/network-map')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
                >
                  <span>View in Map</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Facilities List */}
              <div className="space-y-3.5">
                {/* Facility 1 */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Bhiwandi Central DC</span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                          WH-MUM-01
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                          Primary Hub
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Bhiwandi Industrial Corridor • 24,000 sq ft • 14 Inbound/Outbound Dock Bays
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900">78% Utilization</span>
                      <p className="text-[10px] text-emerald-600 font-semibold">Capacity Optimal</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Zone Type</span>
                      <strong className="text-slate-800">Ambient + Cold</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Dispatches/Day</span>
                      <strong className="text-slate-800">42 Truckloads</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Connected Stores</span>
                      <strong className="text-slate-800">12 Stores</strong>
                    </div>
                  </div>
                </div>

                {/* Facility 2 */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Pune Metro Fulfillment Hub</span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                          WH-PUN-02
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800">
                          Cross-Dock
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Hinjewadi Tech Corridor • 18,500 sq ft • Direct Supermarket Cross-Docking
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900">84% Utilization</span>
                      <p className="text-[10px] text-emerald-600 font-semibold">High Throughput</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Zone Type</span>
                      <strong className="text-slate-800">High-Velocity</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Fill-Rate</span>
                      <strong className="text-slate-800">99.4% SLA</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Reorder Buffer</span>
                      <strong className="text-slate-800">Dynamic FEFO</strong>
                    </div>
                  </div>
                </div>

                {/* Facility 3 */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Nagpur Cold-Chain Center</span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                          WH-NAG-03
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800">
                          Deep-Freeze
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Central Maharashtra Perishables • 12,000 sq ft • -18°C Dairy & Frozen Bay
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900">62% Utilization</span>
                      <p className="text-[10px] text-emerald-600 font-semibold">Available Capacity</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Regional Retail Store Network */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Regional Retail Network Portfolio
                    </h2>
                    <p className="text-xs text-slate-500">
                      12 High-Velocity Supermarkets & Outlets Connected
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/inventory-table')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
                >
                  <span>Inventory Matrix</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block font-bold">Store S-04 (Colaba, Mumbai)</strong>
                    <span className="text-[11px] text-slate-500">Daily Milk Velocity: 420L/day</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block font-bold">Store S-02 (Kothrud, Pune)</strong>
                    <span className="text-[11px] text-slate-500">High Yogurt & Paneer Turnover</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block font-bold">Store S-03 (Thane Central)</strong>
                    <span className="text-[11px] text-slate-500">Weekend Bulk Pantry Restock</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block font-bold">+ 9 Additional Outlets</strong>
                    <span className="text-[11px] text-slate-500">Navi Mumbai, Pimpri, Andheri</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-sky-100 text-sky-800">
                    Synced
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Permissions & Telemetry */}
          <div className="space-y-6">
            {/* Operational Privileges */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Authorizations</h3>
                  <p className="text-[11px] text-slate-500">Role-Based Access Control (RBAC)</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>OR-Tools MILP Dispatch</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Granted
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dynamic FEFO Override</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Granted
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Highway Disruption Sandbox</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Granted
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sensor Telemetry Calibration</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Full
                  </span>
                </div>
              </div>
            </div>

            {/* Live Security & Telemetry Box */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-3">
                <Activity className="w-4 h-4" />
                <span>Live Telemetry Engine</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">WebSocket Push:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {isConnected ? 'ONLINE (Port 5000)' : 'CONNECTING'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Buffered Alerts:</span>
                  <span className="font-mono font-bold text-white">
                    {notifications.length} events logged
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Authentication:</span>
                  <span className="font-mono text-slate-300">Signed JWT 256-bit</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Audit Logging:</span>
                  <span className="font-mono text-emerald-400 font-bold">Immutable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
