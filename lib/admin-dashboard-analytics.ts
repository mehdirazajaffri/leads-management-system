import { prisma } from '@/lib/prisma'

export type AdminAnalyticsRange = '7d' | '30d' | '90d' | 'all'

export type AdminAnalyticsParams = {
  campaign?: string
  range?: AdminAnalyticsRange
}

export type AdminDashboardAnalytics = {
  kpis: {
    totalLeadsUploaded: number
    totalConvertedLeads: number
    overallConversionRate: number
    totalActiveAgents: number
  }
  conversionByAgent: Array<{
    agentId: string
    agentName: string
    leadsAssigned: number
    leadsProcessedToday: number
    convertedLeads: number
    conversionRate: number
  }>
  leadsBySource: Array<{
    sourcePlatform: string
    totalLeads: number
  }>
  campaigns: string[]
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function rangeToStartDate(range: AdminAnalyticsRange | undefined): Date | null {
  if (!range || range === 'all') return null
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

export async function getAdminDashboardAnalytics(
  params: AdminAnalyticsParams = {}
): Promise<AdminDashboardAnalytics> {
  const convertedStatus = await prisma.status.findFirst({ where: { name: 'Converted' } })

  const startDate = rangeToStartDate(params.range)

  const leadWhere: any = {
    isArchived: false,
    ...(params.campaign ? { campaignName: params.campaign } : {}),
    ...(startDate ? { createdAt: { gte: startDate } } : {}),
  }

  const [campaignsDistinct, totalActiveAgents, totalLeadsUploaded, totalConvertedLeads] = await Promise.all([
    prisma.lead.findMany({
      where: { isArchived: false },
      select: { campaignName: true },
      distinct: ['campaignName'],
      orderBy: { campaignName: 'asc' },
    }),
    prisma.user.count({ where: { role: 'AGENT' } }),
    prisma.lead.count({ where: leadWhere }),
    convertedStatus
      ? prisma.lead.count({ where: { ...leadWhere, currentStatusId: convertedStatus.id } })
      : Promise.resolve(0),
  ])

  // Leads assigned per agent
  const assignedByAgent = await prisma.lead.groupBy({
    by: ['assignedToId'],
    where: {
      ...leadWhere,
      assignedToId: { not: null },
    },
    _count: { id: true },
  })

  // Converted per agent
  const convertedByAgent = convertedStatus
    ? await prisma.lead.groupBy({
        by: ['assignedToId'],
        where: {
          ...leadWhere,
          assignedToId: { not: null },
          currentStatusId: convertedStatus.id,
        },
        _count: { id: true },
      })
    : []

  const agentIds = assignedByAgent.map((x) => x.assignedToId!).filter(Boolean)
  const agents = await prisma.user.findMany({
    where: { id: { in: agentIds }, role: 'AGENT' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  // Leads processed today: count unique leadIds touched by each agent today (filtered by campaign if provided).
  const processedPairs = await prisma.activityLog.groupBy({
    by: ['agentId', 'leadId'],
    where: {
      timestamp: { gte: startOfToday() },
      agentId: { in: agentIds },
      lead: {
        isArchived: false,
        ...(params.campaign ? { campaignName: params.campaign } : {}),
      },
    },
    _count: { leadId: true },
  })

  const processedTodayMap = new Map<string, number>()
  processedPairs.forEach((p) => {
    processedTodayMap.set(p.agentId, (processedTodayMap.get(p.agentId) || 0) + 1)
  })

  const convertedMap = new Map<string, number>()
  convertedByAgent.forEach((x) => {
    if (x.assignedToId) convertedMap.set(x.assignedToId, x._count.id)
  })

  const assignedMap = new Map<string, number>()
  assignedByAgent.forEach((x) => {
    if (x.assignedToId) assignedMap.set(x.assignedToId, x._count.id)
  })

  const conversionByAgent = agents.map((a) => {
    const leadsAssigned = assignedMap.get(a.id) || 0
    const convertedLeads = convertedMap.get(a.id) || 0
    const leadsProcessedToday = processedTodayMap.get(a.id) || 0
    const conversionRate = leadsAssigned > 0 ? (convertedLeads / leadsAssigned) * 100 : 0
    return { agentId: a.id, agentName: a.name, leadsAssigned, leadsProcessedToday, convertedLeads, conversionRate }
  })

  const leadsBySource = await prisma.lead.groupBy({
    by: ['sourcePlatform'],
    where: leadWhere,
    _count: { id: true },
  })

  return {
    kpis: {
      totalLeadsUploaded,
      totalConvertedLeads,
      overallConversionRate: totalLeadsUploaded > 0 ? (totalConvertedLeads / totalLeadsUploaded) * 100 : 0,
      totalActiveAgents,
    },
    conversionByAgent,
    leadsBySource: leadsBySource
      .map((x) => ({ sourcePlatform: x.sourcePlatform, totalLeads: x._count.id }))
      .sort((a, b) => b.totalLeads - a.totalLeads),
    campaigns: campaignsDistinct.map((c) => c.campaignName).filter(Boolean),
  }
}


