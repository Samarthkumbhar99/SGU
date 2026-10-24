import { useState } from 'react'
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Truck,
  Layers,
  ThermometerSnowflake,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react'
import { useAuthStore, useEntityStore, toast } from '../../../store/index.js'

export default function MyWarehousesSection({ onOpenSearchModal }) {
  const { token, user } = useAuthStore()
  const { warehouses, addWarehouse, updateWarehouseInList, liveLocation } = useEntityStore()

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [type, setType] = useState('Regional Distribution Center')
  const [totalPalletCapacity, setTotalPalletCapacity] = useState('5000')
  const [usedPalletCapacity, setUsedPalletCapacity] = useState('3200')
  const [dockCount, setDockCount] = useState('14')
  const [fleetCount, setFleetCount] = useState('20')
  const [temperatureControlled, setTemperatureControlled] = useState(true)

  // Custom location
  const [customCity, setCustomCity] = useState(liveLocation?.city || 'Pune Hub')
  const [customLat, setCustomLat] = useState(liveLocation?.latitude || 18.5204)
  const [customLng, setCustomLng] = useState(liveLocation?.longitude || 73.8567)

  const handleOpenEdit = (wh) => {
    setEditingWarehouse(wh)
    setName(wh.name)
    setType(wh.type)
    setTotalPalletCapacity(wh.totalPalletCapacity || '5000')
    setUsedPalletCapacity(wh.usedPalletCapacity || '3200')
    setDockCount(wh.dockCount || '14')
    setFleetCount(wh.fleetCount || '20')
    setTemperatureControlled(wh.temperatureControlled !== undefined ? wh.temperatureControlled : true)
    setCustomCity(wh.location?.city || 'Pune Hub')
    setCustomLat(wh.location?.latitude || 18.5204)
    setCustomLng(wh.location?.longitude || 73.8567)
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setEditingWarehouse(null)
    setName('')
    setType('Regional Distribution Center')
    setTotalPalletCapacity('5000')
    setUsedPalletCapacity('3200')
    setDockCount('14')
    setFleetCount('20')
    setTemperatureControlled(true)
  }

  const handleSaveWarehouse = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Warehouse name is required')
      return
    }

    setIsSubmitting(true)
    const payload = {
      name,
      type,
      totalPalletCapacity: Number(totalPalletCapacity),
      usedPalletCapacity: Number(usedPalletCapacity),
      dockCount: Number(dockCount),
      fleetCount: Number(fleetCount),
      temperatureControlled,
      location: {
        latitude: Number(customLat),
        longitude: Number(customLng),
        city: customCity,
        accuracy: 10,
        address: `${customCity} National Highway Logistics Corridor`,
      },
    }

    try {
      if (editingWarehouse) {
        const res = await fetch(`http://localhost:5000/api/v1/entities/warehouses/${editingWarehouse._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.success) {
          updateWarehouseInList(data.data)
          toast.success(`Warehouse "${name}" updated successfully.`, 'DC Updated')
          handleCloseModal()
        } else {
          toast.error(data.message || 'Update failed')
        }
      } else {
        const res = await fetch('http://localhost:5000/api/v1/entities/warehouses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.success) {
          addWarehouse(data.data)
          toast.success(`Warehouse "${name}" registered in FMCG network.`, 'DC Registered')
          handleCloseModal()
        } else {
          toast.error(data.message || 'Registration failed')
        }
      }
    } catch (e) {
      toast.error('Network error saving warehouse')
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
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              My Distribution Centers & Regional Warehouses
            </h2>
            <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              {warehouses.length} Active DCs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-10">
            Monitor pallet bay utilization, cold-chain temperature status, dock throughput, and fleet allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearchModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search & Claim Existing DC</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Warehouse</span>
          </button>
        </div>
      </div>

      {/* Warehouses Grid */}
      {warehouses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No regional warehouses registered</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Register your regional depot or search the network to co-manage existing distribution facilities.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              + Register Warehouse DC
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
          {warehouses.map((wh) => {
            const used = wh.usedPalletCapacity || 3200
            const total = wh.totalPalletCapacity || 5000
            const utilPct = Math.min(100, Math.round((used / total) * 100))

            return (
              <div
                key={wh._id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{wh.name}</h3>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {wh.code || 'DC-001'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.2 rounded-full border border-blue-200">
                          {wh.type}
                        </span>
                        {wh.temperatureControlled && (
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded-full border border-teal-200 flex items-center gap-0.5">
                            <ThermometerSnowflake className="w-2.5 h-2.5" /> Cold Chain
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(wh)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit DC Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pallet Utilization Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Pallet Capacity</span>
                      <span className="font-mono font-bold text-slate-900">
                        {utilPct}% ({used.toLocaleString()} / {total.toLocaleString()} pallets)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          utilPct > 90 ? 'bg-rose-500' : utilPct > 75 ? 'bg-amber-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${utilPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Dock & Fleet Spec Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-3 border-t border-slate-100 mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Docks</span>
                      <span className="font-mono font-bold text-slate-800">
                        {wh.dockCount || 12} Loading Bays
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Fleet Trucks</span>
                      <span className="font-mono font-bold text-slate-800">
                        {wh.fleetCount || 18} Vehicles
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer with GPS pin */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {wh.location?.city || 'Pune Hub'}
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">
                    {wh.location?.latitude?.toFixed(2)}°N, {wh.location?.longitude?.toFixed(2)}°E
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Warehouse Modal */}
      {(isCreateModalOpen || editingWarehouse) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {editingWarehouse ? `Edit DC: ${editingWarehouse.name}` : 'Register New Warehouse / DC'}
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

            <form onSubmit={handleSaveWarehouse} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Facility / DC Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pune Regional Central DC — Hub 4"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Facility Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Regional Distribution Center">Regional Distribution Center</option>
                    <option value="Cold-Chain Depot">Cold-Chain Depot</option>
                    <option value="Transit Hub">Transit Hub</option>
                    <option value="Urban Fulfillment Hub">Urban Fulfillment Hub</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Total Pallet Capacity</label>
                  <input
                    type="number"
                    value={totalPalletCapacity}
                    onChange={(e) => setTotalPalletCapacity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Loading Bays (Docks)</label>
                  <input
                    type="number"
                    value={dockCount}
                    onChange={(e) => setDockCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Vehicles (Fleet)</label>
                  <input
                    type="number"
                    value={fleetCount}
                    onChange={(e) => setFleetCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tempCtrl"
                  checked={temperatureControlled}
                  onChange={(e) => setTemperatureControlled(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="tempCtrl" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Cold-Chain & Refrigerated Storage Bay Compliant
                </label>
              </div>

              {/* Geolocation Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Warehouse Geolocation & Coordinates
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
                  {isSubmitting ? 'Saving…' : editingWarehouse ? 'Update DC Profile' : 'Register DC in Network'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
