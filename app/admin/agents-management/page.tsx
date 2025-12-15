import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AgentsManagementClient from './AgentsManagementClient'
import { prisma } from '@/lib/prisma'

export default async function AgentsManagementPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const agents = await prisma.user.findMany({
    where: { role: 'AGENT' },
    include: {
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-black">Agents Management</h1>
      <AgentsManagementClient initialAgents={agents} />
    </div>
  )
}

