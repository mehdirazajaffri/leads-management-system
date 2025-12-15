import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError, ValidationError, handleApiError } from '@/lib/errors'
import { bulkUpdateLeadsSchema } from '@/lib/validators'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const body = await req.json()
    const validated = bulkUpdateLeadsSchema.parse(body)

    const updateData: any = {}
    if (validated.statusId) {
      // Verify status exists
      const status = await prisma.status.findUnique({
        where: { id: validated.statusId },
      })
      if (!status) {
        throw new ValidationError('Invalid status ID')
      }
      updateData.currentStatusId = validated.statusId
    }
    if (validated.assignedToId !== undefined) {
      if (validated.assignedToId) {
        // Verify agent exists
        const agent = await prisma.user.findUnique({
          where: { id: validated.assignedToId, role: 'AGENT' },
        })
        if (!agent) {
          throw new ValidationError('Invalid agent ID')
        }
      }
      updateData.assignedToId = validated.assignedToId
    }
    if (validated.isArchived !== undefined) {
      updateData.isArchived = validated.isArchived
    }

    const result = await prisma.lead.updateMany({
      where: {
        id: { in: validated.leadIds },
      },
      data: updateData,
    })

    return Response.json({
      success: true,
      updated: result.count,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const body = await req.json()
    const { leadIds } = body

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      throw new ValidationError('leadIds array is required')
    }

    // Archive leads instead of deleting (soft delete)
    const result = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
      },
      data: {
        isArchived: true,
      },
    })

    return Response.json({
      success: true,
      archived: result.count,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

