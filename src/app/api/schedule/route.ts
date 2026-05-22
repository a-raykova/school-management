import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import { scheduleInclude } from '@/lib/db-helpers'
import { toScheduleEntry } from '@/lib/mappers'
import { createScheduleEntry } from '@/lib/schedule-service'
import type { ScheduleCreateInput } from '@/lib/mappers'

export async function GET() {
  const rows = await prisma.scheduleEntry.findMany({
    include: scheduleInclude,
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
  })
  return jsonOk(rows.map(toScheduleEntry))
}

export async function POST(request: Request) {
  const body = await parseJsonBody<ScheduleCreateInput>(request)
  if (!body?.subject || !body.day || !body.teacher || !body.room) {
    return jsonError('Invalid schedule entry payload')
  }

  try {
    const entry = await createScheduleEntry(body)
    return jsonOk(entry, 201)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create schedule entry'
    return jsonError(message, 404)
  }
}
