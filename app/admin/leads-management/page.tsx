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

  let leads, agents, statuses
  let dbError: string | null = null

  try {
    [leads, agents, statuses] = await Promise.all([
      prisma.lead.findMany({
        where: { isArchived: false },
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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (
      msg.includes("Can't reach database server") ||
      msg.includes('Connection terminated due to connection timeout') ||
      msg.includes('db.prisma.io') ||
      msg.includes('P1001') ||
      msg.includes('P1002')
    ) {
      dbError = msg
    } else {
      throw error
    }
  }

  if (dbError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Leads Management</h1>
        <DatabaseUnavailable details={dbError} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Leads Management</h1>
      <LeadsManagementClient
        initialLeads={leads!}
        agents={agents!}
        statuses={statuses!}
      />
    </div>
  )
}

