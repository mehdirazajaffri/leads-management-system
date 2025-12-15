import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError, handleApiError } from '@/lib/errors'
import { getAdminDashboardAnalytics, type AdminAnalyticsRange } from '@/lib/admin-dashboard-analytics'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required')
    }

    const { searchParams } = new URL(req.url)
    const campaign = searchParams.get('campaign') || undefined
    const range = (searchParams.get('range') || '30d') as AdminAnalyticsRange

    const data = await getAdminDashboardAnalytics({ campaign, range })
    return Response.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}


