import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError, NotFoundError, ValidationError, handleApiError } from '@/lib/errors'
import { createStatusSchema, updateStatusSchema } from '@/lib/validators'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const statuses = await prisma.status.findMany({
      orderBy: { name: 'asc' },
    })

    return Response.json(statuses)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const body = await req.json()
    const { type, ...data } = body

    if (type === 'status') {
      const validated = createStatusSchema.parse(data)

      // Check if status name already exists
      const existing = await prisma.status.findUnique({
        where: { name: validated.name },
      })

      if (existing) {
        throw new ValidationError('Status name already exists')
      }

      const status = await prisma.status.create({
        data: validated,
      })

      return Response.json(status, { status: 201 })
    }

    throw new ValidationError('Invalid type')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const body = await req.json()
    const { type, id, ...data } = body

    if (type === 'status') {
      if (!id) {
        throw new ValidationError('Status ID is required')
      }

      const validated = updateStatusSchema.parse(data)

      // Check if status exists
      const status = await prisma.status.findUnique({
        where: { id },
      })

      if (!status) {
        throw new NotFoundError('Status not found')
      }

      // If name is being updated, check for duplicates
      if (validated.name && validated.name !== status.name) {
        const existing = await prisma.status.findUnique({
          where: { name: validated.name },
        })
        if (existing) {
          throw new ValidationError('Status name already exists')
        }
      }

      const updated = await prisma.status.update({
        where: { id },
        data: validated,
      })

      return Response.json(updated)
    }

    throw new ValidationError('Invalid type')
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

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (type === 'status') {
      if (!id) {
        throw new ValidationError('Status ID is required')
      }

      // Check if status exists
      const status = await prisma.status.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              leads: true,
            },
          },
        },
      })

      if (!status) {
        throw new NotFoundError('Status not found')
      }

      // Don't allow deletion if status is in use
      if (status._count.leads > 0) {
        throw new ValidationError('Cannot delete status that is in use')
      }

      await prisma.status.delete({
        where: { id },
      })

      return Response.json({ success: true })
    }

    throw new ValidationError('Invalid type')
  } catch (error) {
    return handleApiError(error)
  }
}

