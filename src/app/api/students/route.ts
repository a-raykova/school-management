import { prisma } from '@/lib/prisma'
import { jsonOk } from '@/lib/api-response'
import { toStudent } from '@/lib/mappers'

export async function GET() {
  const rows = await prisma.student.findMany({
    orderBy: { id: 'asc' },
  })
  return jsonOk(rows.map(toStudent))
}
