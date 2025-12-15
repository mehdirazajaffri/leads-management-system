import { prisma } from './prisma'

export interface ConversionRateByAgent {
  agentId: string
  agentName: string
  totalLeads: number
  convertedLeads: number
  conversionRate: number
}

export interface SourcePlatformStats {
  sourcePlatform: string
  totalLeads: number
  convertedLeads: number
  conversionRate: number
}

export interface CampaignStats {
  campaignName: string
  totalLeads: number
  convertedLeads: number
  conversionRate: number
}

export async function getConversionRateByAgent(): Promise<ConversionRateByAgent[]> {
  // Get all agents with their leads
  const agents = await prisma.user.findMany({
    where: { role: 'AGENT' },
    include: {
      leadsAssigned: {
        include: {
          currentStatus: true,
        },
      },
    },
  })

  // Get converted status
  const convertedStatus = await prisma.status.findFirst({
    where: { name: 'Converted' },
  })

  if (!convertedStatus) {
    return []
  }

  return agents.map((agent) => {
    const totalLeads = agent.leadsAssigned.length
    const convertedLeads = agent.leadsAssigned.filter(
      (lead) => lead.currentStatusId === convertedStatus.id && !lead.isArchived
    ).length

    return {
      agentId: agent.id,
      agentName: agent.name,
      totalLeads,
      convertedLeads,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
    }
  })
}

export async function getLeadsBySourcePlatform(): Promise<SourcePlatformStats[]> {
  const convertedStatus = await prisma.status.findFirst({
    where: { name: 'Converted' },
  })

  if (!convertedStatus) {
    return []
  }

  const leads = await prisma.lead.groupBy({
    by: ['sourcePlatform'],
    where: {
      isArchived: false,
    },
    _count: {
      id: true,
    },
  })

  const convertedLeads = await prisma.lead.groupBy({
    by: ['sourcePlatform'],
    where: {
      isArchived: false,
      currentStatusId: convertedStatus.id,
    },
    _count: {
      id: true,
    },
  })

  const convertedMap = new Map(
    convertedLeads.map((item) => [item.sourcePlatform, item._count.id])
  )

  return leads.map((item) => {
    const total = item._count.id
    const converted = convertedMap.get(item.sourcePlatform) || 0

    return {
      sourcePlatform: item.sourcePlatform,
      totalLeads: total,
      convertedLeads: converted,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
    }
  })
}

export async function getCampaignPerformance(): Promise<CampaignStats[]> {
  const convertedStatus = await prisma.status.findFirst({
    where: { name: 'Converted' },
  })

  if (!convertedStatus) {
    return []
  }

  const leads = await prisma.lead.groupBy({
    by: ['campaignName'],
    where: {
      isArchived: false,
    },
    _count: {
      id: true,
    },
  })

  const convertedLeads = await prisma.lead.groupBy({
    by: ['campaignName'],
    where: {
      isArchived: false,
      currentStatusId: convertedStatus.id,
    },
    _count: {
      id: true,
    },
  })

  const convertedMap = new Map(
    convertedLeads.map((item) => [item.campaignName, item._count.id])
  )

  return leads.map((item) => {
    const total = item._count.id
    const converted = convertedMap.get(item.campaignName) || 0

    return {
      campaignName: item.campaignName,
      totalLeads: total,
      convertedLeads: converted,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
    }
  })
}

export async function getAgentResponseTimes(agentId: string): Promise<number | null> {
  const leads = await prisma.lead.findMany({
    where: {
      assignedToId: agentId,
      isArchived: false,
    },
    select: {
      createdAt: true,
      lastContactedAt: true,
    },
  })

  if (leads.length === 0) {
    return null
  }

  const responseTimes = leads
    .filter((lead) => lead.lastContactedAt)
    .map((lead) => {
      const assignedTime = lead.createdAt.getTime()
      const contactedTime = lead.lastContactedAt!.getTime()
      return (contactedTime - assignedTime) / (1000 * 60 * 60 * 24) // Convert to days
    })

  if (responseTimes.length === 0) {
    return null
  }

  return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
}

export async function getTimeBasedTrends(
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'daily':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days
      break
    case 'weekly':
      startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000) // 12 weeks
      break
    case 'monthly':
      startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000) // 12 months
      break
  }

  const leads = await prisma.lead.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
      isArchived: false,
    },
    select: {
      createdAt: true,
      currentStatusId: true,
    },
  })

  const convertedStatus = await prisma.status.findFirst({
    where: { name: 'Converted' },
  })

  // Group by period
  const grouped = new Map<string, { total: number; converted: number }>()

  leads.forEach((lead) => {
    let key: string
    const date = new Date(lead.createdAt)

    switch (period) {
      case 'daily':
        key = date.toISOString().split('T')[0]
        break
      case 'weekly':
        const week = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000))
        key = `Week ${week}`
        break
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
    }

    const current = grouped.get(key) || { total: 0, converted: 0 }
    current.total++
    if (convertedStatus && lead.currentStatusId === convertedStatus.id) {
      current.converted++
    }
    grouped.set(key, current)
  })

  return Array.from(grouped.entries()).map(([period, stats]) => ({
    period,
    totalLeads: stats.total,
    convertedLeads: stats.converted,
    conversionRate: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0,
  }))
}

