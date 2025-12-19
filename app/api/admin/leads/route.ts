import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError, ValidationError, handleApiError } from '@/lib/errors'
import { createLeadSchema } from '@/lib/validators'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const body = await req.json()
    const validated = createLeadSchema.parse(body)

    // Verify status exists
    const status = await prisma.status.findUnique({
      where: { id: validated.currentStatusId },
    })

    if (!status) {
      throw new ValidationError('Invalid status ID')
    }

    // Verify agent exists if assigned
    if (validated.assignedToId) {
      const agent = await prisma.user.findUnique({
        where: { id: validated.assignedToId, role: 'AGENT' },
      })

      if (!agent) {
        throw new ValidationError('Invalid agent ID')
      }
    }

    // Check for duplicate email or phone
    const whereClause: Array<{ phone: string } | { email: string }> = [{ phone: validated.phone }]
    if (validated.email && validated.email.trim() !== '') {
      whereClause.push({ email: validated.email.toLowerCase() })
    }

    const existing = await prisma.lead.findFirst({
      where: {
        OR: whereClause,
      },
    })

    if (existing) {
      throw new ValidationError('A lead with this email or phone already exists')
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        name: validated.name,
        phone: validated.phone,
        email: validated.email && validated.email.trim() !== '' ? validated.email.toLowerCase() : '',
        sourcePlatform: validated.sourcePlatform || '',
        campaignName: validated.campaignName || '',
        assignedToId: validated.assignedToId || null,
        currentStatusId: validated.currentStatusId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        currentStatus: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return Response.json(lead, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

