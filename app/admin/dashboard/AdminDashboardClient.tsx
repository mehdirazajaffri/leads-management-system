'use client'

import { useEffect, useMemo, useState } from 'react'
import type { AdminDashboardAnalytics, AdminAnalyticsRange } from '@/lib/admin-dashboard-analytics'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import Modal from '@/components/features/Modal'
import { useToast } from '@/context/ToastContext'

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#64748b']

function KpiCard({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string | number
  emphasis?: boolean
}) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</div>
        <div className={['mt-2 font-semibold text-slate-900 dark:text-white', emphasis ? 'text-4xl' : 'text-3xl'].join(' ')}>
          {value}
        </div>
        <div className="mt-3 h-1 w-12 rounded-full bg-blue-600/80" />
      </div>
    </div>
  )
}

export default function AdminDashboardClient({
  initial,
}: {
  initial: AdminDashboardAnalytics
}) {
  const toast = useToast()
  const [data, setData] = useState(initial)
  const [campaign, setCampaign] = useState<string>('all')
  const [range, setRange] = useState<AdminAnalyticsRange>('30d')
  const [loading, setLoading] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportDateRange, setExportDateRange] = useState({
    startDate: '',
    endDate: '',
    includeArchived: false,
  })
  const campaigns = data.campaigns

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const qs = new URLSearchParams()
        if (campaign !== 'all') qs.set('campaign', campaign)
        qs.set('range', range)
        const res = await fetch(`/api/admin/analytics?${qs.toString()}`)
        const json = (await res.json()) as AdminDashboardAnalytics
        if (!cancelled && res.ok) setData(json)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [campaign, range])

  const barData = useMemo(
    () =>
      data.conversionByAgent.map((a) => ({
        name: a.agentName,
        rate: Number(a.conversionRate.toFixed(1)),
      })),
    [data.conversionByAgent]
  )

  const pieData = useMemo(
    () =>
      data.leadsBySource.map((s) => ({
        name: s.sourcePlatform,
        value: s.totalLeads,
      })),
    [data.leadsBySource]
  )

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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Analytics View</div>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">Admin Dashboard</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            Export Data
          </button>
          <select
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 shadow-sm"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as AdminAnalyticsRange)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 shadow-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          {loading ? <div className="text-sm text-slate-500 dark:text-slate-400 self-center">Updating…</div> : null}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Total Leads Uploaded" value={data.kpis.totalLeadsUploaded} />
        <KpiCard label="Total Converted Leads" value={data.kpis.totalConvertedLeads} />
        <KpiCard
          label="Overall Conversion Rate"
          value={`${data.kpis.overallConversionRate.toFixed(1)}%`}
          emphasis
        />
        <KpiCard label="Total Active Agents" value={data.kpis.totalActiveAgents} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Conversion Rate by Agent</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Bar chart comparing each agent's conversion rate.</div>
          </div>
          <div className="card-body h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ left: 8, right: 16, top: 12, bottom: 12 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="rate" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Leads by Source Platform</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Distribution of leads across acquisition sources.</div>
          </div>
          <div className="card-body h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Agent Progress Table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Agent Progress (Summary)</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Agent Name, Leads Assigned, Leads Processed Today, Current Conversion Rate.
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-gray-800">
              <tr>
                {['Agent', 'Leads Assigned', 'Processed Today', 'Conversion Rate'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-300"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-gray-800">
              {data.conversionByAgent.map((a) => (
                <tr key={a.agentId} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{a.agentName}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{a.leadsAssigned}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{a.leadsProcessedToday}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {a.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {data.conversionByAgent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No agents found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
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


