import { prisma } from '@/lib/prisma'
import { findRoomByName, findTeacherByFullName, scheduleInclude } from '@/lib/db-helpers'
import {
  type ScheduleCreateInput,
  UI_DAY_TO_WEEKDAY,
  UI_RECURRENCE_TO_PRISMA,
  toScheduleEntry,
} from '@/lib/mappers'
import type { ScheduleEntry } from '@/types'
import type { Weekday } from '@/generated/prisma/client'
import { addWeeks, dateForDayInWeek, entryOccursInWeek, getWeekStart } from '@/utils/schedule'

export async function resolveScheduleRelations(input: ScheduleCreateInput) {
  const teacher = await findTeacherByFullName(input.teacher)
  if (!teacher) {
    throw new Error(`Teacher not found: ${input.teacher}`)
  }

  const room = await findRoomByName(input.room)
  if (!room) {
    throw new Error(`Room not found: ${input.room}`)
  }

  const weekday = UI_DAY_TO_WEEKDAY[input.day]
  if (!weekday) {
    throw new Error(`Invalid day: ${input.day}`)
  }

  return { teacher, room, weekday }
}

const CONFLICT_HORIZON_WEEKS = 52

// same start-of-week calculation entryOccursInWeek uses internally for anchors
function anchorWeekStart(anchorDate: string): Date {
  const d = new Date(anchorDate)
  d.setHours(0, 0, 0, 0)
  return getWeekStart(d)
}

async function assertNoRoomConflict(
  roomId: number,
  weekday: Weekday,
  input: ScheduleCreateInput,
  excludeEntryId?: number,
) {
  // Step 1: cheap database filter. Same room, same weekday, overlapping times.
  const rows = await prisma.scheduleEntry.findMany({
    where: {
      roomId,
      weekday,
      id: excludeEntryId ? { not: excludeEntryId } : undefined,
      startTime: { lt: input.end },
      endTime: { gt: input.start },
    },
    include: scheduleInclude,
  })
  if (rows.length === 0) return

  // Step 2: recurrence-aware check. It's only a real conflict if both
  // classes actually occur in the same week.
  const candidate: ScheduleEntry = { id: -1, ...input, exceptions: [] }
  const candidateStart = anchorWeekStart(candidate.anchorDate)
  let earliest: { week: Date; existing: ScheduleEntry } | null = null

  for (const row of rows) {
    const existing = toScheduleEntry(row)

    // neither class occurs before its own anchor date, so start from the later one
    const existingStart = anchorWeekStart(existing.anchorDate)
    const firstWeek = existingStart > candidateStart ? existingStart : candidateStart

    for (let i = 0; i < CONFLICT_HORIZON_WEEKS; i++) {
      const week = addWeeks(firstWeek, i)
      if (earliest && week >= earliest.week) break // can't beat the clash we already have
      if (entryOccursInWeek(existing, week) && entryOccursInWeek(candidate, week)) {
        earliest = { week, existing }
        break
      }
    }
  }

  if (earliest) {
    const clashDate = dateForDayInWeek(earliest.week, earliest.existing.day).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    throw new Error(
      `Room is already booked for "${earliest.existing.subject}" from ${earliest.existing.start} to ${earliest.existing.end} on ${clashDate}`,
    )
  }
}

export async function createScheduleEntry(
  input: ScheduleCreateInput,
): Promise<ScheduleEntry> {
  const { teacher, room, weekday } = await resolveScheduleRelations(input)
  await assertNoRoomConflict(room.id, weekday, input)

  const row = await prisma.scheduleEntry.create({
    data: {
      subject: input.subject,
      weekday,
      startTime: input.start,
      endTime: input.end,
      duration: input.duration,
      color: input.color ?? null,
      recurrence: UI_RECURRENCE_TO_PRISMA[input.recurrence],
      anchorDate: new Date(`${input.anchorDate}T00:00:00.000Z`),
      teacherId: teacher.id,
      roomId: room.id,
      isOvertime: input.isOvertime ?? false,
    },
    include: scheduleInclude,
  })

  return toScheduleEntry(row)
}

export async function updateScheduleEntry(
  id: number,
  input: ScheduleCreateInput,
): Promise<ScheduleEntry> {
  const { teacher, room, weekday } = await resolveScheduleRelations(input)
  await assertNoRoomConflict(room.id, weekday, input, id)

  const row = await prisma.scheduleEntry.update({
    where: { id },
    data: {
      subject: input.subject,
      weekday,
      startTime: input.start,
      endTime: input.end,
      duration: input.duration,
      color: input.color ?? null,
      recurrence: UI_RECURRENCE_TO_PRISMA[input.recurrence],
      anchorDate: new Date(`${input.anchorDate}T00:00:00.000Z`),
      teacherId: teacher.id,
      roomId: room.id,
      isOvertime: input.isOvertime ?? false,
    },
    include: scheduleInclude,
  })

  return toScheduleEntry(row)
}

export async function createCancellationAnnouncement(
  entry: ScheduleEntry,
  dateLabel: string,
  authorId?: number,
  actorRole?: string,
) {
  const teacher = await findTeacherByFullName(entry.teacher)

  if (actorRole === 'ADMIN') {
    // notify the teacher
    await prisma.announcement.create({
      data: {
        title: `Class cancelled: ${entry.subject}`,
        body: `${entry.teacher}'s ${entry.subject} class on ${dateLabel} at ${entry.start} (${entry.room}) has been cancelled.`,
        targetTeacherId: teacher?.id ?? null,
        authorId: authorId ?? null,
      },
    })
  } else {
    // notify all admins only
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
    await Promise.all(admins.map(admin =>
      prisma.announcement.create({
        data: {
          title: `Class cancelled: ${entry.subject}`,
          body: `${entry.teacher} has cancelled their ${entry.subject} class on ${dateLabel} at ${entry.start} (${entry.room}).`,
          targetTeacherId: admin.id,
          authorId: authorId ?? null,
        },
      })
    ))
  }
}

export async function createScheduleUpdateAnnouncement(
  prev: ScheduleEntry,
  updated: ScheduleCreateInput,
  authorId?: number,
  actorRole?: string,
) {
  const changes: string[] = []
  if (prev.day !== updated.day) {
    changes.push(`day changed from ${prev.day} to ${updated.day}`)
  }
  if (prev.start !== updated.start) {
    changes.push(`start time changed from ${prev.start} to ${updated.start}`)
  }
  if (prev.end !== updated.end) {
    changes.push(`end time changed from ${prev.end} to ${updated.end}`)
  }
  if (prev.room !== updated.room) {
    changes.push(`room changed from ${prev.room} to ${updated.room}`)
  }
  if (changes.length === 0) return

  const teacher = await findTeacherByFullName(updated.teacher)
  const body = actorRole === 'ADMIN'
    ? `${updated.teacher}'s ${updated.subject} class has been updated — ${changes.join(', ')}.`
    : `Your ${updated.subject} class has been updated — ${changes.join(', ')}.`

  await prisma.announcement.create({
    data: {
      title: `Schedule update: ${updated.subject}`,
      body,
      targetTeacherId: teacher?.id,
      authorId: authorId ?? null,
    },
  })
}
