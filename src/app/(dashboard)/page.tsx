'use client'

import Dashboard from '@/components/dashboard/Dashboard'
import { useAppData } from '@/providers/AppDataProvider'

export default function DashboardPage() {
  const { rooms, announcements, user, schedule, teachersList } = useAppData()

  if (!user) return null

  return (
    <Dashboard
      rooms={rooms}
      announcements={announcements}
      user={user}
      schedule={schedule}
      teachers={teachersList}
    />
  )
}
