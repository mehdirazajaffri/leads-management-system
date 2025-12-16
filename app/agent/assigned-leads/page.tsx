import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AssignedLeadsClient from './AssignedLeadsClient'

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
        <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Pipeline</div>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">My Assigned Leads</h1>
      </div>
      <AssignedLeadsClient leads={leads} />
    </div>
  )
}

