import { useState } from 'react'
import { Search, X, Building2, Store, MapPin, CheckCircle2, Send, ShieldCheck, User } from 'lucide-react'
import { useAuthStore, toast } from '../../../store/index.js'

export default function SearchNetworkModal({ isOpen, onClose, defaultType = 'all' }) {
  const { token, user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState(defaultType)
  const [results, setResults] = useState({ stores: [], warehouses: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [roleRequested, setRoleRequested] = useState('Co-Manager')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState(null)

  if (!isOpen) return null

  const handleSearch = async (q = query, type = filterType) => {
    setIsSearching(true)
    try {
      const res = await fetch(`http://localhost:5000/api/v1/entities/search?q=${encodeURIComponent(q)}&type=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (data.success) {
        setResults(data.data)
      }
    } catch (e) {
      console.error('Search network failed:', e)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmitRequest = async () => {
    if (!selectedEntity) return

    setIsSubmitting(true)
    try {
      const res = await fetch('http://localhost:5000/api/v1/entities/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetType: selectedEntity.targetType,
          targetId: selectedEntity._id,
          roleRequested,
          reason: reason || `Requesting ${roleRequested} delegation to coordinate replenishment.`,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSubmittedId(selectedEntity._id)
        toast.success(
          `Access request sent to ${selectedEntity.owner?.name || 'entity manager'}.`,
          'Request Dispatched'
        )
      } else {
        toast.error(data.message || 'Could not send request')
      }
    } catch (e) {
      toast.error('Network error submitting access request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
              <h3 className="text-base font-bold text-slate-900">
                Search & Claim FMCG Network Nodes
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Find an existing facility to co-manage or send a delegation request to the registered manager.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Filters */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  handleSearch(e.target.value, filterType)
                }}
                placeholder="Search by facility name, store code (e.g. STR-MUM), or city…"
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSearch(query, filterType)}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Search
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            {['all', 'store', 'warehouse'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setFilterType(t)
                  handleSearch(query, t)
                }}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                  filterType === t
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t === 'all' ? 'All Nodes' : t === 'store' ? 'Stores Only' : 'Warehouses Only'}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-100">
          {isSearching && (
            <div className="py-8 text-center text-xs text-slate-500">
              Querying regional network nodes…
            </div>
          )}

          {!isSearching &&
            results.stores.length === 0 &&
            results.warehouses.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                Type a query above to search registered stores and warehouses.
              </div>
            )}

          {/* Store Results */}
          {results.stores.map((st) => {
            const isSelected = selectedEntity?._id === st._id
            const isRequested = submittedId === st._id
            return (
              <div
                key={st._id}
                className={`py-3.5 px-3 rounded-xl transition-colors flex items-center justify-between ${
                  isSelected ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{st.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                        {st.code}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        {st.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {st.location?.city || 'Regional Node'}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        Manager: {st.owner?.name || 'Administrator'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {isRequested ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Requested
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedEntity({ ...st, targetType: 'Store' })}
                      className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 cursor-pointer"
                    >
                      {isSelected ? 'Selected' : 'Request Access'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Warehouse Results */}
          {results.warehouses.map((wh) => {
            const isSelected = selectedEntity?._id === wh._id
            const isRequested = submittedId === wh._id
            return (
              <div
                key={wh._id}
                className={`py-3.5 px-3 rounded-xl transition-colors flex items-center justify-between ${
                  isSelected ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{wh.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                        {wh.code}
                      </span>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.2 rounded-full border border-blue-200">
                        {wh.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {wh.location?.city || 'Depot'}
                      </span>
                      <span>·</span>
                      <span>{wh.totalPalletCapacity || 5000} Pallets</span>
                      <span>·</span>
                      <span>Manager: {wh.owner?.name || 'Administrator'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {isRequested ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Requested
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedEntity({ ...wh, targetType: 'Warehouse' })}
                      className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 cursor-pointer"
                    >
                      {isSelected ? 'Selected' : 'Request Access'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Entity Access Request Action Panel */}
        {selectedEntity && (
          <div className="p-5 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                Request Co-Manager Authorization for {selectedEntity.name} ({selectedEntity.code})
              </span>
              <button
                type="button"
                onClick={() => setSelectedEntity(null)}
                className="text-[11px] text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Role Requested</label>
                <select
                  value={roleRequested}
                  onChange={(e) => setRoleRequested(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Co-Manager">Co-Manager (Full Access)</option>
                  <option value="Shift Supervisor">Shift Supervisor</option>
                  <option value="Inventory Auditor">Inventory Auditor</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Request Reason / Memo</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Taking over morning replenishment schedule"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sending Request…' : 'Submit Access Request to Entity Manager'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
