import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import { toAnnouncement } from '@/lib/mappers'

const announcementInclude = {
  targetTeacher: true,
} as const

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teacherId = searchParams.get('teacherId')

  const rows = await prisma.announcement.findMany({
    where: teacherId
      ? {
          OR: [
            { targetTeacherId: null },
            { targetTeacherId: Number(teacherId) || undefined },
          ],
        }
      : undefined,
    include: announcementInclude,
    orderBy: { publishedAt: 'desc' },
  })

  return jsonOk(rows.map(toAnnouncement))
}

export async function POST(request: Request) {
  const body = await parseJsonBody<{
    title: string
    body: string
    authorId?: number
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
      authorId: body.authorId ?? null,
      targetTeacherId,
    },
    include: announcementInclude,
  })

  return jsonOk(toAnnouncement(row), 201)
}
