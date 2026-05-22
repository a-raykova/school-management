import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import { scheduleInclude } from '@/lib/db-helpers'
import { toScheduleEntry } from '@/lib/mappers'
import type { ScheduleCreateInput } from '@/lib/mappers'
import {
  createCancellationAnnouncement,
  createScheduleUpdateAnnouncement,
  updateScheduleEntry,
} from '@/lib/schedule-service'

type RouteContext = { params: { id: string } }

function parseId(id: string) {
  const n = Number(id)
  return Number.isInteger(n) && n > 0 ? n : null
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const entryId = parseId(params.id)
  if (!entryId) return jsonError('Invalid schedule entry id')

  const body = await parseJsonBody<ScheduleCreateInput>(request)
  if (!body?.subject || !body.day || !body.teacher || !body.room) {
    return jsonError('Invalid schedule entry payload')
  }

  const existing = await prisma.scheduleEntry.findUnique({
    where: { id: entryId },
    include: scheduleInclude,
  })
  if (!existing) return jsonError('Schedule entry not found', 404)

  const prev = toScheduleEntry(existing)

  try {
    const updated = await updateScheduleEntry(entryId, body)
    await createScheduleUpdateAnnouncement(prev, body)
    return jsonOk(updated)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update schedule entry'
    return jsonError(message, 404)
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const entryId = parseId(params.id)
  if (!entryId) return jsonError('Invalid schedule entry id')

  const existing = await prisma.scheduleEntry.findUnique({
    where: { id: entryId },
    include: scheduleInclude,
  })
  if (!existing) return jsonError('Schedule entry not found', 404)

  const entry = toScheduleEntry(existing)
  await createCancellationAnnouncement(
    entry,
    `${entry.day} (all occurrences)`,
  )
  await prisma.scheduleEntry.delete({ where: { id: entryId } })

  return jsonOk({ ok: true })
}
