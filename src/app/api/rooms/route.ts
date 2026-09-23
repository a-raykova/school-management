import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import { requireAdmin } from '@/lib/require-admin'
import { requireAuth } from '@/lib/require-auth'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const rooms = await prisma.room.findMany({ orderBy: { name: 'asc' } })
  return jsonOk(rooms)
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await parseJsonBody<{ name: string; color?: string | null }>(request)
  if (!body?.name?.trim()) {
    return jsonError('Room name is required')
  }

  try {
    const room = await prisma.room.create({
      data: {
        name: body.name.trim(),
        color: body.color?.trim() || null,
      },
    })
    return jsonOk(room, 201)
  } catch (e) {
    // P2002 = Prisma's unique constraint violation code — Room.name is @unique
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      return jsonError('A room with that name already exists', 409)
    }
    const message = e instanceof Error ? e.message : 'Failed to create room'
    return jsonError(message)
  }
}