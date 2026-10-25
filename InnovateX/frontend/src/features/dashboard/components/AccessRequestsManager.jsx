import { useState } from 'react'
import { ShieldCheck, UserCheck, Check, X, Clock, AlertCircle } from 'lucide-react'
import { useAuthStore, useEntityStore, toast } from '../../../store/index.js'

export default function AccessRequestsManager() {
  const { token, user } = useAuthStore()
  const { incomingRequests, outgoingRequests, removeIncomingRequest } = useEntityStore()
  const [processingId, setProcessingId] = useState(null)

  const handleReview = async (requestId, action) => {
    setProcessingId(requestId)
    try {
      const res = await fetch(`http://localhost:5000/api/v1/entities/access-requests/${requestId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.success) {
        removeIncomingRequest(requestId)
        toast.success(
          `Request ${action === 'Approved' ? 'approved — manager granted access' : 'rejected'}.`,
          `Access ${action}`
        )
      } else {
        toast.error(data.message || 'Action failed')
      }
    } catch (e) {
      toast.error('Network error reviewing request')
    } finally {
      setProcessingId(null)
    }
  }

  if (incomingRequests.length === 0 && outgoingRequests.length === 0) {
    return null
  }

  return (
    <div className="mb-10 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center">
          <UserCheck className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Node Delegation & Manager Access Requests
          </h3>
          <p className="text-xs text-slate-500">
            Review staff delegation requests and track outgoing authorization for regional facilities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Requests to Review */}
        <div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Incoming Delegation Requests</span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {incomingRequests.length} Pending
            </span>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
              No pending authorization requests for your facilities.
            </div>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((req) => {
                const targetName = req.targetStore?.name || req.targetWarehouse?.name || 'Your Facility'
                const targetCode = req.targetStore?.code || req.targetWarehouse?.code || 'NODE'
                const isBusy = processingId === req._id

                return (
                  <div
                    key={req._id}
                    className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">
                          {req.requester?.name || 'Staff Member'}
                        </span>
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                          {req.roleRequested}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Requesting co-manager access to <span className="font-semibold text-slate-800">{targetName} ({targetCode})</span>
                      </div>
                      {req.reason && (
                        <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-2 italic">
                          "{req.reason}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => handleReview(req._id, 'Approved')}
                        disabled={isBusy}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Access</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReview(req._id, 'Rejected')}
                        disabled={isBusy}
                        className="py-1.5 px-3 rounded-lg bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Outgoing Requests Tracked */}
        <div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Your Sent Access Requests</span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {outgoingRequests.length} Total
            </span>
          </div>

          {outgoingRequests.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
              You haven't requested access to external nodes yet.
            </div>
          ) : (
            <div className="space-y-3">
              {outgoingRequests.map((req) => {
                const targetName = req.targetStore?.name || req.targetWarehouse?.name || 'Regional Facility'
                const targetCode = req.targetStore?.code || req.targetWarehouse?.code || 'NODE'
                const statusColor =
                  req.status === 'Approved'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : req.status === 'Rejected'
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'

                return (
                  <div
                    key={req._id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{targetName} ({targetCode})</div>
                      <div className="text-[11px] text-slate-500">
                        Managed by {req.targetOwner?.name || 'Administrator'} · Requested as {req.roleRequested}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>
                      ● {req.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
