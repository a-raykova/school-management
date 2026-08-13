'use client'

import Hours from '@/components/hours/Hours'
import RoleGuard from '@/components/layout/RoleGuard'
import { useAppData } from '@/providers/AppDataProvider'

export default function HoursPage() {
  const { schedule, teachersList, handleUpdateTeacherRate } = useAppData()

  return (
    <RoleGuard allow="admin">
      <Hours
        schedule={schedule}
        teachers={teachersList}
        onUpdateRate={handleUpdateTeacherRate}
      />
    </RoleGuard>
  )
}
