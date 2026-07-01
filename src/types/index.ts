export type UserRole = 'admin' | 'teacher'

export interface CurrentUser {
  id: number
  role: UserRole  // 'admin' | 'teacher'
  firstName: string
  lastName: string
  email: string
  initials: string
  subtitle: string
}

export type NavPage =
  | 'dashboard'
  | 'rooms'
  | 'schedule'
  | 'week'
  | 'hours'
  | 'payments'    
  | 'announcements'
  | 'profile' 

export interface Room {
  id: number
  name: string
  free: boolean
  subject?: string
  teacher?: string
  time?: string
}

export type RecurrenceType = 'once' | 'weekly' | 'biweekly' | 'monthly'

export interface ScheduleEntry {
  id: number
  subject: string
  day: string          // 'Monday' … 'Sunday'
  start: string        // 'HH:MM'
  end: string          // 'HH:MM'
  duration: number     // kept for back-compat
  room: string
  teacher: string
  color?: string       // accent color hex/tailwind key
  recurrence: RecurrenceType
  /** ISO date string of the first occurrence – used to anchor recurring events */
  anchorDate: string
  exceptions?: string[]
}

export interface ClassEvent {
  time: string
  title: string
  meta: string
  soon?: boolean
}

// export interface Teacher {
//   name: string
//   hours: number
// }

export interface Announcement {
  id: number
  title: string
  body: string
  date: string
  isNew?: boolean
  targetTeacher?: string //if set, only this teacher will see the announcement
  author?: string
}

export type PaymentMethod = 'cash' | 'bankTransfer'
export type PaymentSchedule = 'full' | 'split' // split = two parts

export interface Student {
  id: number
  parentFullName: string
  parentPhone: string
  childFullName: string
  paymentMethod: PaymentMethod
  paymentSchedule: PaymentSchedule
}

export interface Fee {
  id: number
  studentId: number
  date: string    // ISO date string
  amount: number  // always positive
  note?: string   // e.g. "Course fee", "Workbook", "Extra class"
}

export interface Payment {
  id: number
  studentId: number
  amount: number
  date: string
  method: PaymentMethod
  note?: string
}

// for Hours.tsx
export interface TeacherHours {
  name:      string
  workedHours: number   // classes whose date < today
  plannedHours: number   // classes whose date >= today and <= end of month
}