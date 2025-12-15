import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError, handleApiError } from '@/lib/errors'
import { leadFilterSchema, paginationSchema } from '@/lib/validators'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const searchParams = req.nextUrl.searchParams
    const filters = leadFilterSchema.parse(Object.fromEntries(searchParams))
    const { page, limit } = paginationSchema.parse(Object.fromEntries(searchParams))

    const where: any = {
      isArchived: filters.isArchived ?? false,
    }

    if (filters.agentId) {
      where.assignedToId = filters.agentId
    }
    if (filters.statusId) {
      where.currentStatusId = filters.statusId
    }
    if (filters.sourcePlatform) {
      where.sourcePlatform = { contains: filters.sourcePlatform, mode: 'insensitive' }
    }
    if (filters.campaignName) {
      where.campaignName = { contains: filters.campaignName, mode: 'insensitive' }
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate)
      }
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            name: true,
            email: true,
          },
        },
        currentStatus: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 10, // Export more than pagination limit
    })

    // Convert to CSV
    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Source Platform',
      'Campaign Name',
      'Assigned To',
      'Status',
      'Created At',
      'Last Contacted',
    ]

    const rows = leads.map((lead) => [
      lead.id,
      lead.name,
      lead.email,
      lead.phone,
      lead.sourcePlatform,
      lead.campaignName,
      lead.assignedTo?.name || 'Unassigned',
      lead.currentStatus.name,
      lead.createdAt.toISOString(),
      lead.lastContactedAt?.toISOString() || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const filename = `leads-export-${new Date().toISOString().split('T')[0]}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

