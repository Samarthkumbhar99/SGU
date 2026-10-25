import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
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
} from 'lucide-react'
import { useAuthStore } from '../../store/index.js'

export default function ProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleLogout = () => {
    onClose()
    logout()
    navigate('/login')
  }

  const handleOnboarding = () => {
    onClose()
    navigate('/onboarding')
  }

  // Derive display values
  const userName = user?.name || 'SupplyChain Ops Lead'
  const userEmail = user?.email || 'operations@supplyshield.ai'
  const userRole = user?.role || 'Distribution Operations Lead'
  const userCompany = user?.company || 'SupplyShield AI — Regional FMCG Network'
  const initial = userName.charAt(0).toUpperCase()

  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto p-4 sm:p-6 md:p-10 select-none flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Profile Card Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Background with Gradient Banner */}
        <div className="relative h-28 bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 p-6 flex items-start justify-between">
          <div className="flex items-center gap-2 text-white/90 text-xs font-semibold">
            <Radio className="w-3 h-3 text-emerald-300 animate-pulse" />
            <span>Active Operations Session</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Avatar & Identity Banner */}
        <div className="px-6 pb-6 relative">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-1 shadow-lg ring-4 ring-white flex items-center justify-center text-white font-extrabold text-2xl">
                {initial}
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
              {userRole}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{userName}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {userEmail}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {userCompany}
              </span>
            </div>
          </div>

          {/* Assigned Facilities & Operational Portfolio */}
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5 text-sky-600" />
                Assigned Distribution Centers & Warehouses
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Bhiwandi Central DC</span>
                    <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded">
                      WH-MUM-01
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Primary Western Hub • Ambient & Cold-Chain</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-600 font-semibold">
                    <span>Capacity: 78%</span>
                    <span>•</span>
                    <span className="text-emerald-800">Status: Optimal</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Pune Metro Hub</span>
                    <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded">
                      WH-PUN-02
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Regional Cross-Docking • Fast Fulfillment</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-600 font-semibold">
                    <span>Capacity: 84%</span>
                    <span>•</span>
                    <span className="text-emerald-800">Status: Optimal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monitored Retail Network */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-sky-600" />
                Regional Retail Network Coverage
              </h3>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">12 Connected Retail Stores</span>
                  <p className="text-[11px] text-slate-500">Mumbai, Pune, Thane & Navi Mumbai Metropolitan Network</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 font-mono text-[11px] font-bold">
                  48 Active SKUs
                </span>
              </div>
            </div>

            {/* Permissions & Security Privileges */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Operational Authorizations
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Google OR-Tools MILP Dispatch: <strong className="text-emerald-800">Granted</strong>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Dynamic FEFO Override: <strong className="text-emerald-800">Granted</strong>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Disruption Re-route Trigger: <strong className="text-emerald-800">Granted</strong>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Sensor Telemetry Write: <strong className="text-emerald-800">Granted</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleOnboarding}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs border border-sky-200 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-sky-700" />
              <span>Onboard New Facility / Store</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
