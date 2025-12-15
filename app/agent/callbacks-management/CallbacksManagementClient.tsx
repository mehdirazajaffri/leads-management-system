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
    return (
      <div className="card">
        <div className="card-body text-sm text-slate-600">Loading callbacks…</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('upcoming')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            filter === 'upcoming' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-900'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            filter === 'overdue' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-900'
          }`}
        >
          Overdue
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            filter === 'completed' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-900'
          }`}
        >
          Completed
        </button>
      </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <div className="text-sm font-semibold text-slate-900">Callbacks</div>
          <div className="text-xs text-slate-500 mt-1">{callbacks.length} items</div>
        </div>
        <div className="overflow-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                Lead
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                Scheduled Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {callbacks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  No callbacks found
                </td>
              </tr>
            ) : (
              callbacks.map((callback) => (
                <tr key={callback.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{callback.lead.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{callback.lead.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(callback.scheduledDate).toLocaleDateString()}
                    {callback.scheduledTime && ` at ${callback.scheduledTime}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {callback.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!callback.completed && (
                      <button
                        onClick={() => handleComplete(callback.id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Mark Complete
                      </button>
                    )}
                    {callback.completed && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

