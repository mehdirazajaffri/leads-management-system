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
      <div>
        <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Insights</div>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">Analytics Dashboard</h1>
      </div>

      {/* Conversion Rate by Agent */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Conversion Rate by Agent</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Converted leads divided by total assigned leads.</p>
        </div>
        <div className="card-body space-y-3">
          {conversionRates.map((rate) => (
            <div
              key={rate.agentId}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{rate.agentName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {rate.convertedLeads} / {rate.totalLeads} leads
                </p>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{rate.conversionRate.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leads by Source Platform */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Leads by Source Platform</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Conversion by acquisition channel.</p>
        </div>
        <div className="card-body space-y-3">
          {sourcePlatforms.map((platform) => (
            <div
              key={platform.sourcePlatform}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{platform.sourcePlatform}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {platform.convertedLeads} / {platform.totalLeads} leads
                </p>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{platform.conversionRate.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Campaign Performance</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Conversions by campaign.</p>
        </div>
        <div className="card-body space-y-3">
          {campaigns.map((campaign) => (
            <div
              key={campaign.campaignName}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{campaign.campaignName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {campaign.convertedLeads} / {campaign.totalLeads} leads
                </p>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{campaign.conversionRate.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

