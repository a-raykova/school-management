import {
  UserRole,
  Weekday,
  RecurrenceType,
  PaymentMethod,
  PaymentSchedule,
  Room,
  User,
} from '../src/generated/prisma/client'
import { prisma } from '../src/lib/prisma'

//seed data — previously imported from ../src/constants
const ROOMS = ['Room 1', 'Room 3', 'Room 5'] as const

const ROOM_COLORS: Record<string, string> = {
  'Room 1': '#f59e0b',
  'Room 3': '#22c55e',
  'Room 5': '#f43f5e',
}

const TEACHERS = ['Anna Koeva', 'Martina Ivanova'] as const

const UI_DAY_TO_WEEKDAY: Record<string, Weekday> = {
  Monday: Weekday.MONDAY,
  Tuesday: Weekday.TUESDAY,
  Wednesday: Weekday.WEDNESDAY,
  Thursday: Weekday.THURSDAY,
  Friday: Weekday.FRIDAY,
  Saturday: Weekday.SATURDAY,
  Sunday: Weekday.SUNDAY,
}

function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] ?? fullName
  const lastName = parts.slice(1).join(' ') || firstName
  return { firstName, lastName }
}

function emailFromName(firstName: string, lastName: string): string {
  const slug = `${firstName}.${lastName}`
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
  return `${slug}@intelekti.com`
}

async function main() {
  await prisma.scheduleException.deleteMany()
  await prisma.scheduleEntry.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.fee.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.student.deleteMany()
  await prisma.user.deleteMany()
  await prisma.room.deleteMany()

  await prisma.room.createMany({
    data: ROOMS.map((name) => ({
      name,
      color: ROOM_COLORS[name] ?? null,
    })),
  })

  const rooms: Room[] = await prisma.room.findMany()
  const roomByName: Record<string, Room> = Object.fromEntries(rooms.map((r) => [r.name, r]))

  const teacherUsers: User[] = await Promise.all(
    TEACHERS.map((fullName) => {
      const { firstName, lastName } = parseFullName(fullName)
      const isAnna = fullName === 'Anna Koeva'
      return prisma.user.create({
        data: {
          role: UserRole.TEACHER,
          firstName,
          lastName,
          email: emailFromName(firstName, lastName),
          subtitle: isAnna ? 'English Dept.' : null,
        },
      })
    }),
  )

  const teacherByFullName: Record<string, User> = Object.fromEntries(
    teacherUsers.map((u) => [`${u.firstName} ${u.lastName}`, u]),
  )

  const admin: User = await prisma.user.create({
    data: {
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@intelekti.com',
      subtitle: 'Staff portal',
    },
  })

  const scheduleSeed = [
    {
      subject: 'Advanced English B2',
      day: 'Monday',
      start: '09:00',
      end: '10:30',
      duration: 1.5,
      room: 'Room 3',
      teacher: 'Anna Koeva',
      color: '#22c55e',
      anchorDate: '2026-04-13',
    },
    {
      subject: 'Business English',
      day: 'Monday',
      start: '11:00',
      end: '12:00',
      duration: 1,
      room: 'Room 5',
      teacher: 'Martina Ivanova',
      color: '#f43f5e',
      anchorDate: '2026-04-13',
    },
    {
      subject: 'English Beginners A1',
      day: 'Wednesday',
      start: '14:00',
      end: '15:30',
      duration: 1.5,
      room: 'Room 1',
      teacher: 'Anna Koeva',
      color: '#f59e0b',
      anchorDate: '2026-04-15',
    },
    {
      subject: 'Advanced English B2',
      day: 'Friday',
      start: '10:00',
      end: '11:30',
      duration: 1.5,
      room: 'Room 3',
      teacher: 'Anna Koeva',
      color: '#22c55e',
      anchorDate: '2026-04-17',
    },
  ] as const

  for (const entry of scheduleSeed) {
    const teacher = teacherByFullName[entry.teacher]
    const room = roomByName[entry.room]
    if (!teacher || !room) {
      throw new Error(`Missing teacher or room for seed entry: ${entry.subject}`)
    }

    await prisma.scheduleEntry.create({
      data: {
        subject: entry.subject,
        weekday: UI_DAY_TO_WEEKDAY[entry.day],
        startTime: entry.start,
        endTime: entry.end,
        duration: entry.duration,
        color: entry.color,
        recurrence: RecurrenceType.WEEKLY,
        anchorDate: new Date(`${entry.anchorDate}T00:00:00.000Z`),
        teacherId: teacher.id,
        roomId: room.id,
      },
    })
  }

  const now = new Date()
  await prisma.announcement.createMany({
    data: [
      {
        title: 'End-of-term schedule changes',
        body: 'The last week of term (18–22 May) all afternoon slots are moved 30 minutes earlier. Please update your schedules accordingly.',
        publishedAt: now,
        authorId: admin.id,
      },
      {
        title: 'New student intake — May cohort',
        body: 'We expect 40 new students in the May cohort. Room assignments will be updated by Friday.',
        publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        authorId: admin.id,
      },
      {
        title: 'Staff meeting reminder',
        body: 'Monthly staff meeting this Thursday at 16:00 in the conference room.',
        publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        authorId: admin.id,
      },
    ],
  })

  await prisma.student.createMany({
    data: [
      {
        parentFullName: 'Иван Иванов Димитров',
        parentPhone: '0888 123 456',
        childFullName: 'Мария Иванова Димитрова',
        paymentMethod: PaymentMethod.CASH,
        paymentSchedule: PaymentSchedule.SPLIT,
      },
      {
        parentFullName: 'Georgi Georgiev Dimitrov',
        parentPhone: '0877 234 567',
        childFullName: 'Petar Georgiev Dimitrov',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentSchedule: PaymentSchedule.FULL,
      },
      {
        parentFullName: 'Elena Todorova Stoyanova',
        parentPhone: '0899 345 678',
        childFullName: 'Sofia Todorova Stoyanova',
        paymentMethod: PaymentMethod.CASH,
        paymentSchedule: PaymentSchedule.SPLIT,
      },
      {
        parentFullName: 'Dimitar Kolev Angelov',
        parentPhone: '0866 456 789',
        childFullName: 'Nikola Kolev Angelov',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentSchedule: PaymentSchedule.FULL,
      },
    ],
  })

  console.log('Seed complete:', {
    rooms: rooms.length,
    teachers: teacherUsers.length,
    admin: admin.email,
    schedule: scheduleSeed.length,
    students: 4,
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })