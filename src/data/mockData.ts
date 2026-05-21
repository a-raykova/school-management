import { CurrentUser, Room, ScheduleEntry, ClassEvent, TeacherHours, Announcement, Student, Fee, Payment} from '@/types'

/** Logged-in profile for the UI (switch in Sidebar for demo). */
export const currentUser: CurrentUser = {
  id: 1,
  role: 'teacher',
  firstName: 'Anna',
  lastName: 'Koeva',
  email: 'a.koeva@intelekti.com',
  initials: 'AK',
  subtitle: 'English Dept.',
}

// export const rooms: Room[] = [
//   { id: 1, name: 'Room 1', free: false, subject: 'English A1 – Beginners', teacher: 'A. Koeva', time: '09:00–10:30' },
//   { id: 2, name: 'Room 2', free: true },
//   { id: 3, name: 'Room 3', free: false, subject: 'Advanced English B2', teacher: 'A. Koeva', time: '11:00–12:30' },
//   { id: 4, name: 'Room 4', free: false, subject: 'German A2', teacher: 'M. Ivanova', time: '10:00–11:30' },
//   { id: 5, name: 'Room 5', free: true },
//   { id: 6, name: 'Room 6', free: true },
//   { id: 7, name: 'Room 7', free: true },
// ]

// export const rooms: Room[] = [
//   { id: 1, name: 'Room 1' },
//   { id: 2, name: 'Room 2' },
//   { id: 3, name: 'Room 3' },
//   { id: 4, name: 'Room 4' },
//   { id: 5, name: 'Room 5' },
// ]

export const initialSchedule: ScheduleEntry[] = [
  { id: 1, subject: 'Advanced English B2', day: 'Monday',    start: '09:00', end: '10:30', duration: 1.5, room: 'Room 3', teacher: 'Anna Koeva',   color: '#22c55e', recurrence: 'weekly', anchorDate: '2026-04-13' },
  { id: 2, subject: 'Business English',     day: 'Monday',    start: '11:00', end: '12:00', duration: 1,   room: 'Room 5', teacher: 'Martina Ivanova', color: '#f43f5e', recurrence: 'weekly', anchorDate: '2026-04-13' },
  { id: 3, subject: 'English Beginners A1', day: 'Wednesday', start: '14:00', end: '15:30', duration: 1.5, room: 'Room 1', teacher: 'Anna Koeva',   color: '#f59e0b', recurrence: 'weekly', anchorDate: '2026-04-15' },
  { id: 4, subject: 'Advanced English B2',  day: 'Friday',    start: '10:00', end: '11:30', duration: 1.5, room: 'Room 3', teacher: 'Anna Koeva',   color: '#22c55e', recurrence: 'weekly', anchorDate: '2026-04-17' },
]

// export const todayEvents: ClassEvent[] = [
//   { time: '11:00–12:30', title: 'Advanced English B2', meta: 'Room 3 · 12 students', soon: true },
//   { time: '14:00–15:00', title: 'Business English', meta: 'Room 5 · 8 students' },
// ]

// export const tomorrowEvents: ClassEvent[] = [
//   { time: '09:00–10:30', title: 'English Beginners A1', meta: 'Room 1 · 15 students' },
//   { time: '13:00–14:30', title: 'Advanced English B2', meta: 'Room 3 · 12 students' },
// ]

// export const teachers: Teacher[] = [
//   { name: 'A. Koeva', hours: 62 },
//   { name: 'M. Ivanova', hours: 78 },
//   { name: 'S. Petrov', hours: 55 },
//   { name: 'T. Georgieva', hours: 80 },
//   { name: 'R. Nikolov', hours: 45 },
//   { name: 'E. Dimitrova', hours: 28 },
// ]

export const initialAnnouncements: Announcement[] = [
  {
    id: 1,
    title: 'End-of-term schedule changes',
    body: 'The last week of term (18–22 May) all afternoon slots are moved 30 minutes earlier. Please update your schedules accordingly.',
    date: 'Today',
    isNew: true,
  },
  {
    id: 2,
    title: 'New student intake — May cohort',
    body: 'We expect 40 new students in the May cohort. Room assignments will be updated by Friday.',
    date: '7 Apr',
  },
  {
    id: 3,
    title: 'Staff meeting reminder',
    body: 'Monthly staff meeting this Thursday at 16:00 in the conference room.',
    date: '5 Apr',
  },
]


export const mockStudents: Student[] = [
  { id: 1, parentFullName: 'Иван Иванов',       parentPhone: '0888 123 456', childFullName: 'Maria Ivanova Petrova',    paymentMethod: 'cash', paymentSchedule: 'split', },
  { id: 2, parentFullName: 'Georgi Georgiev Dimitrov', parentPhone: '0877 234 567', childFullName: 'Petar Georgiev Dimitrov',  paymentMethod: 'card', paymentSchedule: 'full', },
  { id: 3, parentFullName: 'Elena Todorova Stoyanova', parentPhone: '0899 345 678', childFullName: 'Sofia Todorova Stoyanova', paymentMethod: 'cash', paymentSchedule: 'split',},
  { id: 4, parentFullName: 'Dimitar Kolev Angelov',    parentPhone: '0866 456 789', childFullName: 'Nikola Kolev Angelov',     paymentMethod: 'card', paymentSchedule: 'full', },
]

// export const mockPayments: Payment[] = [
//   { id: 1, studentId: 1, amount: 0, date: '2026-04-01', method: 'cash' },
//   { id: 2, studentId: 2, amount: 0, date: '2026-04-03', method: 'card' },
// ]

export const mockFees: Fee[] = []
export const mockPayments: Payment[] = []