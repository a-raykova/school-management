import { prisma } from '@/lib/prisma'
import { jsonOk } from '@/lib/api-response'

export async function GET() {
  const rooms = await prisma.room.findMany({ orderBy: { name: 'asc' } })
  return jsonOk(rooms)
}