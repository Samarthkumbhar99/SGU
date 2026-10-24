import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Building,
  Phone,
  Shield,
  MapPin,
  Calendar,
  Clock,
  Store,
  Warehouse,
  X,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sliders,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore, useUIStore, useEntityStore } from '../../store/index.js'
import { entityAPI } from '../../services/api.js'

export default function UserProfileModal() {
  const { user, logout } = useAuthStore()
  const { profileModalOpen, setProfileModalOpen } = useUIStore()
  const { stores, warehouses, setLiveLocation } = useEntityStore()
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'stores' | 'warehouses'
  const [gpsRefreshing, setGpsRefreshing] = useState(false)
  const [gpsSuccess, setGpsSuccess] = useState(false)

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && profileModalOpen) {
        setProfileModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [profileModalOpen, setProfileModalOpen])

  if (!profileModalOpen) return null

  const handleRefreshLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setGpsRefreshing(true)
    setGpsSuccess(false)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords
          const res = await entityAPI.updateLiveLocation({
            latitude,
            longitude,
            accuracy,
            city: user?.liveLocation?.city || 'Live GPS Node',
            address: user?.liveLocation?.address || 'Synchronized Location',
          })
          setLiveLocation(res.data.liveLocation)
          setGpsSuccess(true)
          setTimeout(() => setGpsSuccess(false), 3000)
        } catch (err) {
          console.error('Failed to sync live location:', err)
        } finally {
          setGpsRefreshing(false)
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message)
        setGpsRefreshing(false)
      },
      { timeout: 10000 }
    )
  }

  const handleLogout = () => {
    setProfileModalOpen(false)
    logout()
  }

  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto select-none" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setProfileModalOpen(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden transform transition-all duration-200 animate-scale-up">
          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 p-6 text-white overflow-hidden">
            {/* Ambient pattern */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white/80 shadow-md bg-white"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white text-sky-700 font-extrabold text-2xl flex items-center justify-center border-2 border-white/80 shadow-md">
                      {initial}
                    </div>
                  )}
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-xs"
                    title="Active User"
                  />
                </div>

                {/* Name & Role */}
                <div>
                  <h2 className="text-xl font-bold leading-tight flex items-center gap-2">
                    {user?.name || 'SupplyChain Professional'}
                  </h2>
                  <p className="text-xs text-sky-100 flex items-center gap-1.5 mt-0.5">
                    <Mail size={12} />
                    {user?.email || 'user@supplyshield.ai'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-xs text-white border border-white/30">
                      {user?.role || 'Distribution Manager'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/80 text-white flex items-center gap-1">
                      <CheckCircle2 size={11} /> Verified FMCG Node
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center px-6 border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600 gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-sky-600 text-sky-700 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Overview &amp; Contact
            </button>
            <button
              onClick={() => setActiveTab('stores')}
              className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'stores'
                  ? 'border-sky-600 text-sky-700 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Store size={14} />
              Managed Stores ({stores.length})
            </button>
            <button
              onClick={() => setActiveTab('warehouses')}
              className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'warehouses'
                  ? 'border-sky-600 text-sky-700 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Warehouse size={14} />
              Distribution Centers ({warehouses.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* User Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Organization / Company
                    </span>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Building size={16} className="text-sky-600" />
                      <span>{user?.company || 'SupplyShield FMCG Logistics Network'}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Contact Phone
                    </span>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Phone size={16} className="text-sky-600" />
                      <span>{user?.phone || '+91 (022) 8890-4421'}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      System Authorization Level
                    </span>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Shield size={16} className="text-sky-600" />
                      <span>{user?.role === 'Admin' ? 'Super Administrator' : 'Network Controller & Optimizer'}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Onboarding Status
                    </span>
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>Verified &amp; Configured by RAY AI</span>
                    </div>
                  </div>
                </div>

                {/* Live Geolocation Section */}
                <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-950 uppercase tracking-wide">
                      <MapPin size={15} className="text-sky-600" />
                      Live Geolocation &amp; Dispatch Node
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshLocation}
                      disabled={gpsRefreshing}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 shadow-2xs transition-all cursor-pointer"
                    >
                      <RefreshCw size={12} className={gpsRefreshing ? 'animate-spin' : ''} />
                      {gpsRefreshing ? 'Acquiring GPS…' : 'Sync GPS'}
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-900">
                      {user?.liveLocation?.address || 'Commercial Distribution Hub, Metropolitan Sector'}
                    </p>
                    <p className="text-slate-500">
                      City: <span className="font-medium text-slate-700">{user?.liveLocation?.city || 'Mumbai Metro'}</span> • Coordinates:{' '}
                      <span className="font-mono text-slate-700">
                        {user?.liveLocation?.latitude ? `${user.liveLocation.latitude.toFixed(4)}°N, ${user.liveLocation.longitude.toFixed(4)}°E` : '19.0760°N, 72.8777°E'}
                      </span>
                    </p>
                    {gpsSuccess && (
                      <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 pt-1">
                        <CheckCircle2 size={12} /> Live coordinates refreshed and calibrated with central solver!
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Asset Summary Cards */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div
                    onClick={() => setActiveTab('stores')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Retail Stores</span>
                      <div className="text-lg font-bold text-slate-900">{stores.length} Assigned</div>
                    </div>
                    <ChevronRight size={18} className="text-slate-400" />
                  </div>

                  <div
                    onClick={() => setActiveTab('warehouses')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Warehouses &amp; DCs</span>
                      <div className="text-lg font-bold text-slate-900">{warehouses.length} Active</div>
                    </div>
                    <ChevronRight size={18} className="text-slate-400" />
                  </div>
                </div>
              </>
            )}

            {/* Managed Stores Tab */}
            {activeTab === 'stores' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-500">
                  Stores under your replenishment authority and dispatch coverage:
                </div>
                {stores.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-slate-700">No stores linked yet</p>
                    <p className="text-xs text-slate-400 mt-1">Register new retail nodes in the Dashboard to monitor stock here.</p>
                  </div>
                ) : (
                  stores.map((s) => (
                    <div
                      key={s._id || s.code}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 shadow-2xs transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            {s.name}
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                              {s.code || 'STR-LOC'}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {s.category || 'Supermarket'} • {s.location?.address || s.location?.city || 'Local Hub'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {s.status || 'Active'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 text-xs">
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Stock Units</span>
                          <span className="font-bold text-slate-800">{(s.currentStockUnits || 14200).toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Demand/Day</span>
                          <span className="font-bold text-slate-800">{(s.dailyDemandVelocity || 4500).toLocaleString()} u/d</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Safety Buffer</span>
                          <span className="font-bold text-slate-800">{(s.safetyStockUnits || 1200).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Managed Warehouses Tab */}
            {activeTab === 'warehouses' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-500">
                  Regional distribution centers &amp; transit hubs under management:
                </div>
                {warehouses.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <Warehouse className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-slate-700">No distribution centers assigned</p>
                    <p className="text-xs text-slate-400 mt-1">Register a distribution hub in the Dashboard to inspect logistics telemetry.</p>
                  </div>
                ) : (
                  warehouses.map((w) => (
                    <div
                      key={w._id || w.code}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 shadow-2xs transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            {w.name}
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                              {w.code || 'DC-LOC'}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {w.type || 'Regional Distribution Center'} • {w.location?.city || 'Hub'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                          {w.status || 'Operational'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 text-xs">
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Pallet Capacity</span>
                          <span className="font-bold text-slate-800">{w.totalPalletCapacity || 4500} plts</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Fleet Count</span>
                          <span className="font-bold text-slate-800">{w.fleetCount || 18} Vans</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Cold-Chain</span>
                          <span className="font-bold text-emerald-700 font-semibold">
                            {w.temperatureControlled ? 'Enabled' : 'Ambient'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              Sign Out
            </button>

            <button
              type="button"
              onClick={() => setProfileModalOpen(false)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all cursor-pointer bg-slate-200/80"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
