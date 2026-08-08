'use client'

import { type ReactNode } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { useAppData } from '@/providers/AppDataProvider'

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAppData()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500 text-sm">
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-red-600 text-sm px-4 text-center">
        {error ?? 'Failed to load user'}
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} />

      <main className="flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
            {error}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
