import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

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

      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Leads</div>
            <div className="text-xs text-slate-500 mt-1">{leads.length} leads</div>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
            <tr>
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
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                  No assigned leads
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
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
                    {lead.sourcePlatform}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/agent/lead-detail/${lead.id}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      View
                    </Link>
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

