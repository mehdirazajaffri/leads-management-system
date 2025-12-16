import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LeadDetailClient from './LeadDetailClient'
import { getActivityLogs } from '@/lib/activity-logger'
import DatabaseUnavailable from '@/components/features/DatabaseUnavailable'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const { id } = await params

  let lead, activityLogs, statuses
  let dbError: string | null = null

  try {
    [lead, activityLogs, statuses] = await Promise.all([
      prisma.lead.findUnique({
        where: { id },
        include: {
          assignedTo: { select: { id: true, name: true } },
          currentStatus: true,
          callbacks: {
            where: { completed: false },
            orderBy: { scheduledDate: 'asc' },
          },
        },
      }),
      getActivityLogs(id, { limit: 50 }),
      prisma.status.findMany({ orderBy: { name: 'asc' } }),
    ])

    if (!lead) {
      notFound()
    }
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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Lead Detail</h1>
        <DatabaseUnavailable details={dbError} />
      </div>
    )
  }

  return (
    <LeadDetailClient
      lead={lead!}
      activityLogs={activityLogs!.logs}
      statuses={statuses!}
    />
  )
}

