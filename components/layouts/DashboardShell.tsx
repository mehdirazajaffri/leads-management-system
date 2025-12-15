'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import { BellIcon, CogIcon, CollapseIcon, ExpandIcon, UserCircleIcon } from '@/components/features/nav-icons'

export type ShellNavItem = {
  href: string
  label: string
  icon?: React.ReactNode
}

function prettyLabel(seg: string) {
  return seg
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

export default function DashboardShell({
  brandName,
  navItems,
  children,
}: {
  brandName: string
  navItems: ShellNavItem[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [openMobile, setOpenMobile] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [openUser, setOpenUser] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lms.sidebarCollapsed')
      if (saved === '1') setCollapsed(true)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('lms.sidebarCollapsed', collapsed ? '1' : '0')
    } catch {}
  }, [collapsed])

  const crumbs = useMemo(() => {
    const segs = pathname.split('/').filter(Boolean)
    if (segs.length <= 1) return ['Dashboard', 'Home']
    return [prettyLabel(segs[0] || 'Dashboard'), prettyLabel(segs[1] || 'Home')]
  }, [pathname])

  const sideWidth = collapsed ? 'w-20' : 'w-72'
  const mainPad = collapsed ? 'xl:pl-[6.25rem]' : 'xl:pl-[19.5rem]'

  const Side = (
    <aside
      className={`fixed inset-y-0 left-0 z-40 m-4 h-[calc(100vh-32px)] ${sideWidth} rounded-xl border border-slate-200 bg-white shadow-xl transition-all`}
    >
      <div className="px-4 py-6 flex items-center justify-between">
        <div className="flex-1 text-center">
          <div className="text-sm font-semibold text-slate-900">
            {collapsed ? brandName.split(' ').slice(0, 2).map((w) => w[0]).join('') : brandName}
          </div>
        </div>
        <button
          className="hidden xl:grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ExpandIcon /> : <CollapseIcon />}
        </button>
      </div>

      <div className="px-3">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={[
                  'flex items-center rounded-lg px-3 py-3 text-sm font-semibold transition',
                  collapsed ? 'justify-center' : 'gap-3',
                  active
                    ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md shadow-slate-900/10 ring-1 ring-slate-900/10'
                    : 'text-slate-700 hover:bg-slate-100',
                ].join(' ')}
              >
                <span
                  className={[
                    'grid h-8 w-8 place-items-center rounded-lg',
                    active ? 'bg-white/10' : 'bg-slate-100',
                  ].join(' ')}
                >
                  {item.icon}
                </span>
                {collapsed ? null : item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen app-surface">
      {/* Desktop sidenav */}
      <div className="hidden xl:block">{Side}</div>

      {/* Mobile sidenav */}
      {openMobile ? (
        <div className="xl:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpenMobile(false)} />
          <div className="absolute inset-y-0 left-0 w-80">{Side}</div>
        </div>
      ) : null}

      <div className={mainPad}>
        {/* Top navbar */}
        <div className="sticky top-4 z-40 mx-4 mt-4">
          <div className="card px-4 py-3">
            <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
              <div className="capitalize">
                <div className="text-xs text-slate-500">
                  {crumbs[0]} <span className="mx-1">/</span> {crumbs[1]}
                </div>
                <div className="text-lg font-semibold text-slate-900">{crumbs[1]}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="xl:hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  onClick={() => setOpenMobile(true)}
                >
                  Menu
                </button>
                <div className="hidden md:block">
                  <input
                    placeholder="Search"
                    className="w-72 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>
                <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label="Notifications">
                  <BellIcon />
                </button>
                <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label="Settings">
                  <CogIcon />
                </button>

                {/* User menu */}
                <div className="relative">
                  <button
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 inline-flex items-center gap-2"
                    onClick={() => setOpenUser((v) => !v)}
                    aria-label="User menu"
                  >
                    <UserCircleIcon />
                    <span className="hidden sm:inline">{session?.user?.name || 'User'}</span>
                  </button>

                  {openUser ? (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenUser(false)} />
                      <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-xl">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <div className="text-sm font-semibold text-slate-900">{session?.user?.name || 'User'}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{session?.user?.email || ''}</div>
                          <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {session?.user?.role || 'USER'}
                          </div>
                        </div>
                        <button
                          onClick={() => signOut({ callbackUrl: '/login' })}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 rounded-b-xl"
                        >
                          Log out
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="mx-4 my-6">{children}</main>
      </div>
    </div>
  )
}


