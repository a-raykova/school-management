'use client'

import Rooms from '@/components/rooms/Rooms'
import { useAppData } from '@/providers/AppDataProvider'

export default function RoomsPage() {
  const { rooms } = useAppData()
  return <Rooms rooms={rooms} />
}
