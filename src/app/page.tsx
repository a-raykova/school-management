'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { NavPage, ScheduleEntry, Announcement, CurrentUser, Student, Fee, Payment, PaymentMethod } from '@/types'
import * as api from '@/lib/api-client'
import type { ScheduleCreateInput } from '@/lib/mappers'

import Sidebar       from '@/components/layout/Sidebar'
import Dashboard     from '@/components/dashboard/Dashboard'
import Rooms         from '@/components/rooms/Rooms'
import Schedule      from '@/components/schedule/Schedule'
import Week from '@/components/week/Week'
import Hours         from '@/components/hours/Hours'
import Announcements from '@/components/announcements/Announcements'
import Payments from '@/components/payments/Payments'
import Profile         from '@/components/profile/Profile'

import { computeRooms } from '@/utils/rooms'
import { computeBusiestDay } from '@/utils/dashboard'

export default function Page() {
  const [activePage,     setActivePage]     = useState<NavPage>('dashboard')
  const [schedule,       setSchedule]       = useState<ScheduleEntry[]>([])
  const [announcements,  setAnnouncements]  = useState<Announcement[]>([])
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

      const user = await api.fetchCurrentUser()
      if (cancelled) return
      setUser(user)

      const [schedule, announcements, teachersList, dbRooms] = await Promise.all([
        api.fetchSchedule(),
        api.fetchAnnouncements(),
        api.fetchTeachers(),
        api.fetchRooms(),
      ])
      if (cancelled) return
      setSchedule(schedule)
      setAnnouncements(announcements)
      setTeachersList(teachersList)
      setDbRooms(dbRooms)

      if (user.role === 'admin') {
        const [students, payments, fees] = await Promise.all([
          api.fetchStudents(),
          api.fetchPayments(),
          api.fetchFees(),
        ])
        if (cancelled) return
        setStudents(students)
        setPayments(payments)
        setFees(fees)
      }

    } catch (e) {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : 'Failed to load data')
      }
    } finally {
      if (!cancelled) setLoading(false)
    }
  })()
  return () => { cancelled = true }
}, [])

  const busiestDay = useMemo(() =>
    user && user.role === 'admin' ? null : computeBusiestDay(schedule, user ? `${user.firstName} ${user.lastName}` : ''),
  [schedule, user])

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500 text-sm">
        Loading…
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-red-600 text-sm px-4 text-center">
        {error ?? 'Failed to load user'}
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activePage={activePage} onNavigate={setActivePage} user={user} />

      <main className="flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
            {error}
          </div>
        )}
        {activePage === 'dashboard' && (
          <Dashboard
            rooms={rooms}
            announcements={announcements}
            onNavigate={setActivePage}
            user={user}
            busiestDay={busiestDay}
            schedule={schedule} 
          />
        )}
        {activePage === 'rooms'    && <Rooms rooms={rooms} />}
        {activePage === 'schedule' && (
          <Schedule
            schedule={schedule}
            onAdd={handleAddSchedule}
            onRemove={handleRemoveSchedule}
            onRemoveOccurrence={handleRemoveOccurrence}
            onEdit={handleEditSchedule}
            user={user}
            teachers={teachersList.map(t => t.name)}
            rooms={dbRooms}
          />
        )}
        {activePage === 'week'  && (
          <Week schedule={schedule} user={user} />
        )}
        {activePage === 'hours' && user.role === 'admin' && <Hours schedule={schedule} />}
        {activePage === 'announcements' && (
          <Announcements announcements={announcements} onPost={handlePostAnnouncement} user={user} />
        )}
        {activePage === 'payments' && (
          <Payments students={students} payments={payments} fees={fees} onLogPayment={handleLogPayment} onAddFee={handleAddFee} />
        )}
        {activePage === 'profile'  && <Profile user={user} />}
      </main>
    </div>
  )
}
