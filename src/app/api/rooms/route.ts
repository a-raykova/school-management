import { prisma } from '@/lib/prisma'
import { jsonOk } from '@/lib/api-response'
import { requireAuth } from '@/lib/require-auth'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const rooms = await prisma.room.findMany({ orderBy: { name: 'asc' } })
  return jsonOk(rooms)
}