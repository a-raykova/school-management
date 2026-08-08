'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ScheduleCreateInput } from '@/lib/mappers'
import * as api from '@/lib/api-client'
import type {
  Announcement,
  CurrentUser,
  Fee,
  Payment,
  PaymentMethod,
  ScheduleEntry,
  Student,
} from '@/types'
import { computeRooms } from '@/utils/rooms'
import { computeBusiestDay } from '@/utils/dashboard'

interface AppDataContextValue {
  user: CurrentUser | null
  schedule: ScheduleEntry[]
  announcements: Announcement[]
  students: Student[]
  payments: Payment[]
  fees: Fee[]
  rooms: ReturnType<typeof computeRooms>
  dbRooms: { id: number; name: string; color: string | null }[]
  teachersList: { id: number; name: string }[]
  busiestDay: { day: string; count: number } | null
  loading: boolean
  error: string | null
  handleAddSchedule: (entry: ScheduleCreateInput) => Promise<void>
  handleRemoveSchedule: (id: number) => Promise<void>
  handleRemoveOccurrence: (id: number, date: string) => Promise<void>
  handleEditSchedule: (updated: ScheduleEntry) => Promise<void>
  handlePostAnnouncement: (title: string, body: string) => Promise<void>
  handleLogPayment: (
    studentId: number,
    amount: number,
    method: PaymentMethod,
    note?: string,
  ) => Promise<void>
  handleAddFee: (studentId: number, amount: number, note?: string) => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rooms, setRooms] = useState(() => computeRooms([], []))
  const [dbRooms, setDbRooms] = useState<{ id: number; name: string; color: string | null }[]>([])
  const [teachersList, setTeachersList] = useState<{ id: number; name: string }[]>([])

  const refreshAnnouncements = useCallback(async () => {
    const data = await api.fetchAnnouncements()
    setAnnouncements(data)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const currentUser = await api.fetchCurrentUser()
        if (cancelled) return
        setUser(currentUser)

        const [scheduleData, announcementsData, teachers, roomsData] = await Promise.all([
          api.fetchSchedule(),
          api.fetchAnnouncements(),
          api.fetchTeachers(),
          api.fetchRooms(),
        ])
        if (cancelled) return
        setSchedule(scheduleData)
        setAnnouncements(announcementsData)
        setTeachersList(teachers)
        setDbRooms(roomsData)

        if (currentUser.role === 'admin') {
          const [studentsData, paymentsData, feesData] = await Promise.all([
            api.fetchStudents(),
            api.fetchPayments(),
            api.fetchFees(),
          ])
          if (cancelled) return
          setStudents(studentsData)
          setPayments(paymentsData)
          setFees(feesData)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load data')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const busiestDay = useMemo(
    () =>
      user && user.role === 'admin'
        ? null
        : computeBusiestDay(schedule, user ? `${user.firstName} ${user.lastName}` : ''),
    [schedule, user],
  )

  useEffect(() => {
    const recompute = () => setRooms(computeRooms(schedule, dbRooms))
    recompute()
    const id = setInterval(recompute, 60_000)
    return () => clearInterval(id)
  }, [schedule, dbRooms])

  const runMutation = async (fn: () => Promise<void>) => {
    try {
      setError(null)
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  const handleAddSchedule = (entry: ScheduleCreateInput) =>
    runMutation(async () => {
      const created = await api.createScheduleEntry(entry)
      setSchedule((prev) => [...prev, created])
    })

  const handleRemoveSchedule = (id: number) =>
    runMutation(async () => {
      await api.deleteScheduleEntry(id)
      setSchedule((prev) => prev.filter((e) => e.id !== id))
      await refreshAnnouncements()
    })

  const handleRemoveOccurrence = (id: number, date: string) =>
    runMutation(async () => {
      const updated = await api.addScheduleException(id, date)
      setSchedule((prev) => prev.map((e) => (e.id === id ? updated : e)))
      await refreshAnnouncements()
    })

  const handleEditSchedule = (updated: ScheduleEntry) =>
    runMutation(async () => {
      const { id, exceptions: _ex, ...input } = updated
      const saved = await api.updateScheduleEntry(id, input)
      setSchedule((prev) => prev.map((e) => (e.id === id ? saved : e)))
      await refreshAnnouncements()
    })

  const handlePostAnnouncement = (title: string, body: string) =>
    runMutation(async () => {
      const created = await api.createAnnouncement(title, body)
      setAnnouncements((prev) => [{ ...created, isNew: true }, ...prev])
    })

  const handleLogPayment = (
    studentId: number,
    amount: number,
    method: PaymentMethod,
    note?: string,
  ) =>
    runMutation(async () => {
      const created = await api.createPayment(studentId, amount, method, note)
      setPayments((prev) => [...prev, created])
    })

  const handleAddFee = (studentId: number, amount: number, note?: string) =>
    runMutation(async () => {
      const created = await api.createFee(studentId, amount, note)
      setFees((prev) => [...prev, created])
    })

  const value: AppDataContextValue = {
    user,
    schedule,
    announcements,
    students,
    payments,
    fees,
    rooms,
    dbRooms,
    teachersList,
    busiestDay,
    loading,
    error,
    handleAddSchedule,
    handleRemoveSchedule,
    handleRemoveOccurrence,
    handleEditSchedule,
    handlePostAnnouncement,
    handleLogPayment,
    handleAddFee,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
