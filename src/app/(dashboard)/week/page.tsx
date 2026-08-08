'use client'

import Week from '@/components/week/Week'
import RoleGuard from '@/components/layout/RoleGuard'
import { useAppData } from '@/providers/AppDataProvider'

export default function WeekPage() {
  const { schedule, user } = useAppData()

  return (
    <RoleGuard allow="teacher">
      {user && <Week schedule={schedule} user={user} />}
    </RoleGuard>
  )
}
