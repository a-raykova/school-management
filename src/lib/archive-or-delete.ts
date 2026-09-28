import { prisma } from '@/lib/prisma'

export async function archiveOrDeleteIfUsed<T>(params: {
  countWhere: Record<string, unknown>
  deleteFn: () => Promise<unknown>
  archiveFn: () => Promise<T>
}): Promise<{ deleted: true } | { deleted: false; archived: true; row: T; classCount: number }> {
  const classCount = await prisma.scheduleEntry.count({ where: params.countWhere })

  if (classCount === 0) {
    await params.deleteFn()
    return { deleted: true }
  }

  const row = await params.archiveFn()
  return { deleted: false, archived: true, row, classCount }
}