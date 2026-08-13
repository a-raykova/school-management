import { ScheduleEntry } from "@/types"
import { TeacherHours, TeacherHonorarium, TeacherOption } from "@/types"
import { getWeekStart, addDays, dateForDayInWeek, entryOccursInWeek } from '@/utils/schedule'

/* ─────────────────────────── core computation ──────────────────── */

/**
 * Splits each teacher's hours into confirmed (past) and projected (future).
 *
 * "confirmed"  — the class date is strictly before today (already happened).
 * "projected"  — the class date is today or later, up to end of month.
 *
 * Today's classes that haven't started yet are treated as projected because
 * the teacher could still cancel. If you prefer today to count as confirmed,
 * change `classDate < today` to `classDate <= today`.
 */
const round = (n: number) => Math.round(n * 10) / 10

export function computeTeacherHours(
  schedule: ScheduleEntry[],
  year: number,
  month: number,
  today: Date,
): TeacherHours[] {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)

  const weeks: Date[] = []
  let w = getWeekStart(firstDay)
  while (w <= lastDay) {
    weeks.push(new Date(w))
    w = addDays(w, 7)
  }

  const map: Record<string, { workedHours: number; plannedHours: number }> = {}

  for (const week of weeks) {
    for (const entry of schedule) {
      if (!entryOccursInWeek(entry, week)) continue

      const classDate = dateForDayInWeek(week, entry.day)
      if (classDate.getMonth() !== month || classDate.getFullYear() !== year) continue

      const teacher = entry.teacher
      if (!map[teacher]) map[teacher] = { workedHours: 0, plannedHours: 0 }

      if (classDate < today) {
        map[teacher].workedHours  = round(map[teacher].workedHours  + entry.duration)
      } else {
        map[teacher].plannedHours = round(map[teacher].plannedHours + entry.duration)
      }
    }
  }

  return Object.entries(map)
    .map(([name, h]) => ({ name, ...h }))
    .sort((a, b) => (b.workedHours + b.plannedHours) - (a.workedHours + a.plannedHours))
}

/**
 * Honorariums = teachers get paid per completed overtime class, not salary.
 * Only counts classes that have already happened (`workedHours`) — planned/
 * future overtime classes are intentionally excluded, since honorariums are
 * only settled once a month has fully passed.
 */
export function computeHonorariums(
  schedule: ScheduleEntry[],
  teachers: TeacherOption[],
  year: number,
  month: number,
  today: Date,
): TeacherHonorarium[] {
  const overtimeEntries = schedule.filter(e => e.isOvertime)
  const hours = computeTeacherHours(overtimeEntries, year, month, today)

  const byName = new Map(hours.map(h => [h.name, h.workedHours]))

  return teachers
    .map((t): TeacherHonorarium => {
      const workedOvertimeHours = byName.get(t.name) ?? 0
      return {
        teacherId: t.id,
        name: t.name,
        workedOvertimeHours,
        rate: t.honorariumRate,
        total: t.honorariumRate == null ? null : round(workedOvertimeHours * t.honorariumRate),
      }
    })
    .filter(t => t.workedOvertimeHours > 0)
    .sort((a, b) => b.workedOvertimeHours - a.workedOvertimeHours)
}