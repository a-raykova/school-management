import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import { UI_PAYMENT_METHOD_TO_PRISMA, toPayment } from '@/lib/mappers'
import type { PaymentMethod } from '@/types'
import { requireAdmin } from '@/lib/require-admin'

export async function GET() {
  //admin-only route
  const { error } = await requireAdmin()
  if (error) return error
  
  const rows = await prisma.payment.findMany({
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  })
  return jsonOk(rows.map(toPayment))
}

export async function POST(request: Request) {
  //POST handlers for admin only acces (tested through Postman)
  const { error } = await requireAdmin()
  if (error) return error

  const body = await parseJsonBody<{
    studentId: number
    amount: number
    method: PaymentMethod
    note?: string
    date?: string
  }>(request)

  if (!body?.studentId || !body.amount || !body.method) {
    return jsonError('studentId, amount, and method are required')
  }

  const student = await prisma.student.findUnique({
    where: { id: body.studentId },
  })
  if (!student) return jsonError('Student not found', 404)

  const date = body.date ?? new Date().toISOString().slice(0, 10)

  const row = await prisma.payment.create({
    data: {
      studentId: body.studentId,
      amount: body.amount,
      method: UI_PAYMENT_METHOD_TO_PRISMA[body.method],
      note: body.note ?? null,
      date: new Date(`${date}T00:00:00.000Z`),
    },
  })

  return jsonOk(toPayment(row), 201)
}
