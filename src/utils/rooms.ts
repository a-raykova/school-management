// utils/rooms.ts
import { ScheduleEntry, Room } from '@/types'

function getCurrentTimeString(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function getTodayName(): string {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]
}

export function computeRooms(
  schedule: ScheduleEntry[],
  dbRooms: { id: number; name: string; color: string | null }[]
): Room[] {
  const now   = getCurrentTimeString()
  const today = getTodayName()

  return dbRooms.map(room => {
    const activeEntry = schedule.find(
      e => e.room === room.name && e.day === today && e.start <= now && e.end > now
    )

    return {
      id:      room.id,
      name:    room.name,
      free:    !activeEntry,
      subject: activeEntry?.subject,
      teacher: activeEntry?.teacher,
      time:    activeEntry ? `${activeEntry.start} – ${activeEntry.end}` : undefined,
    }
  })
}