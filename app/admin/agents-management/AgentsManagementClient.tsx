'use client'

import { useState } from 'react'
import DataTable, { type DataTableColumn } from '@/components/features/DataTable'

interface Agent {
  id: string
  email: string
  name: string
  _count: {
    leadsAssigned: number
  }
}

export default function AgentsManagementClient({
  initialAgents,
}: {
  initialAgents: Agent[]
}) {
  const [agents, setAgents] = useState(initialAgents)
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (res.ok) {
        alert('Agent created successfully')
        setShowCreate(false)
        setFormData({ name: '', email: '', password: '' })
        window.location.reload()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      alert('Failed to create agent')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return

    try {
      const res = await fetch(`/api/admin/agents?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        alert('Agent deleted successfully')
        window.location.reload()
      } else {
        const data = await res.json()
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      alert('Failed to delete agent')
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Agents</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">Manage your team</div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Create Agent
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-slate-900">Create New Agent</h3>
            <p className="mt-1 text-sm text-slate-500">Agents can log in and manage their assigned leads.</p>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
                  setFormData({ name: '', email: '', password: '' })
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {(() => {
        const columns: DataTableColumn<Agent>[] = [
          {
            id: 'name',
            header: 'NAME',
            sortValue: (r) => r.name,
            searchValue: (r) => `${r.name} ${r.email}`,
            cell: (r) => <span className="font-semibold text-slate-900">{r.name}</span>,
          },
          {
            id: 'email',
            header: 'EMAIL',
            sortValue: (r) => r.email,
            searchValue: (r) => r.email,
            cell: (r) => <span className="text-slate-600">{r.email}</span>,
          },
          {
            id: 'assigned',
            header: 'ASSIGNED',
            sortValue: (r) => r._count.leadsAssigned,
            cell: (r) => (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {r._count.leadsAssigned}
              </span>
            ),
          },
          {
            id: 'actions',
            header: '',
            cell: (r) => (
              <button
                onClick={() => handleDelete(r.id)}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                Delete
              </button>
            ),
          },
        ]

        return (
          <DataTable
            title="Datatable Simple"
            subtitle="A lightweight, extendable, dependency-free javascript HTML table plugin."
            rows={agents}
            columns={columns}
            getRowId={(r) => r.id}
          />
        )
      })()}
    </div>
  )
}

