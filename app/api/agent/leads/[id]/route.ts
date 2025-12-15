import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError, NotFoundError, ValidationError, handleApiError } from '@/lib/errors'
import { statusTransitionSchema } from '@/lib/validators'
import { prisma } from '@/lib/prisma'
import { createActivityLog } from '@/lib/activity-logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      throw new ForbiddenError('Authentication required')
    }

    const { id } = await params
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        currentStatus: true,
        callbacks: {
          where: { completed: false },
          orderBy: { scheduledDate: 'asc' },
        },
      },
    })

    if (!lead) {
      throw new NotFoundError('Lead not found')
    }

    // Verify ownership for agents
    if (session.user.role === 'AGENT' && lead.assignedToId !== session.user.id) {
      throw new ForbiddenError('You do not have access to this lead')
    }

    return Response.json(lead)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      throw new ForbiddenError('Authentication required')
    }

    const { id } = await params
    const body = await req.json()
    const validated = statusTransitionSchema.parse({ ...body, leadId: id })

    // Get lead and verify ownership
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        currentStatus: true,
      },
    })

    if (!lead) {
      throw new NotFoundError('Lead not found')
    }

    // Verify ownership for agents
    if (session.user.role === 'AGENT' && lead.assignedToId !== session.user.id) {
      throw new ForbiddenError('You do not have access to this lead')
    }

    // Verify new status exists
    const newStatus = await prisma.status.findUnique({
      where: { id: validated.newStatusId },
    })

    if (!newStatus) {
      throw new ValidationError('Invalid status')
    }

    // Prevent invalid transitions (e.g., Converted -> Not Converted)
    if (lead.currentStatus.isFinal && !newStatus.isFinal) {
      throw new ValidationError('Cannot transition from final status to non-final status')
    }

    // Update lead in transaction with increased timeout
    const updated = await prisma.$transaction(
      async (tx) => {
        // Update lead
        const updatedLead = await tx.lead.update({
          where: { id },
          data: {
            currentStatusId: validated.newStatusId,
            lastContactedAt: new Date(),
          },
          include: {
            currentStatus: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        // Create activity log using transaction client
        await tx.activityLog.create({
          data: {
            leadId: id,
            agentId: session.user.id,
            oldStatusId: lead.currentStatusId,
            newStatusId: validated.newStatusId,
            note: validated.note || null,
            isPrivate: false,
            timestamp: new Date(),
          },
        })

        // Handle callback scheduling if status is "Scheduled Callback"
        if (newStatus.name === 'Scheduled Callback' && body.scheduledDate) {
          await tx.callback.create({
            data: {
              leadId: id,
              scheduledDate: new Date(body.scheduledDate),
              scheduledTime: body.scheduledTime || null,
              notes: body.callbackNotes || null,
            },
          })
        }

        return updatedLead
      },
      {
        maxWait: 10000, // Maximum time to wait for a transaction slot (10 seconds)
        timeout: 15000, // Maximum time the transaction can run (15 seconds)
      }
    )

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

