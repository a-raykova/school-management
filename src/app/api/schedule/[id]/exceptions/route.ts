import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import { scheduleInclude } from '@/lib/db-helpers'
import { toScheduleEntry } from '@/lib/mappers'
import { createCancellationAnnouncement } from '@/lib/schedule-service'
import { requireAuth } from '@/lib/require-auth'

type RouteContext = { params: { id: string } }

export async function POST(request: Request, { params }: RouteContext) {
  const { dbUser, error } = await requireAuth()
  if (error) return error

  const entryId = Number(params.id)
  if (!Number.isInteger(entryId) || entryId <= 0) {
    return jsonError('Invalid schedule entry id')
  }

  const body = await parseJsonBody<{ date: string }>(request)
  if (!body?.date) return jsonError('date is required')

  const existing = await prisma.scheduleEntry.findUnique({
    where: { id: entryId },
    include: scheduleInclude,
  })
  if (!existing) return jsonError('Schedule entry not found', 404)

  // teachers can only add exceptions to their own entries
  const fullName = `${dbUser.firstName} ${dbUser.lastName}`
  if (dbUser.role !== 'ADMIN' && existing.teacherId !== dbUser.id) {
    return jsonError('Forbidden', 403)
  }

  const entry = toScheduleEntry(existing)
  if (entry.exceptions?.includes(body.date)) {
    return jsonOk(entry)
  }

  await prisma.scheduleException.create({
    data: {
      scheduleEntryId: entryId,
      cancelledDate: new Date(`${body.date}T00:00:00.000Z`),
    },
  })

  await createCancellationAnnouncement(entry, body.date)

  const updated = await prisma.scheduleEntry.findUnique({
    where: { id: entryId },
    include: scheduleInclude,
  })

  return jsonOk(toScheduleEntry(updated!))
}