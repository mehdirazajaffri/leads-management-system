'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDateReadable, formatTime12Hour } from '@/lib/date-utils'
import { useToast } from '@/context/ToastContext'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  sourcePlatform: string
  campaignName: string
  assignedTo: { id: string; name: string } | null
  currentStatus: { id: string; name: string }
  createdAt: Date
  lastContactedAt: Date | null
  callbacks: Array<{
    id: string
    scheduledDate: Date
    scheduledTime: string | null
    notes: string | null
  }>
}

interface ActivityLog {
  id: string
  timestamp: Date
  note: string | null
  agent: { name: string }
  oldStatus: { name: string } | null
  newStatus: { name: string } | null
}

interface Status {
  id: string
  name: string
  isFinal: boolean
}

export default function LeadDetailClient({
  lead,
  activityLogs,
  statuses,
}: {
  lead: Lead
  activityLogs: ActivityLog[]
  statuses: Status[]
}) {
  const toast = useToast()
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState(lead.currentStatus.id)
  const [note, setNote] = useState('')
  const [callbackDate, setCallbackDate] = useState<string>('')
  const [callbackTime, setCallbackTime] = useState<string>('')
  const [callbackNotes, setCallbackNotes] = useState<string>('')
  const [updating, setUpdating] = useState(false)

  const selectedStatusObj = statuses.find((s) => s.id === selectedStatus)
  const isScheduledCallback = selectedStatusObj?.name === 'Scheduled Callback'

  const handleStatusUpdate = async () => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatusId: selectedStatus,
          note: note || undefined,
          scheduledDate: isScheduledCallback && callbackDate ? callbackDate : undefined,
          scheduledTime: isScheduledCallback && callbackTime ? callbackTime : undefined,
          callbackNotes: isScheduledCallback && callbackNotes ? callbackNotes : undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Saved successfully')
        router.refresh()
      } else {
        toast.error(`Error: ${data.message}`)
      }
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500">Core Workspace</div>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">Lead Calling View</h1>
        </div>
        <Link
          href="/admin/leads-management"
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700"
        >
          Back to Leads
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column: lead details + update */}
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Lead Details</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Everything you need while on a call.</div>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">{lead.name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{lead.email}</div>
                </div>
                <a
                  href={`tel:${lead.phone}`}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  title="Call"
                >
                  Call
                </a>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 px-4 py-3">
                <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Phone</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{lead.phone}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3">
                  <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Source</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{lead.sourcePlatform}</div>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3">
                  <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Campaign</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{lead.campaignName}</div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3">
                <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Assigned To</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {lead.assignedTo?.name || <span className="text-slate-400 dark:text-slate-500 italic">Unassigned</span>}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3">
                <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Current Status</div>
                <div className="mt-1 inline-flex items-center rounded-full bg-slate-100 dark:bg-gray-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lead.currentStatus.name}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Status Update & Notes</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Primary action: set status, optionally schedule callback.</div>
            </div>
            <div className="card-body space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Primary Status</div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3 text-base font-semibold text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-600/30"
                >
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              {isScheduledCallback ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Callback Date</div>
                    <input
                      type="date"
                      value={callbackDate}
                      onChange={(e) => setCallbackDate(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-slate-900 dark:text-white shadow-sm"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Callback Time</div>
                    <input
                      type="time"
                      value={callbackTime}
                      onChange={(e) => setCallbackTime(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-slate-900 dark:text-white shadow-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Callback Notes</div>
                    <input
                      value={callbackNotes}
                      onChange={(e) => setCallbackNotes(e.target.value)}
                      placeholder="Reason + context for the callback…"
                      className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-slate-900 dark:text-white shadow-sm"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Notes</div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={5}
                  placeholder="Write call notes…"
                  className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-slate-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-blue-600/30"
                />
              </div>

              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Saving…' : 'Save Update'}
              </button>
            </div>
          </div>
        </div>

        {/* Right column: activity history */}
        <div className="space-y-4">
          {lead.callbacks.length > 0 ? (
            <div className="card">
              <div className="card-header">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Scheduled Callbacks</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upcoming callbacks for this lead.</div>
              </div>
              <div className="card-body space-y-2">
                {lead.callbacks.map((callback) => (
                  <div key={callback.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatDateReadable(callback.scheduledDate)}
                      {callback.scheduledTime ? ` at ${callback.scheduledTime}` : ''}
                    </div>
                    {callback.notes ? <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{callback.notes}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="card">
            <div className="card-header">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Activity Log History</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Status changes and notes with timestamps.</div>
            </div>
            <div className="card-body space-y-3">
              {activityLogs.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">No activity yet</div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm text-slate-900 dark:text-white">
                          <span className="font-semibold">{log.agent.name}</span>{' '}
                          {log.oldStatus && log.newStatus ? (
                            <>
                              <span className="text-slate-500 dark:text-slate-400">changed status from</span>{' '}
                              <span className="font-semibold">{log.oldStatus.name}</span>{' '}
                              <span className="text-slate-500 dark:text-slate-400">to</span>{' '}
                              <span className="font-semibold">{log.newStatus.name}</span>
                            </>
                          ) : null}
                        </div>
                        {log.note ? <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">{log.note}</div> : null}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDateReadable(log.timestamp)} {formatTime12Hour(log.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

