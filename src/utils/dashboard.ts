import { ScheduleEntry } from '@/types'
import { getWeekStart, entryOccursInWeek } from '@/utils/schedule'
import { ALL_DAYS } from '@/constants'

export function computeBusiestDay(
  schedule: ScheduleEntry[],
  teacherName: string,
): { day: string; count: number } | null {
  const weekStart = getWeekStart(new Date())

  const countPerDay = ALL_DAYS.map(day => ({
    day,
    count: schedule.filter(e =>
      e.teacher === teacherName &&
      e.day     === day         &&
      entryOccursInWeek(e, weekStart)
    ).length,
  })).filter(d => d.count > 0)

  return countPerDay.sort((a, b) => b.count - a.count)[0] ?? null
}