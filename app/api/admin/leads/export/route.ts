import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError, handleApiError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

function escapeCsvField(field: string | null | undefined): string {
  if (!field) return ''
  const str = String(field)
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return ''
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeArchived = searchParams.get('includeArchived') === 'true'

    // Build date filter
    const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {}
    if (startDate) {
      dateFilter.createdAt = { gte: new Date(startDate) }
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Include the entire end date
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        lte: end,
      }
    }

    // Fetch leads with all related data
    const leads = await prisma.lead.findMany({
      where: {
        ...dateFilter,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        currentStatus: {
          select: {
            id: true,
            name: true,
          },
        },
        activityLogs: {
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
          orderBy: {
            timestamp: 'asc',
          },
        },
        notes: {
          include: {
            agent: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        callbacks: {
          orderBy: {
            scheduledDate: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Build CSV content
    const csvRows: string[] = []

    // Header row
    csvRows.push(
      [
        'Lead ID',
        'Name',
        'Phone',
        'Email',
        'Source Platform',
        'Campaign Name',
        'Assigned Agent',
        'Agent Email',
        'Current Status',
        'Created At',
        'Updated At',
        'Last Contacted At',
        'Is Archived',
        'Activity Logs Count',
        'Notes Count',
        'Callbacks Count',
        'Activity Logs',
        'Notes',
        'Callbacks',
      ].join(',')
    )

    // Data rows
    for (const lead of leads) {
      // Format activity logs
      const activityLogsText = lead.activityLogs
        .map(
          (log) =>
            `[${formatDate(log.timestamp)}] ${log.agent.name}: ${log.oldStatus?.name || 'N/A'} → ${log.newStatus?.name || 'N/A'}${log.note ? ` - ${log.note}` : ''}`
        )
        .join(' | ')

      // Format notes
      const notesText = lead.notes
        .map((note) => `[${formatDate(note.createdAt)}] ${note.agent.name}: ${note.content}`)
        .join(' | ')

      // Format callbacks
      const callbacksText = lead.callbacks
        .map(
          (cb) =>
            `[${formatDate(cb.scheduledDate)}] ${cb.scheduledTime || 'N/A'} - ${cb.completed ? 'Completed' : 'Pending'}${cb.notes ? ` - ${cb.notes}` : ''}`
        )
        .join(' | ')

      csvRows.push(
        [
          escapeCsvField(lead.id),
          escapeCsvField(lead.name),
          escapeCsvField(lead.phone),
          escapeCsvField(lead.email),
          escapeCsvField(lead.sourcePlatform),
          escapeCsvField(lead.campaignName),
          escapeCsvField(lead.assignedTo?.name || 'Unassigned'),
          escapeCsvField(lead.assignedTo?.email || ''),
          escapeCsvField(lead.currentStatus.name),
          escapeCsvField(formatDate(lead.createdAt)),
          escapeCsvField(formatDate(lead.updatedAt)),
          escapeCsvField(formatDate(lead.lastContactedAt)),
          escapeCsvField(lead.isArchived ? 'Yes' : 'No'),
          escapeCsvField(String(lead.activityLogs.length)),
          escapeCsvField(String(lead.notes.length)),
          escapeCsvField(String(lead.callbacks.length)),
          escapeCsvField(activityLogsText),
          escapeCsvField(notesText),
          escapeCsvField(callbacksText),
        ].join(',')
      )
    }

    const csvContent = csvRows.join('\n')

    // Return CSV file
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
