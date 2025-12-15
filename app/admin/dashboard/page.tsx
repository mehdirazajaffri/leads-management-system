import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DatabaseUnavailable from '@/components/features/DatabaseUnavailable'
import { getAdminDashboardAnalytics } from '@/lib/admin-dashboard-analytics'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  try {
    const initial = await getAdminDashboardAnalytics({ range: '30d' })
    return <AdminDashboardClient initial={initial} />
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("Can't reach database server") || msg.includes('Connection terminated due to connection timeout')) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold text-slate-900">Admin Dashboard</h1>
          <DatabaseUnavailable details={msg} />
        </div>
      )
    }
    throw e
  }
}

