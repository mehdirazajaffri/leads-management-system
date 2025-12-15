import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function AgentDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const agentId = session.user.id

  // Get agent's leads stats
  const [totalLeads, pendingCallbacks, recentActivity] = await Promise.all([
    prisma.lead.count({
      where: {
        assignedToId: agentId,
        isArchived: false,
      },
    }),
    prisma.callback.count({
      where: {
        lead: { assignedToId: agentId },
        completed: false,
        scheduledDate: { gte: new Date() },
      },
    }),
    prisma.activityLog.findMany({
      where: { agentId },
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        lead: { select: { name: true } },
        newStatus: { select: { name: true } },
      },
    }),
  ])

  // Get leads by status
  const leadsByStatus = await prisma.lead.groupBy({
    by: ['currentStatusId'],
    where: {
      assignedToId: agentId,
      isArchived: false,
    },
    _count: {
      id: true,
    },
  })

  const statuses = await prisma.status.findMany()
  const statusMap = new Map(statuses.map((s) => [s.id, s.name]))

  // Get overdue callbacks
  const overdueCallbacks = await prisma.callback.count({
    where: {
      lead: { assignedToId: agentId },
      completed: false,
      scheduledDate: { lt: new Date() },
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Agent Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Assigned Leads</h3>
          <p className="text-2xl font-bold mt-2">{totalLeads}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pending Callbacks</h3>
          <p className="text-2xl font-bold mt-2">{pendingCallbacks}</p>
          {overdueCallbacks > 0 && (
            <p className="text-sm text-red-600 mt-1">{overdueCallbacks} overdue</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Leads by Status</h3>
          <div className="mt-2 space-y-1">
            {leadsByStatus.map((item) => (
              <div key={item.currentStatusId} className="flex justify-between text-sm">
                <span>{statusMap.get(item.currentStatusId) || 'Unknown'}</span>
                <span className="font-medium">{item._count.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500">No recent activity</p>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="border-b pb-2">
                <p className="text-sm">
                  Updated <span className="font-medium">{activity.lead.name}</span> to{' '}
                  <span className="font-medium">{activity.newStatus?.name || 'N/A'}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <a
            href="/agent/assigned-leads"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            View My Leads
          </a>
          <a
            href="/agent/callbacks-management"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            Manage Callbacks
          </a>
        </div>
      </div>
    </div>
  )
}

