import type {
  RecurrenceType as PrismaRecurrence,
  PaymentMethod as PrismaPaymentMethod,
  PaymentSchedule as PrismaPaymentSchedule,
  UserRole as PrismaUserRole,
  Weekday,
} from '@/generated/prisma/client'
import type {
  Announcement,
  CurrentUser,
  Fee,
  Payment,
  PaymentMethod,
  PaymentSchedule,
  RecurrenceType,
  ScheduleEntry,
  Student,
  UserRole,
} from '@/types'

const WEEKDAY_TO_UI: Record<Weekday, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
}

export const UI_DAY_TO_WEEKDAY: Record<string, Weekday> = Object.fromEntries(
  Object.entries(WEEKDAY_TO_UI).map(([k, v]) => [v, k as Weekday]),
) as Record<string, Weekday>

const RECURRENCE_TO_UI: Record<PrismaRecurrence, RecurrenceType> = {
  ONCE: 'once',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
}

export const UI_RECURRENCE_TO_PRISMA: Record<RecurrenceType, PrismaRecurrence> = {
  once: 'ONCE',
  weekly: 'WEEKLY',
  biweekly: 'BIWEEKLY',
  monthly: 'MONTHLY',
}

const PAYMENT_METHOD_TO_UI: Record<PrismaPaymentMethod, PaymentMethod> = {
  CASH: 'cash',
  BANK_TRANSFER: 'bankTransfer',
}

export const UI_PAYMENT_METHOD_TO_PRISMA: Record<PaymentMethod, PrismaPaymentMethod> = {
  cash: 'CASH',
  bankTransfer: 'BANK_TRANSFER',
}

const PAYMENT_SCHEDULE_TO_UI: Record<PrismaPaymentSchedule, PaymentSchedule> = {
  FULL: 'full',
  SPLIT: 'split',
}

export const UI_PAYMENT_SCHEDULE_TO_PRISMA: Record<
  PaymentSchedule,
  PrismaPaymentSchedule
> = {
  full: 'FULL',
  split: 'SPLIT',
}

export function prismaRoleToUi(role: PrismaUserRole): UserRole {
  return role === 'ADMIN' ? 'admin' : 'teacher'
}

export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

export function formatAnnouncementDate(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const published = new Date(date)
  published.setHours(0, 0, 0, 0)
  if (published.getTime() === today.getTime()) return 'Today'
  return date.toISOString().slice(0, 10)
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

type ScheduleWithRelations = {
  id: number
  subject: string
  weekday: Weekday
  startTime: string
  endTime: string
  duration: { toNumber(): number } | number
  color: string | null
  recurrence: PrismaRecurrence
  anchorDate: Date
  teacher: { firstName: string; lastName: string }
  room: { name: string }
  exceptions: { cancelledDate: Date }[]
}

export function toScheduleEntry(row: ScheduleWithRelations): ScheduleEntry {
  return {
    id: row.id,
    subject: row.subject,
    day: WEEKDAY_TO_UI[row.weekday],
    start: row.startTime,
    end: row.endTime,
    duration:
      typeof row.duration === 'number' ? row.duration : row.duration.toNumber(),
    room: row.room.name,
    teacher: fullName(row.teacher.firstName, row.teacher.lastName),
    color: row.color ?? undefined,
    recurrence: RECURRENCE_TO_UI[row.recurrence],
    anchorDate: toIsoDate(row.anchorDate),
    exceptions: row.exceptions.map((e) => toIsoDate(e.cancelledDate)),
  }
}

type AnnouncementWithTarget = {
  id: number
  title: string
  body: string
  publishedAt: Date
  targetTeacher: { firstName: string; lastName: string } | null
  author: { firstName: string; lastName: string } | null
}

export function toAnnouncement(row: AnnouncementWithTarget): Announcement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    date: formatAnnouncementDate(row.publishedAt),
    targetTeacher: row.targetTeacher
      ? fullName(row.targetTeacher.firstName, row.targetTeacher.lastName)
      : undefined,
    author: row.author
      ? fullName(row.author.firstName, row.author.lastName)
      : undefined,
  }
}

type UserRow = {
  id: number
  role: PrismaUserRole
  firstName: string
  lastName: string
  email: string
  subtitle: string | null
}

export function toCurrentUser(row: UserRow): CurrentUser {
  return {
    id: row.id,
    role: prismaRoleToUi(row.role),
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    initials: initials(row.firstName, row.lastName),
    subtitle: row.subtitle ?? '',
  }
}

export function toStudent(row: {
  id: number
  parentFullName: string
  parentPhone: string
  childFullName: string
  paymentMethod: PrismaPaymentMethod
  paymentSchedule: PrismaPaymentSchedule
}): Student {
  return {
    id: row.id,
    parentFullName: row.parentFullName,
    parentPhone: row.parentPhone,
    childFullName: row.childFullName,
    paymentMethod: PAYMENT_METHOD_TO_UI[row.paymentMethod],
    paymentSchedule: PAYMENT_SCHEDULE_TO_UI[row.paymentSchedule],
  }
}

export function toFee(row: {
  id: number
  studentId: number
  amount: { toNumber(): number } | number
  date: Date
  note: string | null
}): Fee {
  return {
    id: row.id,
    studentId: row.studentId,
    amount: typeof row.amount === 'number' ? row.amount : row.amount.toNumber(),
    date: toIsoDate(row.date),
    note: row.note ?? undefined,
  }
}

export function toPayment(row: {
  id: number
  studentId: number
  amount: { toNumber(): number } | number
  date: Date
  method: PrismaPaymentMethod
  note: string | null
}): Payment {
  return {
    id: row.id,
    studentId: row.studentId,
    amount:
      typeof row.amount === 'number' ? row.amount : row.amount.toNumber(),
    date: toIsoDate(row.date),
    method: PAYMENT_METHOD_TO_UI[row.method],
    note: row.note ?? undefined,
  }
}

export type ScheduleCreateInput = Omit<ScheduleEntry, 'id' | 'exceptions'>
