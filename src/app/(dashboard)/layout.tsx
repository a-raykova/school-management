'use client'

import { AppDataProvider } from '@/providers/AppDataProvider'
import DashboardShell from '@/components/layout/DashboardShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <DashboardShell>{children}</DashboardShell>
    </AppDataProvider>
  )
}
