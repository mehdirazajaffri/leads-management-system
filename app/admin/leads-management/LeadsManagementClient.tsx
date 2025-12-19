'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import DataTable, { type DataTableColumn } from '@/components/features/DataTable'
import Modal from '@/components/features/Modal'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/hooks/useConfirm'
import { ConfirmDialog } from '@/components/ui/confirm/ConfirmDialog'

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
  const toast = useToast()
  const confirm = useConfirm()
  const [leads] = useState(initialLeads)
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
  const [archiving, setArchiving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  // Find "Need to Contact" status or use first status as fallback
  const needToContactStatus = statuses.find((s) => s.name === 'Need to Contact') || statuses[0]
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    sourcePlatform: '',
    campaignName: '',
    assignedToId: '',
    currentStatusId: needToContactStatus?.id || '',
  })

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
        toast.error(`Error: ${data.message}`)
      }
    } catch {
      toast.error('Failed to generate preview')
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
        toast.success(`Successfully imported ${data.imported} leads`)
        window.location.reload()
      } else {
        toast.error(`Error: ${data.message}`)
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      setFile(null)
      closeUpload()
    }
  }

  const handleBulkAssign = async () => {
    if (selectedLeads.length === 0) {
      toast.warning('Please select leads to assign')
      return
    }

    if (!assignAgentId) {
      toast.warning('Please select an agent')
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
        toast.success(`Successfully assigned ${data.updated} leads`)
        window.location.reload()
      } else {
        toast.error(`Error: ${data.message}`)
      }
    } catch {
      toast.error('Assignment failed')
    }
  }

  const handleBulkArchive = async () => {
    if (selectedLeads.length === 0) {
      toast.warning('Please select leads to archive')
      return
    }

    confirm.confirm({
      title: 'Archive Leads',
      message: `Are you sure you want to archive ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}? This will hide them from the main view.`,
      variant: 'warning',
      confirmText: 'Archive',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setArchiving(true)
        try {
          const res = await fetch('/api/admin/leads/bulk', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadIds: selectedLeads }),
          })

          const data = await res.json()
          if (res.ok) {
            toast.success(`Successfully archived ${data.archived} lead${data.archived > 1 ? 's' : ''}`)
            setSelectedLeads([])
            window.location.reload()
          } else {
            toast.error(`Error: ${data.message}`)
          }
        } catch {
          toast.error('Archive failed')
        } finally {
          setArchiving(false)
        }
      },
    })
  }

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone || !formData.currentStatusId) {
      toast.warning('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          sourcePlatform: formData.sourcePlatform || '',
          campaignName: formData.campaignName || '',
          assignedToId: formData.assignedToId || null,
          currentStatusId: formData.currentStatusId,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Lead created successfully')
        setShowCreateForm(false)
        setFormData({
          name: '',
          email: '',
          phone: '',
          sourcePlatform: '',
          campaignName: '',
          assignedToId: '',
          currentStatusId: needToContactStatus?.id || '',
        })
        window.location.reload()
      } else {
        toast.error(`Error: ${data.message}`)
      }
    } catch {
      toast.error('Failed to create lead')
    } finally {
      setCreating(false)
    }
  }

  const closeCreateForm = () => {
    setShowCreateForm(false)
    setFormData({
      name: '',
      email: '',
      phone: '',
      sourcePlatform: '',
      campaignName: '',
      assignedToId: '',
      currentStatusId: needToContactStatus?.id || '',
    })
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Leads</div>
            <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Manage, import, assign</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-sm"
            >
              Create Lead
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Upload CSV
            </button>
            <button
              onClick={() => {
                window.location.href = '/api/admin/leads/export'
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        <div className="card">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Filters</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Refine your search</div>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Agent</label>
              <select
                value={filters.agentId}
                onChange={(e) => setFilters((f) => ({ ...f, agentId: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Agents</option>
                <option value="unassigned">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
              <select
                value={filters.statusId}
                onChange={(e) => setFilters((f) => ({ ...f, statusId: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Source Platform</label>
              <select
                value={filters.source}
                onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Sources</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Campaign</label>
              <select
                value={filters.campaign}
                onChange={(e) => setFilters((f) => ({ ...f, campaign: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Campaigns</option>
                {campaigns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setFilters({ agentId: 'all', statusId: 'all', source: 'all', campaign: 'all' })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="min-w-0">
          {(() => {
            const columns: DataTableColumn<Lead>[] = [
              { 
                id: 'name', 
                header: 'NAME', 
                sortValue: (r) => r.name, 
                searchValue: (r) => `${r.name} ${r.email} ${r.phone}`, 
                cell: (r) => (
                  <Link href={`/admin/lead-detail/${r.id}`} className="block min-w-[180px] hover:opacity-80 transition-opacity">
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">{r.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.email}</div>
                  </Link>
                ),
                className: 'min-w-[200px]',
                headerClassName: 'min-w-[200px]'
              },
              { 
                id: 'phone', 
                header: 'PHONE', 
                sortValue: (r) => r.phone, 
                searchValue: (r) => r.phone, 
                cell: (r) => <span className="text-slate-700 dark:text-slate-300 text-sm font-mono">{r.phone}</span>,
                className: 'min-w-[120px]',
                headerClassName: 'min-w-[120px]'
              },
              { 
                id: 'status', 
                header: 'STATUS', 
                sortValue: (r) => r.currentStatus.name, 
                searchValue: (r) => r.currentStatus.name, 
                cell: (r) => (
                  <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-gray-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {r.currentStatus.name}
                  </span>
                ),
                className: 'min-w-[130px]',
                headerClassName: 'min-w-[130px]'
              },
              { 
                id: 'assigned', 
                header: 'ASSIGNED TO', 
                sortValue: (r) => r.assignedTo?.name || '', 
                searchValue: (r) => r.assignedTo?.name || 'Unassigned', 
                cell: (r) => (
                  <span className="text-slate-700 dark:text-slate-300 text-sm">
                    {r.assignedTo?.name || <span className="text-slate-400 dark:text-slate-500 italic">Unassigned</span>}
                  </span>
                ),
                className: 'min-w-[140px]',
                headerClassName: 'min-w-[140px]'
              },
              { 
                id: 'source', 
                header: 'SOURCE', 
                sortValue: (r) => r.sourcePlatform, 
                searchValue: (r) => r.sourcePlatform, 
                cell: (r) => <span className="text-slate-600 dark:text-slate-400 text-sm">{r.sourcePlatform}</span>,
                className: 'min-w-[140px]',
                headerClassName: 'min-w-[140px]'
              },
              { 
                id: 'campaign', 
                header: 'CAMPAIGN', 
                sortValue: (r) => r.campaignName, 
                searchValue: (r) => r.campaignName, 
                cell: (r) => <span className="text-slate-600 dark:text-slate-400 text-sm">{r.campaignName}</span>,
                className: 'min-w-[150px]',
                headerClassName: 'min-w-[150px]'
              },
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
        <div className="fixed bottom-6 left-6 right-6 z-40 lg:left-[calc(200px+2rem)] xl:left-[calc(290px+2rem)]">
          <div className="card shadow-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="card-body flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                  {selectedLeads.length}
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Lead{selectedLeads.length > 1 ? 's' : ''} Selected</div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={assignAgentId}
                  onChange={(e) => setAssignAgentId(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  disabled={!assignAgentId}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Assign Selected
                </button>
                <button
                  onClick={handleBulkArchive}
                  disabled={archiving}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {archiving ? 'Archiving…' : 'Archive Selected'}
                </button>
                <button
                  onClick={() => setSelectedLeads([])}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
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
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Required headers: <span className="font-mono">Name, Phone</span>
            <br />
            Optional headers: <span className="font-mono">Email, Source Platform, Campaign Name</span>
          </div>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const f = e.target.files?.[0] || null
              setFile(f)
              if (f) fetchPreview(f)
            }}
            className="block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
          />

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} />
            Skip duplicates
          </label>

          {previewLoading ? <div className="text-sm text-slate-500 dark:text-slate-400">Generating preview…</div> : null}
          {previewMeta ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">{previewMeta.valid}</span> valid rows,{' '}
              <span className="font-semibold">{previewMeta.errorCount}</span> errors
            </div>
          ) : null}

          {previewRows && previewRows.length > 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-gray-800">
                  <tr>
                    {Object.keys(previewRows[0]).map((k) => (
                      <th
                        key={k}
                        className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500"
                      >
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-gray-800">
                  {previewRows.map((row, idx) => (
                    <tr key={idx}>
                      {Object.keys(previewRows[0]).map((k) => (
                        <td key={k} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
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
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
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
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal title="Create Lead" open={showCreateForm} onClose={closeCreateForm}>
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.currentStatusId}
              onChange={(e) => setFormData({ ...formData, currentStatusId: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Assign To
            </label>
            <select
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="john@example.com (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Source Platform
            </label>
            <input
              type="text"
              value={formData.sourcePlatform}
              onChange={(e) => setFormData({ ...formData, sourcePlatform: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Facebook, Google Ads, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.campaignName}
              onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Summer Campaign 2025"
            />
          </div>

          

          

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating…' : 'Create Lead'}
            </button>
            <button
              type="button"
              onClick={closeCreateForm}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={confirm.handleCancel}
        onConfirm={confirm.handleConfirm}
        title={confirm.options?.title}
        message={confirm.options?.message || ''}
        confirmText={confirm.options?.confirmText}
        cancelText={confirm.options?.cancelText}
        variant={confirm.options?.variant}
        loading={confirm.loading}
      />
    </div>
  )
}

