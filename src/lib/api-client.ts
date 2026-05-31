import type {
  Announcement,
  CurrentUser,
  Fee,
  Payment,
  PaymentMethod,
  ScheduleEntry,
  Student,
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

export function fetchCurrentUser(email?: string) {
  return request<CurrentUser>('/api/users/current')
}

export function fetchSchedule() {
  return request<ScheduleEntry[]>('/api/schedule')
}

export function fetchTeachers() {
  return request<{ id: number; name: string }[]>('/api/teachers')
}

export function fetchRooms() {
  return request<{ id: number; name: string; color: string | null }[]>('/api/rooms')
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
