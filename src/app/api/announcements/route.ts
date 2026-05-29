import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import { toAnnouncement } from '@/lib/mappers'
import { requireAuth } from '@/lib/require-auth'

const announcementInclude = {
  targetTeacher: true,
} as const

export async function GET(request: Request) {
  const { dbUser, error } = await requireAuth()
  if (error) return error

  const rows = await prisma.announcement.findMany({
    where: dbUser.role === 'ADMIN'
      ? undefined
      : {
          OR: [
            { targetTeacherId: null },
            { targetTeacherId: dbUser.id },
          ],
        },
    include: announcementInclude,
    orderBy: { publishedAt: 'desc' },
  })

  return jsonOk(rows.map(toAnnouncement))
}

export async function POST(request: Request) {
  const { dbUser, error } = await requireAuth()
  if (error) return error

  const body = await parseJsonBody<{
    title: string
    body: string
    targetTeacher?: string
  }>(request)

  if (!body?.title?.trim() || !body?.body?.trim()) {
    return jsonError('title and body are required')
  }

  let targetTeacherId: number | null = null
  if (body.targetTeacher) {
    const parts = body.targetTeacher.trim().split(/\s+/)
    const teacher = await prisma.user.findFirst({
      where: {
        firstName: parts[0],
        lastName: parts.slice(1).join(' ') || parts[0],
        role: 'TEACHER',
      },
    })
    targetTeacherId = teacher?.id ?? null
  }

  const row = await prisma.announcement.create({
    data: {
      title: body.title.trim(),
      body: body.body.trim(),
      authorId: dbUser.id,  // always use the logged-in user, never trust the client
      targetTeacherId,
    },
    include: announcementInclude,
  })

  return jsonOk(toAnnouncement(row), 201)
}