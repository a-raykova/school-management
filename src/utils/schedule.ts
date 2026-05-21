import { ALL_DAYS } from "@/constants"
import { ScheduleEntry } from "@/types"
import { toISO } from "./date"

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function addWeeks(date: Date, n: number): Date {
  return addDays(date, n * 7)
}

export function dateForDayInWeek(weekStart: Date, dayName: string): Date {
  return addDays(weekStart, ALL_DAYS.indexOf(dayName))
}

export function entryOccursInWeek(entry: ScheduleEntry, weekStart: Date): boolean {
  const weekEnd = addDays(weekStart, 6)
  const anchor  = new Date(entry.anchorDate)
  anchor.setHours(0, 0, 0, 0)
  const dayDate = dateForDayInWeek(weekStart, entry.day)

  if (dayDate < anchor) return false
  if (dayDate < weekStart || dayDate > weekEnd) return false
  if (entry.exceptions?.includes(toISO(dayDate))) return false

  if (entry.recurrence === 'once') {
    return getWeekStart(anchor).getTime() === weekStart.getTime()
  }
  if (entry.recurrence === 'weekly') return true
  if (entry.recurrence === 'biweekly') {
    const diffWeeks = Math.round(
      (weekStart.getTime() - getWeekStart(anchor).getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
    return diffWeeks % 2 === 0
  }
  if (entry.recurrence === 'monthly') {
    return Math.floor((anchor.getDate() - 1) / 7) === Math.floor((dayDate.getDate() - 1) / 7)
  }
  return false
}