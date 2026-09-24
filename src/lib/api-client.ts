import type {
  Announcement,
  CurrentUser,
  Fee,
  Payment,
  PaymentMethod,
  ScheduleEntry,
  Student,
  TeacherOption,
} from '@/types'
import type { ScheduleCreateInput } from '@/lib/mappers'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed: ${res.status}`)
  }
  return data as T
}

export function fetchCurrentUser() {
  return request<CurrentUser>('/api/users/current')
}

export function fetchSchedule() {
  return request<ScheduleEntry[]>('/api/schedule')
}

export function fetchTeachers() {
  return request<TeacherOption[]>('/api/teachers')
}

export function createTeacher(input: {
  firstName: string
  lastName: string
  email: string
  subtitle?: string | null
  honorariumRate?: number | null
}) {
  return request<TeacherOption>('/api/teachers', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateTeacher(
  id: number,
  changes: {
    firstName?: string
    lastName?: string
    email?: string
    subtitle?: string | null
    isActive?: boolean
    honorariumRate?: number | null
  },
) {
  return request<TeacherOption>(`/api/teachers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

export function deleteTeacher(id: number) {
  return request<
    | { deleted: true }
    | { deleted: false; archived: true; teacher: TeacherOption; classCount: number }
  >(`/api/teachers/${id}`, { method: 'DELETE' })
}

export function updateTeacherRate(id: number, honorariumRate: number | null) {
  return request<TeacherOption>(`/api/teachers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ honorariumRate }),
  })
}

export type DbRoom = { id: number; name: string; color: string | null; isActive: boolean }

export function fetchRooms() {
  return request<DbRoom[]>('/api/rooms')
}

export function createRoom(name: string, color?: string | null) {
  return request<DbRoom>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  })
}

export function updateRoom(
  id: number,
  changes: { name?: string; color?: string | null; isActive?: boolean },
) {
  return request<DbRoom>(`/api/rooms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

export function deleteRoom(id: number) {
  return request<
    | { deleted: true }
    | { deleted: false; archived: true; room: DbRoom; classCount: number }
  >(`/api/rooms/${id}`, { method: 'DELETE' })
}

export function createScheduleEntry(entry: ScheduleCreateInput) {
  return request<ScheduleEntry>('/api/schedule', {
    method: 'POST',
    body: JSON.stringify(entry),
  })
}

export function updateScheduleEntry(id: number, entry: ScheduleCreateInput) {
  return request<ScheduleEntry>(`/api/schedule/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(entry),
  })
}

export function deleteScheduleEntry(id: number) {
  return request<{ ok: boolean }>(`/api/schedule/${id}`, { method: 'DELETE' })
}

export function addScheduleException(id: number, date: string) {
  return request<ScheduleEntry>(`/api/schedule/${id}/exceptions`, {
    method: 'POST',
    body: JSON.stringify({ date }),
  })
}

export function fetchAnnouncements() {
  return request<Announcement[]>('/api/announcements')
}

export function createAnnouncement(title: string, body: string) {
  return request<Announcement>('/api/announcements', {
    method: 'POST',
    body: JSON.stringify({ title, body }),
  })
}

export function fetchStudents() {
  return request<Student[]>('/api/students')
}

export function fetchPayments() {
  return request<Payment[]>('/api/payments')
}

export function fetchFees() {
  return request<Fee[]>('/api/fees')
}

export function createPayment(
  studentId: number,
  amount: number,
  method: PaymentMethod,
  note?: string,
) {
  return request<Payment>('/api/payments', {
    method: 'POST',
    body: JSON.stringify({ studentId, amount, method, note }),
  })
}

export function createFee(studentId: number, amount: number, note?: string) {
  return request<Fee>('/api/fees', {
    method: 'POST',
    body: JSON.stringify({ studentId, amount, note }),
  })
}
