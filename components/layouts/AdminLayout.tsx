'use client'

import DashboardShell from '@/components/layouts/DashboardShell'
import { CogIcon, HomeIcon, TableIcon, UserIcon } from '@/components/features/nav-icons'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { href: '/admin/leads-management', label: 'Leads', icon: <TableIcon /> },
    { href: '/admin/agents-management', label: 'Agents', icon: <UserIcon /> },
    { href: '/admin/analytics-dashboard', label: 'Analytics', icon: <TableIcon /> },
    { href: '/admin/system-settings', label: 'Settings', icon: <CogIcon /> },
  ]

  return (
    <DashboardShell brandName="Material Tailwind React" navItems={navItems}>
      {children}
    </DashboardShell>
  )
}

