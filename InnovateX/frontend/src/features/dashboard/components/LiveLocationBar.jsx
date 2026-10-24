import { useState } from 'react'
import { MapPin, RefreshCw, CheckCircle2, AlertCircle, Compass } from 'lucide-react'
import { useAuthStore, useEntityStore, toast } from '../../../store/index.js'

export default function LiveLocationBar() {
  const { user, token, updateUser } = useAuthStore()
  const { liveLocation, setLiveLocation } = useEntityStore()
  const [isLocating, setIsLocating] = useState(false)

  const activeLoc = liveLocation || user?.liveLocation

  const handleSyncLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          city: 'Live GPS Pin',
          address: `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`,
        }

        setLiveLocation(coords)
        updateUser({ liveLocation: coords })
        setIsLocating(false)
        toast.success(`GPS coordinates calibrated (±${coords.accuracy}m)`, 'Location Synchronized')

        if (token) {
          try {
            await fetch('http://localhost:5000/api/v1/entities/location', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(coords),
            })
          } catch (e) {
            console.error('Failed to sync location to backend:', e)
          }
        }
      },
      (err) => {
        setIsLocating(false)
        toast.warning('Location permission was denied or timed out.', 'GPS Inactive')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs px-4 py-3 flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            activeLoc?.latitude
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
              : 'bg-amber-50 text-amber-600 border border-amber-200/80'
          }`}
        >
          {activeLoc?.latitude ? <MapPin className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">
              {activeLoc?.latitude ? 'Live Operational Telemetry Node' : 'GPS Location Not Calibrated'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                activeLoc?.latitude
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {activeLoc?.latitude ? '● Live GPS Active' : '● Calibration Recommended'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {activeLoc?.latitude
              ? `${activeLoc.latitude}° N, ${activeLoc.longitude}° E · Accuracy ±${activeLoc.accuracy || 10}m · ${activeLoc.city || 'Regional Hub'}`
              : 'SupplyShield MILP uses your live coordinates to calculate dock arrival and transit arcs.'}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSyncLocation}
        disabled={isLocating}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-600' : 'text-slate-500'}`} />
        <span>{isLocating ? 'Acquiring GPS…' : activeLoc?.latitude ? 'Re-Sync Live GPS' : 'Enable Live Location'}</span>
      </button>
    </div>
  )
}
