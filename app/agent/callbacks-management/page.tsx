import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CallbacksManagementClient from './CallbacksManagementClient'

export default async function CallbacksManagementPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Callbacks Management</h1>
      <CallbacksManagementClient />
    </div>
  )
}

