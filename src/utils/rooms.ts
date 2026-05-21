// utils/rooms.ts
import { ScheduleEntry, Room } from '@/types'
import { ROOMS, ROOM_COLORS } from '@/constants'

function getCurrentTimeString(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function getTodayName(): string {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]
}

export function computeRooms(schedule: ScheduleEntry[]): Room[] {
  const now     = getCurrentTimeString()
  const today   = getTodayName()

  return ROOMS.map((name, i) => {
    const activeEntry = schedule.find(
      e => e.room === name && e.day === today && e.start <= now && e.end > now
    )

    return {
      id:      i + 1,
      name,
      free:    !activeEntry,
      subject: activeEntry?.subject,
      teacher: activeEntry?.teacher,
      time:    activeEntry ? `${activeEntry.start} – ${activeEntry.end}` : undefined,
    }
  })
}