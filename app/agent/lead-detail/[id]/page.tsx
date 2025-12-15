import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LeadDetailClient from './LeadDetailClient'
import { getActivityLogs } from '@/lib/activity-logger'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      currentStatus: true,
      callbacks: {
        where: { completed: false },
        orderBy: { scheduledDate: 'asc' },
      },
    },
  })

  if (!lead) {
    notFound()
  }

  // Verify ownership for agents
  if (session.user.role === 'AGENT' && lead.assignedToId !== session.user.id) {
    redirect('/agent/assigned-leads')
  }

  const [activityLogs, statuses] = await Promise.all([
    getActivityLogs(id, { limit: 50 }),
    prisma.status.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <LeadDetailClient
      lead={lead}
      activityLogs={activityLogs.logs}
      statuses={statuses}
    />
  )
}

