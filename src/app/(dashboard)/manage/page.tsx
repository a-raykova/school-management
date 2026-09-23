'use client'

import Manage from '@/components/manage/Manage'
import { useAppData } from '@/providers/AppDataProvider'
import RoleGuard from '@/components/layout/RoleGuard'

export default function ManagePage() {
  const { schedule, dbRooms, handleAddRoom, handleUpdateRoom, handleDeleteRoom } = useAppData()

  return (
    <RoleGuard allow="admin">
      <Manage
        schedule={schedule}
        rooms={dbRooms}
        onAddRoom={handleAddRoom}
        onUpdateRoom={handleUpdateRoom}
        onDeleteRoom={handleDeleteRoom}
      />
    </RoleGuard>
  )
}