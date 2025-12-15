'use client'

import { useState, useEffect } from 'react'

interface Callback {
  id: string
  scheduledDate: string
  scheduledTime: string | null
  notes: string | null
  completed: boolean
  lead: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export default function CallbacksManagementClient() {
  const [callbacks, setCallbacks] = useState<Callback[]>([])
  const [filter, setFilter] = useState<'upcoming' | 'overdue' | 'completed'>('upcoming')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCallbacks()
  }, [filter])

  const fetchCallbacks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agent/callbacks?filter=${filter}`)
      const data = await res.json()
      if (res.ok) {
        setCallbacks(data)
      }
    } catch (error) {
      console.error('Failed to fetch callbacks', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch('/api/agent/callbacks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: true }),
      })

      if (res.ok) {
        fetchCallbacks()
      }
    } catch (error) {
      alert('Failed to mark callback as completed')
    }
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded ${
            filter === 'upcoming' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-4 py-2 rounded ${
            filter === 'overdue' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
          }`}
        >
          Overdue
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded ${
            filter === 'completed' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
          }`}
        >
          Completed
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Lead
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Scheduled Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {callbacks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No callbacks found
                </td>
              </tr>
            ) : (
              callbacks.map((callback) => (
                <tr key={callback.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{callback.lead.name}</p>
                      <p className="text-sm text-gray-500">{callback.lead.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(callback.scheduledDate).toLocaleDateString()}
                    {callback.scheduledTime && ` at ${callback.scheduledTime}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {callback.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!callback.completed && (
                      <button
                        onClick={() => handleComplete(callback.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Mark Complete
                      </button>
                    )}
                    {callback.completed && (
                      <span className="text-gray-500">Completed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

