import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import { toFee } from '@/lib/mappers'
import { requireAdmin } from '@/lib/require-admin'

export async function GET() {
  //admin-only route
  const { error } = await requireAdmin()
  if (error) return error

  const rows = await prisma.fee.findMany({
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  })
  return jsonOk(rows.map(toFee))
}

export async function POST(request: Request) {
  //POST handlers for admin only acces (tested through Postman)
  const { error } = await requireAdmin()
  if (error) return error

  const body = await parseJsonBody<{
    studentId: number
    amount: number
    note?: string
    date?: string
  }>(request)

  if (!body?.studentId || !body.amount) {
    return jsonError('studentId and amount are required')
  }

  const student = await prisma.student.findUnique({
    where: { id: body.studentId },
  })
  if (!student) return jsonError('Student not found', 404)

  const date = body.date ?? new Date().toISOString().slice(0, 10)

  const row = await prisma.fee.create({
    data: {
      studentId: body.studentId,
      amount: body.amount,
      note: body.note ?? null,
      date: new Date(`${date}T00:00:00.000Z`),
    },
  })

  return jsonOk(toFee(row), 201)
}
