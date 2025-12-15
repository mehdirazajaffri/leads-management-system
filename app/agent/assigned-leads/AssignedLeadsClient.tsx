'use client'

import Link from 'next/link'
import DataTable, { type DataTableColumn } from '@/components/features/DataTable'
import { formatDateReadable } from '@/lib/date-utils'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  sourcePlatform: string
  campaignName: string
  currentStatus: { id: string; name: string }
  createdAt: Date
}

export default function AssignedLeadsClient({ leads }: { leads: Lead[] }) {
  const columns: DataTableColumn<Lead>[] = [
    {
      id: 'name',
      header: 'NAME',
      sortValue: (r) => r.name,
      searchValue: (r) => `${r.name} ${r.email} ${r.phone}`,
      cell: (r) => <span className="font-semibold text-slate-900">{r.name}</span>,
    },
    {
      id: 'status',
      header: 'STATUS',
      sortValue: (r) => r.currentStatus.name,
      searchValue: (r) => r.currentStatus.name,
      cell: (r) => (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {r.currentStatus.name}
        </span>
      ),
    },
    {
      id: 'source',
      header: 'OFFICE',
      sortValue: (r) => r.sourcePlatform,
      searchValue: (r) => r.sourcePlatform,
      cell: (r) => <span className="text-slate-600">{r.sourcePlatform}</span>,
    },
    {
      id: 'start',
      header: 'START DATE',
      sortValue: (r) => new Date(r.createdAt).getTime(),
      cell: (r) => <span className="text-slate-600">{formatDateReadable(r.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: (r) => (
        <Link
          href={`/agent/lead-detail/${r.id}`}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900"
        >
          Edit
        </Link>
      ),
    },
  ]

  return (
    <DataTable
      title="Assigned Leads"
      subtitle="View your assigned leads and their details."
      rows={leads}
      columns={columns}
      getRowId={(r) => r.id}
    />
  )
}

