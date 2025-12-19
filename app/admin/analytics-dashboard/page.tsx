import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getConversionRateByAgent,
  getLeadsBySourcePlatform,
  getCampaignPerformance,
} from '@/lib/analytics'
import AnalyticsDashboardClient from './AnalyticsDashboardClient'

export default async function AnalyticsDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const [conversionRates, sourcePlatforms, campaigns] = await Promise.all([
    getConversionRateByAgent(),
    getLeadsBySourcePlatform(),
    getCampaignPerformance(),
  ])

  return (
    <AnalyticsDashboardClient
      conversionRates={conversionRates}
      sourcePlatforms={sourcePlatforms}
      campaigns={campaigns}
    />
  )
}

