import { prisma } from './prisma'

export interface CreateActivityLogParams {
  leadId: string
  agentId: string
  oldStatusId?: string | null
  newStatusId?: string | null
  note?: string
  isPrivate?: boolean
}

export async function createActivityLog(params: CreateActivityLogParams) {
  const { leadId, agentId, oldStatusId, newStatusId, note, isPrivate = false } = params

  return await prisma.activityLog.create({
    data: {
      leadId,
      agentId,
      oldStatusId: oldStatusId || null,
      newStatusId: newStatusId || null,
      note: note || null,
      isPrivate,
      timestamp: new Date(),
    },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      oldStatus: {
        select: {
          id: true,
          name: true,
        },
      },
      newStatus: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

export async function getActivityLogs(
  leadId: string,
  options?: {
    page?: number
    limit?: number
    agentId?: string
    startDate?: Date
    endDate?: Date
    includePrivate?: boolean
  }
) {
  const {
    page = 1,
    limit = 20,
    agentId,
    startDate,
    endDate,
    includePrivate = false,
  } = options || {}

  const where: any = {
    leadId,
    ...(agentId && { agentId }),
    ...(startDate && { timestamp: { gte: startDate } }),
    ...(endDate && { timestamp: { lte: endDate } }),
    ...(!includePrivate && { isPrivate: false }),
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        oldStatus: {
          select: {
            id: true,
            name: true,
          },
        },
        newStatus: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.activityLog.count({ where }),
  ])

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function exportActivityLogs(leadId: string) {
  return await prisma.activityLog.findMany({
    where: {
      leadId,
      isPrivate: false,
    },
    orderBy: { timestamp: 'desc' },
    include: {
      agent: {
        select: {
          name: true,
          email: true,
        },
      },
      oldStatus: {
        select: {
          name: true,
        },
      },
      newStatus: {
        select: {
          name: true,
        },
      },
    },
  })
}

