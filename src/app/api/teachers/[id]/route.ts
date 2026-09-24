import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import { requireAdmin } from '@/lib/require-admin'
import { toTeacherOption } from '@/lib/mappers'

type RouteContext = { params: { id: string } }

function parseId(id: string) {
  const n = Number(id)
  return Number.isInteger(n) && n > 0 ? n : null
}

const teacherSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  subtitle: true,
  isActive: true,
  honorariumRate: true,
} as const

// admin-only: edit a teacher's name, email, subtitle, honorarium rate, or active status
export async function PATCH(request: Request, { params }: RouteContext) {
  const { error } = await requireAdmin()
  if (error) return error

  const teacherId = parseId(params.id)
  if (!teacherId) return jsonError('Invalid teacher id')

  const body = await parseJsonBody<{
    firstName?: string
    lastName?: string
    email?: string
    subtitle?: string | null
    isActive?: boolean
    honorariumRate?: number | null
  }>(request)

  if (body?.firstName != null && !body.firstName.trim()) {
    return jsonError('First name cannot be empty')
  }
  if (body?.lastName != null && !body.lastName.trim()) {
    return jsonError('Last name cannot be empty')
  }
  if (body?.email != null && !body.email.trim()) {
    return jsonError('Email cannot be empty')
  }
  if (
    body?.honorariumRate != null &&
    (typeof body.honorariumRate !== 'number' || body.honorariumRate < 0)
  ) {
    return jsonError('Invalid honorarium rate')
  }

  const existing = await prisma.user.findFirst({
    where: { id: teacherId, role: 'TEACHER' },
  })
  if (!existing) return jsonError('Teacher not found', 404)

  // only re-check the name clash if the name is actually changing —
  // otherwise a teacher would fail to save because they "clash" with themselves
  const firstName = body?.firstName?.trim() ?? existing.firstName
  const lastName = body?.lastName?.trim() ?? existing.lastName
  if (firstName !== existing.firstName || lastName !== existing.lastName) {
    const nameClash = await prisma.user.findFirst({
      where: { firstName, lastName, role: 'TEACHER', id: { not: teacherId } },
    })
    if (nameClash) {
      return jsonError(`A teacher named "${firstName} ${lastName}" already exists`, 409)
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: teacherId },
      data: {
        ...(body?.firstName != null && { firstName: body.firstName.trim() }),
        ...(body?.lastName != null && { lastName: body.lastName.trim() }),
        ...(body?.email != null && { email: body.email.trim() }),
        ...(body?.subtitle !== undefined && { subtitle: body.subtitle?.trim() || 'Teacher' }),
        ...(body?.isActive !== undefined && { isActive: body.isActive }),
        ...(body?.honorariumRate !== undefined && { honorariumRate: body.honorariumRate }),
      },
      select: teacherSelect,
    })
    return jsonOk(toTeacherOption(updated))
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      return jsonError('A user with that email already exists', 409)
    }
    const message = e instanceof Error ? e.message : 'Failed to update teacher'
    return jsonError(message)
  }
}

// admin-only: delete the teacher outright if they have no classes,
// otherwise archive them (isActive: false) so past classes/honorariums keep working.
// NOTE: this does NOT touch their Supabase login — deleting or disabling that,
// if you want them actually locked out, is still a separate manual step.
export async function DELETE(request: Request, { params }: RouteContext) {
  const { error } = await requireAdmin()
  if (error) return error

  const teacherId = parseId(params.id)
  if (!teacherId) return jsonError('Invalid teacher id')

  const existing = await prisma.user.findFirst({
    where: { id: teacherId, role: 'TEACHER' },
  })
  if (!existing) return jsonError('Teacher not found', 404)

  const classCount = await prisma.scheduleEntry.count({ where: { teacherId } })

  if (classCount === 0) {
    await prisma.user.delete({ where: { id: teacherId } })
    return jsonOk({ deleted: true })
  }

  const archived = await prisma.user.update({
    where: { id: teacherId },
    data: { isActive: false },
    select: teacherSelect,
  })
  return jsonOk({ deleted: false, archived: true, teacher: toTeacherOption(archived), classCount })
}