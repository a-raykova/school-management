import { prisma } from '@/lib/prisma'
import { jsonOk } from '@/lib/api-response'
import { requireAuth } from '@/lib/require-auth'

//returns all teachers from db with role TEACHER
export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    orderBy: { firstName: 'asc' },
    select: { id: true, firstName: true, lastName: true },
  })

  return jsonOk(teachers.map(t => ({
    id: t.id,
    name: `${t.firstName} ${t.lastName}`,
  })))
}