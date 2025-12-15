'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  sourcePlatform: string
  campaignName: string
  assignedTo: { id: string; name: string } | null
  currentStatus: { id: string; name: string }
  createdAt: Date
  lastContactedAt: Date | null
  callbacks: Array<{
    id: string
    scheduledDate: Date
    scheduledTime: string | null
    notes: string | null
  }>
}

interface ActivityLog {
  id: string
  timestamp: Date
  note: string | null
  agent: { name: string }
  oldStatus: { name: string } | null
  newStatus: { name: string } | null
}

interface Status {
  id: string
  name: string
  isFinal: boolean
}

export default function LeadDetailClient({
  lead,
  activityLogs,
  statuses,
}: {
  lead: Lead
  activityLogs: ActivityLog[]
  statuses: Status[]
}) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState(lead.currentStatus.id)
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState(false)

  const handleStatusUpdate = async () => {
    if (selectedStatus === lead.currentStatus.id) {
      alert('Please select a different status')
      return
    }

    setUpdating(true)
    try {
      const res = await fetch(`/api/agent/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatusId: selectedStatus,
          note: note || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        alert('Status updated successfully')
        router.refresh()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lead Details</h1>
        <a
          href="/agent/assigned-leads"
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Back to Leads
        </a>
      </div>

      {/* Lead Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Lead Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{lead.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{lead.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{lead.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Source Platform</p>
            <p className="font-medium">{lead.sourcePlatform}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Campaign</p>
            <p className="font-medium">{lead.campaignName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Status</p>
            <p className="font-medium">{lead.currentStatus.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="font-medium">{new Date(lead.createdAt).toLocaleString()}</p>
          </div>
          {lead.lastContactedAt && (
            <div>
              <p className="text-sm text-gray-500">Last Contacted</p>
              <p className="font-medium">{new Date(lead.lastContactedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Update */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Update Status</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">New Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
          </div>
          <button
            onClick={handleStatusUpdate}
            disabled={updating}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>

      {/* Callbacks */}
      {lead.callbacks.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Scheduled Callbacks</h2>
          <div className="space-y-2">
            {lead.callbacks.map((callback) => (
              <div key={callback.id} className="border-b pb-2">
                <p className="font-medium">
                  {new Date(callback.scheduledDate).toLocaleDateString()}
                  {callback.scheduledTime && ` at ${callback.scheduledTime}`}
                </p>
                {callback.notes && <p className="text-sm text-gray-500">{callback.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Activity Log</h2>
        <div className="space-y-2">
          {activityLogs.length === 0 ? (
            <p className="text-gray-500">No activity yet</p>
          ) : (
            activityLogs.map((log) => (
              <div key={log.id} className="border-b pb-2">
                <p className="text-sm">
                  <span className="font-medium">{log.agent.name}</span>
                  {log.oldStatus && log.newStatus && (
                    <>
                      {' '}
                      changed status from <span className="font-medium">{log.oldStatus.name}</span>{' '}
                      to <span className="font-medium">{log.newStatus.name}</span>
                    </>
                  )}
                </p>
                {log.note && <p className="text-sm text-gray-600 mt-1">{log.note}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

