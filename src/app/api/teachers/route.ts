import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import { requireAdmin } from '@/lib/require-admin'
import { requireAuth } from '@/lib/require-auth'
import { toTeacherOption } from '@/lib/mappers'

//returns all teachers from db with role TEACHER
export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    orderBy: { firstName: 'asc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      subtitle: true,
      isActive: true,
      honorariumRate: true,
    },
  })

  return jsonOk(teachers.map(toTeacherOption))
}

// admin-only: create a new teacher record.
// NOTE: this does NOT create their Supabase login — that's still a separate
// manual step in the Supabase dashboard, using this exact same email.
export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await parseJsonBody<{
    firstName: string
    lastName: string
    email: string
    subtitle?: string | null
    honorariumRate?: number | null
  }>(request)

  if (!body?.firstName?.trim() || !body?.lastName?.trim() || !body?.email?.trim()) {
    return jsonError('First name, last name and email are required')
  }
  if (
    body.honorariumRate != null &&
    (typeof body.honorariumRate !== 'number' || body.honorariumRate < 0)
  ) {
    return jsonError('Invalid honorarium rate')
  }

  const firstName = body.firstName.trim()
  const lastName = body.lastName.trim()

  // schedule creation matches a teacher by exact first+last name, so two
  // teachers sharing a full name would make that lookup ambiguous
  const nameClash = await prisma.user.findFirst({
    where: { firstName, lastName, role: 'TEACHER' },
  })
  if (nameClash) {
    return jsonError(`A teacher named "${firstName} ${lastName}" already exists`, 409)
  }

  try {
    const teacher = await prisma.user.create({
      data: {
        role: 'TEACHER',
        firstName,
        lastName,
        email: body.email.trim(),
        subtitle: body.subtitle?.trim() || 'Teacher',
        honorariumRate: body.honorariumRate ?? null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        subtitle: true,
        isActive: true,
        honorariumRate: true,
      },
    })
    return jsonOk(toTeacherOption(teacher), 201)
  } catch (e) {
    // P2002 = Prisma's unique constraint violation code — User.email is @unique
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      return jsonError('A user with that email already exists', 409)
    }
    const message = e instanceof Error ? e.message : 'Failed to create teacher'
    return jsonError(message)
  }
}