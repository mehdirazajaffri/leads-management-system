import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SystemSettingsClient from './SystemSettingsClient'
import { prisma } from '@/lib/prisma'

export default async function SystemSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const statuses = await prisma.status.findMany({
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>
      <SystemSettingsClient initialStatuses={statuses} />
    </div>
  )
}

