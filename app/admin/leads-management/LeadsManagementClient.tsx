'use client'

import { useState } from 'react'

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
}

interface Agent {
  id: string
  name: string
}

interface Status {
  id: string
  name: string
}

export default function LeadsManagementClient({
  initialLeads,
  agents,
  statuses,
}: {
  initialLeads: Lead[]
  agents: Agent[]
  statuses: Status[]
}) {
  const [leads, setLeads] = useState(initialLeads)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/leads/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        alert(`Successfully imported ${data.imported} leads`)
        window.location.reload()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      alert('Upload failed')
    } finally {
      setUploading(false)
      setFile(null)
      setShowUpload(false)
    }
  }

  const handleBulkAssign = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select leads to assign')
      return
    }

    const agentId = prompt('Enter agent ID:')
    if (!agentId) return

    try {
      const res = await fetch('/api/admin/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedLeads, agentId }),
      })

      const data = await res.json()
      if (res.ok) {
        alert(`Successfully assigned ${data.updated} leads`)
        window.location.reload()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      alert('Assignment failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Leads</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">Manage, import, assign</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Upload CSV
            </button>
            {selectedLeads.length > 0 && (
              <button
                onClick={handleBulkAssign}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Assign Selected ({selectedLeads.length})
              </button>
            )}
            <a
              href="/api/admin/leads/export"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Export CSV
            </a>
          </div>
        </div>
      </div>

      {showUpload && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-slate-900">Upload CSV</h3>
            <p className="mt-1 text-sm text-slate-500">
              Required headers: <span className="font-mono">Name, Phone, Email, Source Platform, Campaign Name</span>
            </p>
          </div>
          <div className="card-body space-y-3">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
            />
            <div className="flex gap-2">
              <button
                onClick={handleFileUpload}
                disabled={!file || uploading}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <button
                onClick={() => {
                  setShowUpload(false)
                  setFile(null)
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Leads</div>
            <div className="text-xs text-slate-500">{leads.length} shown</div>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLeads(leads.map((l) => l.id))
                    } else {
                      setSelectedLeads([])
                    }
                  }}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedLeads.includes(lead.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeads([...selectedLeads, lead.id])
                      } else {
                        setSelectedLeads(selectedLeads.filter((id) => id !== lead.id))
                      }
                    }}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                  {lead.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {lead.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {lead.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {lead.currentStatus.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {lead.assignedTo?.name || 'Unassigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {lead.sourcePlatform}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

