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

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const startOfWeek = new Date()
  // Monday as start of week
  const day = (startOfWeek.getDay() + 6) % 7
  startOfWeek.setDate(startOfWeek.getDate() - day)
  startOfWeek.setHours(0, 0, 0, 0)

  const convertedStatus = await prisma.status.findFirst({ where: { name: 'Converted' } })

  const [myTotalAssignedLeads, convertedThisWeek, callbacksToday] = await Promise.all([
    prisma.lead.count({
      where: {
        assignedToId: agentId,
        isArchived: false,
      },
    }),
    convertedStatus
      ? prisma.lead.count({
          where: {
            assignedToId: agentId,
            isArchived: false,
            currentStatusId: convertedStatus.id,
            updatedAt: { gte: startOfWeek },
          },
        })
      : Promise.resolve(0),
    prisma.callback.findMany({
      where: {
        completed: false,
        scheduledDate: { gte: startOfToday, lte: endOfToday },
        lead: { assignedToId: agentId, isArchived: false },
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            currentStatus: { select: { name: true } },
          },
        },
      },
      orderBy: [{ scheduledDate: 'asc' }],
      take: 50,
    }),
  ])

  const myConvertedTotal = convertedStatus
    ? await prisma.lead.count({
        where: {
          assignedToId: agentId,
          isArchived: false,
          currentStatusId: convertedStatus.id,
        },
      })
    : 0

  const myPersonalConversionRate = myTotalAssignedLeads > 0 ? (myConvertedTotal / myTotalAssignedLeads) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-slate-500">My Work</div>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Agent Dashboard</h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="text-xs uppercase tracking-widest text-slate-500">My Total Assigned Leads</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{myTotalAssignedLeads}</div>
            <div className="mt-3 h-1 w-12 rounded-full bg-blue-600/80" />
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-xs uppercase tracking-widest text-slate-500">Leads Converted This Week</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{convertedThisWeek}</div>
            <div className="mt-3 h-1 w-12 rounded-full bg-emerald-600/80" />
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-xs uppercase tracking-widest text-slate-500">My Personal Conversion Rate</div>
            <div className="mt-2 text-4xl font-semibold text-slate-900">{myPersonalConversionRate.toFixed(1)}%</div>
            <div className="mt-3 h-1 w-12 rounded-full bg-fuchsia-600/70" />
          </div>
        </div>
      </div>

      {/* Callbacks Today */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Callbacks Today</div>
            <div className="text-xs text-slate-500 mt-1">Prioritized by callback time.</div>
          </div>
          <a
            href="/agent/callbacks-management"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            View all
          </a>
        </div>
        <div className="card-body space-y-3">
          {callbacksToday.length === 0 ? (
            <div className="text-sm text-slate-500">No callbacks scheduled for today.</div>
          ) : (
            callbacksToday.map((cb) => (
              <a
                key={cb.id}
                href={`/agent/lead-detail/${cb.lead.id}`}
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{cb.lead.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{cb.lead.phone} • {cb.lead.email}</div>
                    <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {cb.lead.currentStatus?.name || 'Scheduled Callback'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">
                      {new Date(cb.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(cb.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

