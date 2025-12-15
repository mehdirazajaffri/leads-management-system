import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DatabaseUnavailable from '@/components/features/DatabaseUnavailable'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  let totalLeads = 0
  let assignedLeads = 0
  let agents = 0
  let recentActivity: any[] = []
  let conversionRate = '0'

  try {
    // Get key metrics
    ;[totalLeads, assignedLeads, agents, recentActivity] = await Promise.all([
      prisma.lead.count({ where: { isArchived: false } }),
      prisma.lead.count({ where: { isArchived: false, assignedToId: { not: null } } }),
      prisma.user.count({ where: { role: 'AGENT' } }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          agent: { select: { name: true } },
          lead: { select: { name: true } },
          newStatus: { select: { name: true } },
        },
      }),
    ])

    const convertedStatus = await prisma.status.findFirst({
      where: { name: 'Converted' },
    })

    const convertedLeads = convertedStatus
      ? await prisma.lead.count({
          where: {
            isArchived: false,
            currentStatusId: convertedStatus.id,
          },
        })
      : 0

    conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0'
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("Can't reach database server") || msg.includes('Connection terminated due to connection timeout')) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <DatabaseUnavailable details={msg} />
        </div>
      )
    }
    throw e
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Leads</h3>
          <p className="text-2xl font-bold mt-2">{totalLeads}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Assigned Leads</h3>
          <p className="text-2xl font-bold mt-2">{assignedLeads}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Agents</h3>
          <p className="text-2xl font-bold mt-2">{agents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <p className="text-2xl font-bold mt-2">{conversionRate}%</p>
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
                  <span className="font-medium">{activity.agent.name}</span> updated{' '}
                  <span className="font-medium">{activity.lead.name}</span> to{' '}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/leads-management"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            Manage Leads
          </a>
          <a
            href="/admin/agents-management"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            Manage Agents
          </a>
          <a
            href="/admin/analytics-dashboard"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            View Analytics
          </a>
          <a
            href="/admin/system-settings"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            Settings
          </a>
        </div>
      </div>
    </div>
  )
}

