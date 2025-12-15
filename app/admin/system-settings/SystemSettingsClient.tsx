'use client'

import { useState } from 'react'

interface Status {
  id: string
  name: string
  isFinal: boolean
}

export default function SystemSettingsClient({
  initialStatuses,
}: {
  initialStatuses: Status[]
}) {
  const [statuses, setStatuses] = useState(initialStatuses)
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    isFinal: false,
  })

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'status', ...formData }),
      })

      const data = await res.json()
      if (res.ok) {
        alert('Status created successfully')
        setShowCreate(false)
        setFormData({ name: '', isFinal: false })
        window.location.reload()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      alert('Failed to create status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this status?')) return

    try {
      const res = await fetch(`/api/admin/settings?type=status&id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        alert('Status deleted successfully')
        window.location.reload()
      } else {
        const data = await res.json()
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      alert('Failed to delete status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Settings</div>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Status Management</h2>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Create Status
          </button>
        </div>

        {showCreate && (
          <div className="mx-6 mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Create New Status</h3>
            <div className="mt-3 space-y-2">
              <input
                type="text"
                placeholder="Status Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isFinal}
                  onChange={(e) => setFormData({ ...formData, isFinal: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-slate-700">Final Status (Converted/Not Converted)</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreate(false)
                    setFormData({ name: '', isFinal: false })
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 pb-6 space-y-2">
          {statuses.map((status) => (
            <div key={status.id} className="flex justify-between items-center rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{status.name}</p>
                <p className="text-xs text-slate-500 mt-1">{status.isFinal ? 'Final Status' : 'Intermediate Status'}</p>
              </div>
              <button
                onClick={() => handleDelete(status.id)}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

