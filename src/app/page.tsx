'use client'

import { useState, useMemo, useEffect } from 'react'
import { NavPage, ScheduleEntry, Announcement, CurrentUser, UserRole, Student, Fee, Payment, PaymentMethod } from '@/types'
import {
  initialSchedule,
  initialAnnouncements,
  mockStudents,
  mockPayments, 
  mockFees
} from '@/data/mockData'
import { currentUser as mockUser } from '@/data/mockData'

import Sidebar       from '@/components/layout/Sidebar'
import Dashboard     from '@/components/dashboard/Dashboard'
import Rooms         from '@/components/rooms/Rooms'
import Schedule      from '@/components/schedule/Schedule'
import Week from '@/components/week/Week'
import Hours         from '@/components/hours/Hours'
import Announcements from '@/components/announcements/Announcements'
import Payments from '@/components/payments/Payments'
import Profile         from '@/components/profile/Profile'
import Settings        from '@/components/settings/Settings'

import { computeRooms } from '@/utils/rooms'
import { computeTeacherHours }  from '@/utils/hours'
import { computeBusiestDay } from '@/utils/dashboard'

export default function Page() {
  const [activePage,     setActivePage]     = useState<NavPage>('dashboard')
  const [schedule,       setSchedule]       = useState<ScheduleEntry[]>(initialSchedule)
  const [announcements,  setAnnouncements]  = useState<Announcement[]>(initialAnnouncements)
  const [user, setUser] = useState<CurrentUser>(mockUser)
  const [students, setStudents] = useState<Student[]>(mockStudents)
  const [payments, setPayments] = useState<Payment[]>(mockPayments)
  const [fees, setFees] = useState<Fee[]>(mockFees)

  // for live updating of the rooms
  const [rooms, setRooms] = useState(() => computeRooms(schedule))

  const [teachers, setTeachers] = useState(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return computeTeacherHours(schedule, today.getFullYear(), today.getMonth(), today)
  })

  // card with busiest day
  const busiestDay = useMemo(() =>
    user.role === 'admin' ? null : computeBusiestDay(schedule, `${user.firstName} ${user.lastName}`),
  [schedule, user])

  useEffect(() => {
    const recompute = () => {
      setRooms(computeRooms(schedule))
      const today = new Date(); today.setHours(0, 0, 0, 0)
      setTeachers(computeTeacherHours(schedule, today.getFullYear(), today.getMonth(), today))
    }
    recompute()
    const id = setInterval(recompute, 60_000)
    return () => clearInterval(id)
  }, [schedule])

  const handleSwitchRole = (role: UserRole) => setUser(u => ({ ...u, role }))

  const handleAddSchedule = (entry: Omit<ScheduleEntry, 'id'>) =>
    setSchedule((prev) => [...prev, { ...entry, id: Date.now() }])

  // removes all occurrences + notifies teacher
  const handleRemoveSchedule = (id: number) => {
    const entry = schedule.find(e => e.id === id)
    if (entry) {
      setAnnouncements(prev => [{
        id: Date.now(),
        title: `Class cancelled: ${entry.subject}`,
        body: `Your ${entry.subject} class on ${entry.day} at ${entry.start} (${entry.room}) has been removed from the schedule.`,
        date: new Date().toISOString().slice(0, 10),
        isNew: true,
        targetTeacher: entry.teacher,
      }, ...prev])
    }
    setSchedule(prev => prev.filter(e => e.id !== id))
  }

  // removes a single occurrence + notifies teacher
  const handleRemoveOccurrence = (id: number, date: string) => {
    const entry = schedule.find(e => e.id === id)
    if (entry) {
      setAnnouncements(prev => [{
        id: Date.now(),
        title: `Class cancelled: ${entry.subject}`,
        body: `Your ${entry.subject} class on ${date} at ${entry.start} (${entry.room}) has been cancelled.`,
        date: new Date().toISOString().slice(0, 10),
        isNew: true,
        targetTeacher: entry.teacher,
      }, ...prev])
    }
    setSchedule(prev => prev.map(e =>
      e.id === id ? { ...e, exceptions: [...(e.exceptions ?? []), date] } : e
    ))
  }

  const handleEditSchedule = (updated: ScheduleEntry) => {
    const prev = schedule.find(e => e.id === updated.id)
    if (prev) {
      const changes: string[] = []
      if (prev.day   !== updated.day)   changes.push(`day changed from ${prev.day} to ${updated.day}`)
      if (prev.start !== updated.start) changes.push(`start time changed from ${prev.start} to ${updated.start}`)
      if (prev.end   !== updated.end)   changes.push(`end time changed from ${prev.end} to ${updated.end}`)
      if (prev.room  !== updated.room)  changes.push(`room changed from ${prev.room} to ${updated.room}`)

      if (changes.length > 0) {
        setAnnouncements(a => [{
          id: Date.now(),
          title: `Schedule update: ${updated.subject}`,
          body: `Your ${updated.subject} class has been updated — ${changes.join(', ')}.`,
          date: new Date().toISOString().slice(0, 10),
          isNew: true,
          targetTeacher: updated.teacher,
        }, ...a])
      }
    }
    setSchedule(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  const handlePostAnnouncement = (title: string, body: string) =>
    setAnnouncements((prev) => [
      { id: Date.now(), title, body, date: 'Today', isNew: true },
      ...prev,
    ])

  const handleLogPayment = (studentId: number, amount: number, method: PaymentMethod, note?: string) =>
    setPayments(prev => [
      ...prev,
      {
        id: Date.now(),
        studentId,
        amount,
        date: new Date().toISOString().split('T')[0],
        method,
        note,
      },
    ])

  const handleAddFee = (studentId: number, amount: number, note?: string) =>
    setFees(prev => [...prev, { id: Date.now(), studentId, amount, note, date: new Date().toISOString().slice(0, 10) }])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activePage={activePage} onNavigate={setActivePage} user={user} onSwitchRole={handleSwitchRole} />

      <main className="flex-1 overflow-y-auto p-5">
        {activePage === 'dashboard' && (
          <Dashboard
            rooms={rooms}
            announcements={announcements}
            onNavigate={setActivePage}
            user={user}
            teacherHours={teachers}
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
          />
        )}
        {activePage === 'week'  && (
          <Week schedule={schedule} user={user} />
        )}
        {activePage === 'hours' && <Hours teachers={teachers} />}
        {activePage === 'announcements' && (
          <Announcements announcements={announcements} onPost={handlePostAnnouncement} user={user} />
        )}
        {activePage === 'payments' && (
          <Payments students={students} payments={payments} fees={fees} onLogPayment={handleLogPayment} onAddFee={handleAddFee} />
        )}
        {activePage === 'profile'  && <Profile user={user} />}
        {activePage === 'settings' && <Settings />}
      </main>
    </div>
  )
}