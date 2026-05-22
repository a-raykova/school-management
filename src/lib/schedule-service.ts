import { prisma } from '@/lib/prisma'
import { findRoomByName, findTeacherByFullName, scheduleInclude } from '@/lib/db-helpers'
import {
  type ScheduleCreateInput,
  UI_DAY_TO_WEEKDAY,
  UI_RECURRENCE_TO_PRISMA,
  toScheduleEntry,
} from '@/lib/mappers'
import type { ScheduleEntry } from '@/types'

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

export async function createScheduleEntry(
  input: ScheduleCreateInput,
): Promise<ScheduleEntry> {
  const { teacher, room, weekday } = await resolveScheduleRelations(input)

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
    },
    include: scheduleInclude,
  })

  return toScheduleEntry(row)
}

export async function createCancellationAnnouncement(
  entry: ScheduleEntry,
  dateLabel: string,
  authorId?: number,
) {
  const teacher = await findTeacherByFullName(entry.teacher)
  await prisma.announcement.create({
    data: {
      title: `Class cancelled: ${entry.subject}`,
      body: `Your ${entry.subject} class on ${dateLabel} at ${entry.start} (${entry.room}) has been cancelled.`,
      targetTeacherId: teacher?.id,
      authorId: authorId ?? null,
    },
  })
}

export async function createScheduleUpdateAnnouncement(
  prev: ScheduleEntry,
  updated: ScheduleCreateInput,
  authorId?: number,
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
  await prisma.announcement.create({
    data: {
      title: `Schedule update: ${updated.subject}`,
      body: `Your ${updated.subject} class has been updated — ${changes.join(', ')}.`,
      targetTeacherId: teacher?.id,
      authorId: authorId ?? null,
    },
  })
}
