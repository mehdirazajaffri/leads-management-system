import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LeadsManagementClient from './LeadsManagementClient'
import DatabaseUnavailable from '@/components/features/DatabaseUnavailable'
import { prisma } from '@/lib/prisma'

export default async function LeadsManagementPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  try {
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
      <div className="space-y-6 pl-0">
        <h1 className="text-3xl font-bold">Leads Management</h1>
        <LeadsManagementClient
          initialLeads={leads}
          agents={agents}
          statuses={statuses}
        />
      </div>
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (
      msg.includes("Can't reach database server") ||
      msg.includes('Connection terminated due to connection timeout') ||
      msg.includes('db.prisma.io') ||
      msg.includes('P1001') ||
      msg.includes('P1002')
    ) {
      return (
        <div className="space-y-6 pl-0">
          <h1 className="text-3xl font-bold">Leads Management</h1>
          <DatabaseUnavailable details={msg} />
        </div>
      )
    }
    throw error
  }
}

