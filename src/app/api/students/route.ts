import { prisma } from '@/lib/prisma'
import { jsonOk } from '@/lib/api-response'
import { toStudent } from '@/lib/mappers'
import { requireAdmin } from '@/lib/require-admin'

export async function GET() {
  //admin-only route
  const { error } = await requireAdmin()
  if (error) return error
  
  const rows = await prisma.student.findMany({
    orderBy: { id: 'asc' },
  })
  return jsonOk(rows.map(toStudent))
}
