import { RecurrenceType } from "@/types"

export const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const ROOMS = [
  'Room 1', 'Room 2', 'Room 3', 'Room 4',
  'Room 5', 'Room 6', 'Room 7',
]

//Auto-generated from ROOMS — adding a room to constants is all you ever need to do
// export const ALL_ROOMS = ROOMS.map((name, i) => ({ id: i + 1, name }))

export const TEACHERS = [
  'Anna Koeva', 'Martina Ivanova', 'Svetoslav Petrov',
  'Tanya Georgieva', 'Rosen Nikolov', 'Eliana Dimitrova',
]

export const ROOM_COLORS: Record<string, string> = {
  'Room 1': '#f59e0b',
  'Room 2': '#3b82f6',
  'Room 3': '#22c55e',
  'Room 4': '#a855f7',
  'Room 5': '#f43f5e',
  'Room 6': '#06b6d4',
  'Room 7': '#f97316',
}

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  once:     'Does not repeat',
  weekly:   'Every week',
  biweekly: 'Every 2 weeks',
  monthly:  'Every month (same weekday)',
}