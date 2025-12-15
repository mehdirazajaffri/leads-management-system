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
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Status Management</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Create Status
          </button>
        </div>

        {showCreate && (
          <div className="mb-4 p-4 border rounded">
            <h3 className="font-bold mb-2">Create New Status</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Status Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isFinal}
                  onChange={(e) => setFormData({ ...formData, isFinal: e.target.checked })}
                  className="mr-2"
                />
                Final Status (Converted/Not Converted)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreate(false)
                    setFormData({ name: '', isFinal: false })
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {statuses.map((status) => (
            <div key={status.id} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-medium">{status.name}</p>
                <p className="text-sm text-gray-500">
                  {status.isFinal ? 'Final Status' : 'Intermediate Status'}
                </p>
              </div>
              <button
                onClick={() => handleDelete(status.id)}
                className="text-red-600 hover:text-red-800"
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

