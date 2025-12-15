'use client'

import DashboardShell from '@/components/layouts/DashboardShell'
import { BellIcon, HomeIcon, TableIcon } from '@/components/features/nav-icons'

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { href: '/agent/dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { href: '/agent/assigned-leads', label: 'Tables', icon: <TableIcon /> },
    { href: '/agent/callbacks-management', label: 'Notifications', icon: <BellIcon /> },
  ]

  return (
    <DashboardShell brandName="Material Tailwind React" navItems={navItems}>
      {children}
    </DashboardShell>
  )
}

