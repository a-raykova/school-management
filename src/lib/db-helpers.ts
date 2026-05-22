import { prisma } from '@/lib/prisma'

export async function findTeacherByFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ') || firstName
  return prisma.user.findFirst({
    where: { firstName, lastName, role: 'TEACHER' },
  })
}

export async function findRoomByName(name: string) {
  return prisma.room.findUnique({ where: { name } })
}

export const scheduleInclude = {
  teacher: true,
  room: true,
  exceptions: true,
} as const
