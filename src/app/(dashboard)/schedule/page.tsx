'use client'

import Schedule from '@/components/schedule/Schedule'
import { useAppData } from '@/providers/AppDataProvider'

export default function SchedulePage() {
  const {
    schedule,
    user,
    teachersList,
    dbRooms,
    handleAddSchedule,
    handleRemoveSchedule,
    handleRemoveOccurrence,
    handleEditSchedule,
  } = useAppData()

  if (!user) return null

  return (
    <Schedule
      schedule={schedule}
      onAdd={handleAddSchedule}
      onRemove={handleRemoveSchedule}
      onRemoveOccurrence={handleRemoveOccurrence}
      onEdit={handleEditSchedule}
      user={user}
      teachers={teachersList.map((t) => t.name)}
      rooms={dbRooms}
    />
  )
}
