import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getConversionRateByAgent,
  getLeadsBySourcePlatform,
  getCampaignPerformance,
} from '@/lib/analytics'

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      {/* Conversion Rate by Agent */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Conversion Rate by Agent</h2>
        <div className="space-y-2">
          {conversionRates.map((rate) => (
            <div key={rate.agentId} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-medium">{rate.agentName}</p>
                <p className="text-sm text-gray-500">
                  {rate.convertedLeads} / {rate.totalLeads} leads
                </p>
              </div>
              <p className="text-lg font-bold">{rate.conversionRate.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leads by Source Platform */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Leads by Source Platform</h2>
        <div className="space-y-2">
          {sourcePlatforms.map((platform) => (
            <div key={platform.sourcePlatform} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-medium">{platform.sourcePlatform}</p>
                <p className="text-sm text-gray-500">
                  {platform.convertedLeads} / {platform.totalLeads} leads
                </p>
              </div>
              <p className="text-lg font-bold">{platform.conversionRate.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Campaign Performance</h2>
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <div key={campaign.campaignName} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-medium">{campaign.campaignName}</p>
                <p className="text-sm text-gray-500">
                  {campaign.convertedLeads} / {campaign.totalLeads} leads
                </p>
              </div>
              <p className="text-lg font-bold">{campaign.conversionRate.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

