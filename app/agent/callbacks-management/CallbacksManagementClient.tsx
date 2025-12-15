'use client'

import { useState, useEffect } from 'react'
import DataTable, { type DataTableColumn } from '@/components/features/DataTable'
import { formatDateReadable } from '@/lib/date-utils'
import { useToast } from '@/context/ToastContext'

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
  const toast = useToast()
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
        toast.success('Callback marked as completed')
        fetchCallbacks()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to mark callback as completed')
      }
    } catch (error) {
      toast.error('Failed to mark callback as completed')
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

      {(() => {
        const columns: DataTableColumn<Callback>[] = [
          {
            id: 'lead',
            header: 'NAME',
            sortValue: (r) => r.lead.name,
            searchValue: (r) => `${r.lead.name} ${r.lead.email} ${r.lead.phone}`,
            cell: (r) => (
              <div>
                <div className="font-semibold text-slate-900">{r.lead.name}</div>
                <div className="text-xs text-slate-500 mt-1">{r.lead.email}</div>
              </div>
            ),
          },
          {
            id: 'date',
            header: 'START DATE',
            sortValue: (r) => new Date(r.scheduledDate).getTime(),
            cell: (r) => (
              <span className="text-slate-600">
                {formatDateReadable(r.scheduledDate)}
                {r.scheduledTime ? ` at ${r.scheduledTime}` : ''}
              </span>
            ),
          },
          {
            id: 'notes',
            header: 'OFFICE',
            searchValue: (r) => r.notes || '',
            cell: (r) => <span className="text-slate-600">{r.notes || '-'}</span>,
          },
          {
            id: 'actions',
            header: '',
            cell: (r) =>
              r.completed ? (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Completed
                </span>
              ) : (
                <button
                  onClick={() => handleComplete(r.id)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Mark Complete
                </button>
              ),
          },
        ]

        return (
          <DataTable
            title="Callbacks Management"
            subtitle="A lightweight, extendable, dependency-free javascript HTML table plugin."
            rows={callbacks}
            columns={columns}
            getRowId={(r) => r.id}
          />
        )
      })()}
    </div>
  )
}

