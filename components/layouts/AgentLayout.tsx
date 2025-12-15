'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const navItems = [
    { href: '/agent/dashboard', label: 'Dashboard' },
    { href: '/agent/assigned-leads', label: 'My Leads' },
    { href: '/agent/callbacks-management', label: 'Callbacks' },
  ]

  return (
    <div className="min-h-screen app-surface">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden xl:block fixed inset-y-0 left-0 z-30 m-4 w-72 rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="px-6 py-6">
            <div className="text-center">
              <div className="text-xs tracking-widest uppercase text-slate-500">Agent</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">Leads Workspace</div>
            </div>
          </div>
          <div className="px-4 pb-6">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition',
                      active
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                    ].join(' ')}
                  >
                    <span className={['h-2 w-2 rounded-full', active ? 'bg-indigo-300' : 'bg-slate-300'].join(' ')} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 xl:pl-[19.5rem]">
          <div className="sticky top-4 z-40 mx-4 mt-4">
            <div className="card px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Dashboard</div>
                  <div className="text-lg font-semibold text-slate-900">Agent</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium text-slate-900">{session?.user?.name || 'User'}</div>
                    <div className="text-xs text-slate-500">{session?.user?.role || 'AGENT'}</div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>

          <main className="mx-4 my-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

