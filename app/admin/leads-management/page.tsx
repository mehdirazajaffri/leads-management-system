import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LeadsManagementClient from './LeadsManagementClient'
import { prisma } from '@/lib/prisma'

export default async function LeadsManagementPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const [leads, agents, statuses] = await Promise.all([
    prisma.lead.findMany({
      where: { isArchived: false },
      take: 50,
      include: {
        assignedTo: { select: { id: true, name: true } },
        currentStatus: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { role: 'AGENT' },
      select: { id: true, name: true },
    }),
    prisma.status.findMany({ select: { id: true, name: true } }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Leads Management</h1>
      <LeadsManagementClient
        initialLeads={leads}
        agents={agents}
        statuses={statuses}
      />
    </div>
  )
}

