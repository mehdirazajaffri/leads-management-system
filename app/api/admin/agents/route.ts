import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError, NotFoundError, ValidationError, handleApiError } from '@/lib/errors'
import { createUserSchema, updateUserSchema } from '@/lib/validators'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            leadsAssigned: {
              where: { isArchived: false },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return Response.json(agents)
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
    const validated = createUserSchema.parse(body)

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existing) {
      throw new ValidationError('Email already exists')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10)

    // Always set role to AGENT for agent creation (ignore any role in request)
    const agent = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        name: validated.name,
        role: 'AGENT', // Always AGENT for agent creation endpoint
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return Response.json(agent, { status: 201 })
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
    const { id, ...updateData } = updateUserSchema.parse(body)

    if (!id) {
      throw new ValidationError('Agent ID is required')
    }

    // Check if agent exists
    const agent = await prisma.user.findUnique({
      where: { id, role: 'AGENT' },
    })

    if (!agent) {
      throw new NotFoundError('Agent not found')
    }

    // If email is being updated, check for duplicates
    if (updateData.email && updateData.email !== agent.email) {
      const existing = await prisma.user.findUnique({
        where: { email: updateData.email },
      })
      if (existing) {
        throw new ValidationError('Email already exists')
      }
    }

    // Hash password if provided
    const data: any = { ...updateData }
    if (updateData.password) {
      data.passwordHash = await bcrypt.hash(updateData.password, 10)
      delete data.password
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
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

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      throw new ValidationError('Agent ID is required')
    }

    // Check if agent exists
    const agent = await prisma.user.findUnique({
      where: { id, role: 'AGENT' },
    })

    if (!agent) {
      throw new NotFoundError('Agent not found')
    }

    // Soft delete - unassign all leads first
    await prisma.lead.updateMany({
      where: { assignedToId: id },
      data: { assignedToId: null },
    })

    // Delete agent
    await prisma.user.delete({
      where: { id },
    })

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

