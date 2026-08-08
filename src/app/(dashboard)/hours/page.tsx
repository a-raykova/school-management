'use client'

import Hours from '@/components/hours/Hours'
import RoleGuard from '@/components/layout/RoleGuard'
import { useAppData } from '@/providers/AppDataProvider'

export default function HoursPage() {
  const { schedule } = useAppData()

  return (
    <RoleGuard allow="admin">
      <Hours schedule={schedule} />
    </RoleGuard>
  )
}
