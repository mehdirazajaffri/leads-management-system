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
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500">Overview</div>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Admin Dashboard</h1>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="text-xs uppercase tracking-widest text-slate-500">Total Leads</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{totalLeads}</div>
            <div className="mt-2 h-1 w-12 rounded-full bg-indigo-500/70" />
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-xs uppercase tracking-widest text-slate-500">Assigned</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{assignedLeads}</div>
            <div className="mt-2 h-1 w-12 rounded-full bg-emerald-500/70" />
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-xs uppercase tracking-widest text-slate-500">Active Agents</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{agents}</div>
            <div className="mt-2 h-1 w-12 rounded-full bg-slate-500/60" />
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-xs uppercase tracking-widest text-slate-500">Conversion</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{conversionRate}%</div>
            <div className="mt-2 h-1 w-12 rounded-full bg-fuchsia-500/70" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <div className="text-xs text-slate-500">Latest status changes</div>
        </div>
        <div className="card-body space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-slate-500">No recent activity</p>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <div className="text-sm text-slate-900">
                    <span className="font-semibold">{activity.agent.name}</span>{' '}
                    <span className="text-slate-500">updated</span>{' '}
                    <span className="font-semibold">{activity.lead.name}</span>{' '}
                    <span className="text-slate-500">to</span>{' '}
                    <span className="font-semibold">{activity.newStatus?.name || 'N/A'}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{new Date(activity.timestamp).toLocaleString()}</div>
                </div>
                <div className="mt-0.5 h-2 w-2 rounded-full bg-indigo-500/70" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <p className="text-sm text-slate-500 mt-1">Jump to the most common admin tasks.</p>
        </div>
        <div className="card-body grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/leads-management"
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Manage Leads
          </a>
          <a
            href="/admin/agents-management"
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Manage Agents
          </a>
          <a
            href="/admin/analytics-dashboard"
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            View Analytics
          </a>
          <a
            href="/admin/system-settings"
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Settings
          </a>
        </div>
      </div>
    </div>
  )
}

