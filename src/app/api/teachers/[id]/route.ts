import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import { requireAdmin } from '@/lib/require-admin'
import { toTeacherOption } from '@/lib/mappers'

type RouteContext = { params: { id: string } }

function parseId(id: string) {
  const n = Number(id)
  return Number.isInteger(n) && n > 0 ? n : null
}

// admin-only: set the €/hour honorarium rate for a teacher's overtime classes
export async function PATCH(request: Request, { params }: RouteContext) {
  const { error } = await requireAdmin()
  if (error) return error

  const teacherId = parseId(params.id)
  if (!teacherId) return jsonError('Invalid teacher id')

  const body = await parseJsonBody<{ honorariumRate: number | null }>(request)
  if (
    body?.honorariumRate != null &&
    (typeof body.honorariumRate !== 'number' || body.honorariumRate < 0)
  ) {
    return jsonError('Invalid honorarium rate')
  }

  const teacher = await prisma.user.findFirst({
    where: { id: teacherId, role: 'TEACHER' },
  })
  if (!teacher) return jsonError('Teacher not found', 404)

  const updated = await prisma.user.update({
    where: { id: teacherId },
    data: { honorariumRate: body?.honorariumRate ?? null },
    select: { id: true, firstName: true, lastName: true, honorariumRate: true },
  })

  return jsonOk(toTeacherOption(updated))
}
