import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError, NotFoundError, ValidationError, handleApiError } from '@/lib/errors'
import { createCallbackSchema, updateCallbackSchema } from '@/lib/validators'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      throw new ForbiddenError('Authentication required')
    }

    const searchParams = req.nextUrl.searchParams
    const filter = searchParams.get('filter') || 'upcoming'
    const agentId = session.user.role === 'ADMIN' ? searchParams.get('agentId') : session.user.id

    const where: any = {
      lead: {
        assignedToId: agentId || session.user.id,
      },
    }

    if (filter === 'upcoming') {
      where.completed = false
      where.scheduledDate = { gte: new Date() }
    } else if (filter === 'overdue') {
      where.completed = false
      where.scheduledDate = { lt: new Date() }
    } else if (filter === 'completed') {
      where.completed = true
    }

    const callbacks = await prisma.callback.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    })

    return Response.json(callbacks)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      throw new ForbiddenError('Authentication required')
    }

    const body = await req.json()
    const validated = createCallbackSchema.parse(body)

    // Verify lead exists and agent has access
    const lead = await prisma.lead.findUnique({
      where: { id: validated.leadId },
    })

    if (!lead) {
      throw new NotFoundError('Lead not found')
    }

    if (session.user.role === 'AGENT' && lead.assignedToId !== session.user.id) {
      throw new ForbiddenError('You do not have access to this lead')
    }

    const callback = await prisma.callback.create({
      data: {
        leadId: validated.leadId,
        scheduledDate: new Date(validated.scheduledDate),
        scheduledTime: validated.scheduledTime || null,
        notes: validated.notes || null,
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return Response.json(callback, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      throw new ForbiddenError('Authentication required')
    }

    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      throw new ValidationError('Callback ID is required')
    }

    const validated = updateCallbackSchema.parse(data)

    // Verify callback exists and agent has access
    const callback = await prisma.callback.findUnique({
      where: { id },
      include: {
        lead: true,
      },
    })

    if (!callback) {
      throw new NotFoundError('Callback not found')
    }

    if (session.user.role === 'AGENT' && callback.lead.assignedToId !== session.user.id) {
      throw new ForbiddenError('You do not have access to this callback')
    }

    const updateData: any = {}
    if (validated.scheduledDate) {
      updateData.scheduledDate = new Date(validated.scheduledDate)
    }
    if (validated.scheduledTime !== undefined) {
      updateData.scheduledTime = validated.scheduledTime
    }
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes
    }
    if (validated.completed !== undefined) {
      updateData.completed = validated.completed
      if (validated.completed) {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }

    const updated = await prisma.callback.update({
      where: { id },
      data: updateData,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      throw new ForbiddenError('Authentication required')
    }

    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      throw new ValidationError('Callback ID is required')
    }

    // Verify callback exists and agent has access
    const callback = await prisma.callback.findUnique({
      where: { id },
      include: {
        lead: true,
      },
    })

    if (!callback) {
      throw new NotFoundError('Callback not found')
    }

    if (session.user.role === 'AGENT' && callback.lead.assignedToId !== session.user.id) {
      throw new ForbiddenError('You do not have access to this callback')
    }

    await prisma.callback.delete({
      where: { id },
    })

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

