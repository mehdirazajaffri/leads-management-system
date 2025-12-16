import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError, NotFoundError, ValidationError, handleApiError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { createActivityLog } from '@/lib/activity-logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const { id } = await params
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
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

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const { id } = await params
    const body = await req.json()
    const { newStatusId, note, scheduledDate, scheduledTime, callbackNotes } = body

    // Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { currentStatus: true },
    })

    if (!lead) {
      throw new NotFoundError('Lead not found')
    }

    // Verify status if provided
    if (newStatusId) {
      const status = await prisma.status.findUnique({
        where: { id: newStatusId },
      })
      if (!status) {
        throw new ValidationError('Invalid status ID')
      }
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(
      async (tx) => {
        const oldStatusId = lead.currentStatusId
        const updateData: any = {}

        if (newStatusId && newStatusId !== oldStatusId) {
          updateData.currentStatusId = newStatusId
          updateData.lastContactedAt = new Date()
        }

        // Update lead
        const updatedLead = await tx.lead.update({
          where: { id },
          data: updateData,
          include: {
            currentStatus: true,
            assignedTo: { select: { id: true, name: true } },
          },
        })

        // Create activity log if status changed or note provided
        if ((newStatusId && newStatusId !== oldStatusId) || note) {
          await tx.activityLog.create({
            data: {
              leadId: id,
              agentId: session.user.id,
              oldStatusId: newStatusId && newStatusId !== oldStatusId ? oldStatusId : null,
              newStatusId: newStatusId && newStatusId !== oldStatusId ? newStatusId : null,
              note: note || null,
            },
          })
        }

        // Handle callback creation if status is "Scheduled Callback"
        if (newStatusId && newStatusId !== oldStatusId) {
          const newStatus = await tx.status.findUnique({
            where: { id: newStatusId },
          })

          if (newStatus?.name === 'Scheduled Callback' && scheduledDate) {
            // Check if callback already exists for this date/time
            const existingCallback = await tx.callback.findFirst({
              where: {
                leadId: id,
                scheduledDate: new Date(scheduledDate),
                scheduledTime: scheduledTime || null,
                completed: false,
              },
            })

            if (!existingCallback) {
              await tx.callback.create({
                data: {
                  leadId: id,
                  scheduledDate: new Date(scheduledDate),
                  scheduledTime: scheduledTime || null,
                  notes: callbackNotes || null,
                },
              })
            }
          }
        }

        return updatedLead
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    )

    return Response.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

