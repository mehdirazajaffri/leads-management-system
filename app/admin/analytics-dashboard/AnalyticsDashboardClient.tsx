'use client'

import { useState } from 'react'
import Modal from '@/components/features/Modal'
import { useToast } from '@/context/ToastContext'

interface AnalyticsDashboardClientProps {
  conversionRates: Array<{
    agentId: string
    agentName: string
    totalLeads: number
    convertedLeads: number
    conversionRate: number
  }>
  sourcePlatforms: Array<{
    sourcePlatform: string
    totalLeads: number
    convertedLeads: number
    conversionRate: number
  }>
  campaigns: Array<{
    campaignName: string
    totalLeads: number
    convertedLeads: number
    conversionRate: number
  }>
}

export default function AnalyticsDashboardClient({
  conversionRates,
  sourcePlatforms,
  campaigns,
}: AnalyticsDashboardClientProps) {
  const toast = useToast()
  const [showExportModal, setShowExportModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportDateRange, setExportDateRange] = useState({
    startDate: '',
    endDate: '',
    includeArchived: false,
  })

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (exportDateRange.startDate) {
        params.append('startDate', exportDateRange.startDate)
      }
      if (exportDateRange.endDate) {
        params.append('endDate', exportDateRange.endDate)
      }
      if (exportDateRange.includeArchived) {
        params.append('includeArchived', 'true')
      }

      const url = `/api/admin/leads/export${params.toString() ? `?${params.toString()}` : ''}`
      window.location.href = url
      
      toast.success('Export started. Your download should begin shortly.')
      setShowExportModal(false)
      // Reset form
      setExportDateRange({
        startDate: '',
        endDate: '',
        includeArchived: false,
      })
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Insights</div>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">Analytics Dashboard</h1>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          Export Data
        </button>
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

      <Modal
        title="Export Leads Data"
        open={showExportModal}
        onClose={() => {
          setShowExportModal(false)
          setExportDateRange({
            startDate: '',
            endDate: '',
            includeArchived: false,
          })
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Export leads data with all related information including statuses, activity logs, notes, and callbacks.
            Leave dates empty to export all leads.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={exportDateRange.startDate}
              onChange={(e) =>
                setExportDateRange({ ...exportDateRange, startDate: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={exportDateRange.endDate}
              onChange={(e) =>
                setExportDateRange({ ...exportDateRange, endDate: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeArchived"
              checked={exportDateRange.includeArchived}
              onChange={(e) =>
                setExportDateRange({ ...exportDateRange, includeArchived: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="includeArchived"
              className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Include archived leads
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowExportModal(false)
                setExportDateRange({
                  startDate: '',
                  endDate: '',
                  includeArchived: false,
                })
              }}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

