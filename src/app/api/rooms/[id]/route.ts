import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import { requireAdmin } from '@/lib/require-admin'
import { archiveOrDeleteIfUsed } from '@/lib/archive-or-delete'

type RouteContext = { params: { id: string } }

function parseId(id: string) {
  const n = Number(id)
  return Number.isInteger(n) && n > 0 ? n : null
}

// admin-only: rename a room, recolor it, or restore an archived one
export async function PATCH(request: Request, { params }: RouteContext) {
  const { error } = await requireAdmin()
  if (error) return error

  const roomId = parseId(params.id)
  if (!roomId) return jsonError('Invalid room id')

  const body = await parseJsonBody<{ name?: string; color?: string | null; isActive?: boolean }>(request)
  if (body?.name != null && !body.name.trim()) {
    return jsonError('Room name cannot be empty')
  }

  const existing = await prisma.room.findUnique({ where: { id: roomId } })
  if (!existing) return jsonError('Room not found', 404)

  try {
    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        ...(body?.name != null && { name: body.name.trim() }),
        ...(body?.color !== undefined && { color: body.color?.trim() || null }),
        ...(body?.isActive !== undefined && { isActive: body.isActive }),
      },
    })
    return jsonOk(updated)
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      return jsonError('A room with that name already exists', 409)
    }
    const message = e instanceof Error ? e.message : 'Failed to update room'
    return jsonError(message)
  }
}

// admin-only: delete the room outright if nothing references it,
// otherwise archive it (isActive: false) so existing classes keep working
export async function DELETE(request: Request, { params }: RouteContext) {
  const { error } = await requireAdmin()
  if (error) return error

  const roomId = parseId(params.id)
  if (!roomId) return jsonError('Invalid room id')

  const existing = await prisma.room.findUnique({ where: { id: roomId } })
  if (!existing) return jsonError('Room not found', 404)

  const result = await archiveOrDeleteIfUsed({
    countWhere: { roomId },
    deleteFn: () => prisma.room.delete({ where: { id: roomId } }),
    archiveFn: () => prisma.room.update({ where: { id: roomId }, data: { isActive: false } }),
  })

  if (result.deleted) return jsonOk({ deleted: true })
  return jsonOk({ deleted: false, archived: true, room: result.row, classCount: result.classCount })
}