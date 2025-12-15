'use client'

import { useMemo, useState } from 'react'
import DataTable, { type DataTableColumn } from '@/components/features/DataTable'
import Modal from '@/components/features/Modal'

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

type CSVRow = {
  Name: string
  Phone: string
  Email: string
  'Source Platform': string
  'Campaign Name': string
}

type ValidationErrorRow = { row: number; data: CSVRow; errors: string[] }

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
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewRows, setPreviewRows] = useState<CSVRow[] | null>(null)
  const [previewErrors, setPreviewErrors] = useState<ValidationErrorRow[] | null>(null)
  const [previewMeta, setPreviewMeta] = useState<{ valid: number; errorCount: number } | null>(null)
  const [assignAgentId, setAssignAgentId] = useState<string>('')

  const [filters, setFilters] = useState<{
    agentId: string
    statusId: string
    source: string
    campaign: string
  }>({ agentId: 'all', statusId: 'all', source: 'all', campaign: 'all' })

  const sources = useMemo(() => Array.from(new Set(leads.map((l) => l.sourcePlatform))).sort(), [leads])
  const campaigns = useMemo(() => Array.from(new Set(leads.map((l) => l.campaignName))).sort(), [leads])

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (filters.agentId !== 'all') {
        if (filters.agentId === 'unassigned' && l.assignedTo?.id) return false
        if (filters.agentId !== 'unassigned' && l.assignedTo?.id !== filters.agentId) return false
      }
      if (filters.statusId !== 'all' && l.currentStatus.id !== filters.statusId) return false
      if (filters.source !== 'all' && l.sourcePlatform !== filters.source) return false
      if (filters.campaign !== 'all' && l.campaignName !== filters.campaign) return false
      return true
    })
  }, [leads, filters])

  const closeUpload = () => {
    setShowUpload(false)
    setFile(null)
    setPreviewRows(null)
    setPreviewErrors(null)
    setPreviewMeta(null)
    setPreviewLoading(false)
  }

  const fetchPreview = async (f: File) => {
    setPreviewLoading(true)
    setPreviewRows(null)
    setPreviewErrors(null)
    setPreviewMeta(null)
    try {
      const formData = new FormData()
      formData.append('file', f)
      formData.append('preview', 'true')
      const res = await fetch('/api/admin/leads/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setPreviewMeta({ valid: data.valid, errorCount: data.errorCount })
        setPreviewRows((data.preview || []) as CSVRow[])
        setPreviewErrors((data.validationErrors || []) as ValidationErrorRow[])
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch {
      alert('Failed to generate preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('skipDuplicates', skipDuplicates ? 'true' : 'false')

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
      closeUpload()
    }
  }

  const handleBulkAssign = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select leads to assign')
      return
    }

    if (!assignAgentId) {
      alert('Please select an agent')
      return
    }

    try {
      const res = await fetch('/api/admin/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedLeads, agentId: assignAgentId }),
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
              onClick={() => setShowUpload(true)}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Upload CSV
            </button>
            <a
              href="/api/admin/leads/export"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Export CSV
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div className="card">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900">Filtering</div>
            <div className="text-xs text-slate-500 mt-1">Agent, Status, Source, Campaign</div>
          </div>
          <div className="card-body space-y-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Agent</div>
              <select
                value={filters.agentId}
                onChange={(e) => setFilters((f) => ({ ...f, agentId: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm"
              >
                <option value="all">All</option>
                <option value="unassigned">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Status</div>
              <select
                value={filters.statusId}
                onChange={(e) => setFilters((f) => ({ ...f, statusId: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm"
              >
                <option value="all">All</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Source Platform</div>
              <select
                value={filters.source}
                onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm"
              >
                <option value="all">All</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Campaign</div>
              <select
                value={filters.campaign}
                onChange={(e) => setFilters((f) => ({ ...f, campaign: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm"
              >
                <option value="all">All</option>
                {campaigns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setFilters({ agentId: 'all', statusId: 'all', source: 'all', campaign: 'all' })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div>
          {(() => {
            const columns: DataTableColumn<Lead>[] = [
              { id: 'name', header: 'NAME', sortValue: (r) => r.name, searchValue: (r) => `${r.name} ${r.email} ${r.phone}`, cell: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
              { id: 'phone', header: 'PHONE', sortValue: (r) => r.phone, searchValue: (r) => r.phone, cell: (r) => <span className="text-slate-600">{r.phone}</span> },
              { id: 'email', header: 'EMAIL', sortValue: (r) => r.email, searchValue: (r) => r.email, cell: (r) => <span className="text-slate-600">{r.email}</span> },
              { id: 'source', header: 'SOURCE PLATFORM', sortValue: (r) => r.sourcePlatform, searchValue: (r) => r.sourcePlatform, cell: (r) => <span className="text-slate-600">{r.sourcePlatform}</span> },
              { id: 'campaign', header: 'CAMPAIGN', sortValue: (r) => r.campaignName, searchValue: (r) => r.campaignName, cell: (r) => <span className="text-slate-600">{r.campaignName}</span> },
              { id: 'status', header: 'CURRENT STATUS', sortValue: (r) => r.currentStatus.name, searchValue: (r) => r.currentStatus.name, cell: (r) => <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{r.currentStatus.name}</span> },
              { id: 'assigned', header: 'ASSIGNED AGENT', sortValue: (r) => r.assignedTo?.name || '', searchValue: (r) => r.assignedTo?.name || 'Unassigned', cell: (r) => <span className="text-slate-600">{r.assignedTo?.name || 'Unassigned'}</span> },
            ]

            return (
              <DataTable
                title="Leads"
                subtitle="Bulk select leads, filter, and assign in seconds."
                rows={filteredLeads}
                columns={columns}
                getRowId={(r) => r.id}
                selectedIds={selectedLeads}
                onSelectedIdsChange={setSelectedLeads}
              />
            )
          })()}
        </div>
      </div>

      {selectedLeads.length > 0 ? (
        <div className="fixed bottom-4 left-4 right-4 z-40 xl:left-[calc(19.5rem+1rem)]">
          <div className="card">
            <div className="card-body flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-semibold text-slate-900">{selectedLeads.length} Leads Selected</div>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={assignAgentId}
                  onChange={(e) => setAssignAgentId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm"
                >
                  <option value="">Assign To…</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkAssign}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Assign Selected Leads
                </button>
                <button
                  onClick={() => setSelectedLeads([])}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Modal title="Upload CSV" open={showUpload} onClose={closeUpload}>
        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            Required headers: <span className="font-mono">Name, Phone, Email, Source Platform, Campaign Name</span>
          </div>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const f = e.target.files?.[0] || null
              setFile(f)
              if (f) fetchPreview(f)
            }}
            className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
          />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} />
            Skip duplicates
          </label>

          {previewLoading ? <div className="text-sm text-slate-500">Generating preview…</div> : null}
          {previewMeta ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold">{previewMeta.valid}</span> valid rows,{' '}
              <span className="font-semibold">{previewMeta.errorCount}</span> errors
            </div>
          ) : null}

          {previewRows && previewRows.length > 0 ? (
            <div className="rounded-xl border border-slate-200 overflow-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {Object.keys(previewRows[0]).map((k) => (
                      <th
                        key={k}
                        className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-widest text-slate-400"
                      >
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {previewRows.map((row, idx) => (
                    <tr key={idx}>
                      {Object.keys(previewRows[0]).map((k) => (
                        <td key={k} className="px-4 py-2 text-sm text-slate-700">
                          {String(row[k as keyof CSVRow] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {previewErrors && previewErrors.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {previewErrors.length} validation errors found (showing up to 10). Fix your CSV to import all rows.
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              onClick={handleFileUpload}
              disabled={!file || uploading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Importing…' : 'Import Leads'}
            </button>
            <button
              onClick={closeUpload}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

