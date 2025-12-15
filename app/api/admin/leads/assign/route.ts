import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError, ValidationError, handleApiError } from '@/lib/errors'
import { bulkAssignLeadsSchema } from '@/lib/validators'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const body = await req.json()
    const validated = bulkAssignLeadsSchema.parse(body)

    // Verify agent exists
    const agent = await prisma.user.findUnique({
      where: { id: validated.agentId, role: 'AGENT' },
    })

    if (!agent) {
      throw new ValidationError('Invalid agent ID')
    }

    // Update leads in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.lead.updateMany({
        where: {
          id: { in: validated.leadIds },
        },
        data: {
          assignedToId: validated.agentId,
        },
      })

      return updateResult
    })

    return Response.json({
      success: true,
      updated: result.count,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

