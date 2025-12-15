import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DataTable, { type DataTableColumn } from '@/components/features/DataTable'

export default async function AssignedLeadsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const leads = await prisma.lead.findMany({
    where: {
      assignedToId: session.user.id,
      isArchived: false,
    },
    include: {
      currentStatus: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-slate-500">Pipeline</div>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">My Assigned Leads</h1>
      </div>

      {(() => {
        const columns: DataTableColumn<(typeof leads)[number]>[] = [
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
            cell: (r) => <span className="text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</span>,
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
            title="Datatable Simple"
            subtitle="A lightweight, extendable, dependency-free javascript HTML table plugin."
            rows={leads}
            columns={columns}
            getRowId={(r) => r.id}
          />
        )
      })()}
    </div>
  )
}

