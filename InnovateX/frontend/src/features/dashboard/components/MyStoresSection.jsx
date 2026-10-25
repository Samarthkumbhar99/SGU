import { useState } from 'react'
import {
  Store,
  Plus,
  Search,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Clock,
  Edit2,
  Phone,
  CheckCircle2,
  RefreshCw,
  Compass,
  X,
} from 'lucide-react'
import { useAuthStore, useEntityStore, toast } from '../../../store/index.js'

export default function MyStoresSection({ onOpenSearchModal }) {
  const { token, user } = useAuthStore()
  const { stores, addStore, updateStoreInList, liveLocation } = useEntityStore()

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingStore, setEditingStore] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Supermarket')
  const [dailyDemandVelocity, setDailyDemandVelocity] = useState('4200')
  const [safetyStockUnits, setSafetyStockUnits] = useState('1200')
  const [maxShelfCapacityUnits, setMaxShelfCapacityUnits] = useState('15000')
  const [currentStockUnits, setCurrentStockUnits] = useState('11400')
  const [serviceLeadTimeHours, setServiceLeadTimeHours] = useState('3.2')
  const [contactPhone, setContactPhone] = useState(user?.phone || '')

  // Custom location fields
  const [customCity, setCustomCity] = useState(liveLocation?.city || 'Mumbai Central')
  const [customLat, setCustomLat] = useState(liveLocation?.latitude || 19.0760)
  const [customLng, setCustomLng] = useState(liveLocation?.longitude || 72.8777)

  // Open Edit Modal with store data
  const handleOpenEdit = (st) => {
    setEditingStore(st)
    setName(st.name)
    setCategory(st.category)
    setDailyDemandVelocity(st.dailyDemandVelocity || '4200')
    setSafetyStockUnits(st.safetyStockUnits || '1200')
    setMaxShelfCapacityUnits(st.maxShelfCapacityUnits || '15000')
    setCurrentStockUnits(st.currentStockUnits || '11400')
    setServiceLeadTimeHours(st.serviceLeadTimeHours || '3.2')
    setContactPhone(st.contactPhone || '')
    setCustomCity(st.location?.city || 'Mumbai Central')
    setCustomLat(st.location?.latitude || 19.0760)
    setCustomLng(st.location?.longitude || 72.8777)
  }

  // Reset form
  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setEditingStore(null)
    setName('')
    setCategory('Supermarket')
    setDailyDemandVelocity('4200')
    setSafetyStockUnits('1200')
    setMaxShelfCapacityUnits('15000')
    setCurrentStockUnits('11400')
    setServiceLeadTimeHours('3.2')
    setContactPhone(user?.phone || '')
  }

  // Handle Create or Update
  const handleSaveStore = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Store name is required')
      return
    }

    setIsSubmitting(true)
    const payload = {
      name,
      category,
      dailyDemandVelocity: Number(dailyDemandVelocity),
      safetyStockUnits: Number(safetyStockUnits),
      maxShelfCapacityUnits: Number(maxShelfCapacityUnits),
      currentStockUnits: Number(currentStockUnits),
      serviceLeadTimeHours: Number(serviceLeadTimeHours),
      contactPhone,
      location: {
        latitude: Number(customLat),
        longitude: Number(customLng),
        city: customCity,
        accuracy: 10,
        address: `${customCity} Commercial Retail Hub`,
      },
    }

    try {
      if (editingStore) {
        // PUT update
        const res = await fetch(`http://localhost:5000/api/v1/entities/stores/${editingStore._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.success) {
          updateStoreInList(data.data)
          toast.success(`Store "${name}" updated successfully.`, 'Store Updated')
          handleCloseModal()
        } else {
          toast.error(data.message || 'Update failed')
        }
      } else {
        // POST create
        const res = await fetch('http://localhost:5000/api/v1/entities/stores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.success) {
          addStore(data.data)
          toast.success(`Store "${name}" registered in FMCG network.`, 'Store Created')
          handleCloseModal()
        } else {
          toast.error(data.message || 'Creation failed')
        }
      }
    } catch (err) {
      toast.error('Network error saving store')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mb-10">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              My Retail Stores & Supermarket Nodes
            </h2>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {stores.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-10">
            Manage your store replenishment profiles, shelf velocity, and live GPS locations for FMCG dispatch routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearchModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search & Claim Existing</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Store</span>
          </button>
        </div>
      </div>

      {/* Stores Grid */}
      {stores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center">
          <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No stores registered yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Register your first retail store or search the network to co-manage existing supermarket nodes.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              + Register Store Now
            </button>
            <button
              type="button"
              onClick={onOpenSearchModal}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Search Existing Nodes
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((st) => {
            const fillPct = Math.min(
              100,
              Math.round(((st.currentStockUnits || 12000) / (st.maxShelfCapacityUnits || 15000)) * 100)
            )
            const isLow = fillPct < 30

            return (
              <div
                key={st._id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{st.name}</h3>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {st.code || 'STR-001'}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200 mt-1 inline-block">
                        {st.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(st)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Store Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Stock Fill Rate Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Shelf Fill Rate</span>
                      <span className={`font-mono font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                        {fillPct}% ({st.currentStockUnits?.toLocaleString() || '11,400'} units)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLow ? 'bg-rose-500' : fillPct < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-3 border-t border-slate-100 mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Daily Velocity</span>
                      <span className="font-mono font-bold text-slate-800">
                        {st.dailyDemandVelocity?.toLocaleString() || '4,200'} u/d
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Safety Stock</span>
                      <span className="font-mono font-bold text-slate-800">
                        {st.safetyStockUnits?.toLocaleString() || '1,200'} u
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer with GPS pin */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {st.location?.city || 'Mumbai Central'}
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">
                    {st.location?.latitude?.toFixed(2)}°N, {st.location?.longitude?.toFixed(2)}°E
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Store Modal */}
      {(isCreateModalOpen || editingStore) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {editingStore ? `Edit Store: ${editingStore.name}` : 'Register New Retail Store'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Store / Outlet Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fresh Daily Hypermarket — Bandra West"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Supermarket">Supermarket</option>
                    <option value="Hypermarket">Hypermarket</option>
                    <option value="Metro Express">Metro Express</option>
                    <option value="Cold Retail">Cold Retail</option>
                    <option value="Wholesale Outlet">Wholesale Outlet</option>
                    <option value="Convenience">Convenience</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Max Shelf Capacity (units)</label>
                  <input
                    type="number"
                    value={maxShelfCapacityUnits}
                    onChange={(e) => setMaxShelfCapacityUnits(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Daily Sales Velocity (u/day)</label>
                  <input
                    type="number"
                    value={dailyDemandVelocity}
                    onChange={(e) => setDailyDemandVelocity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Safety Stock Target (units)</label>
                  <input
                    type="number"
                    value={safetyStockUnits}
                    onChange={(e) => setSafetyStockUnits(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Geolocation Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Store Geolocation & Coordinates
                  </span>
                  {liveLocation && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomLat(liveLocation.latitude)
                        setCustomLng(liveLocation.longitude)
                        setCustomCity(liveLocation.city)
                        toast.info('Applied current live GPS coordinates')
                      }}
                      className="text-[11px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
                    >
                      Use My Live GPS
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">City / Zone</label>
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving…' : editingStore ? 'Update Store Profile' : 'Register Store in Network'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
