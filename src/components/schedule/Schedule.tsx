'use client'

import { useState, useMemo, useEffect } from 'react'
import { ScheduleEntry, RecurrenceType, CurrentUser } from '@/types'
import Modal, { ModalFooter } from '@/components/layout/Modal'
import { ALL_DAYS, DAY_SHORT, RECURRENCE_LABELS, inputCls, labelCls } from '@/constants'
import { toISO } from '@/utils/date'
import { getWeekStart, addDays, addWeeks, dateForDayInWeek, entryOccursInWeek, isSameDay, getMonthTabs } from '@/utils/schedule'

/* ─────────────────────────── constants ─────────────────────────── */

// all schedule constants are moved to /constants/index.ts
/* ─────────────────────────── helpers ───────────────────────────── */

// helper for locking event edit and remove when 5 minutes before event
function isEditLocked(entry: ScheduleEntry, today: Date, weekStart: Date, now: Date): boolean {
  const classDate = dateForDayInWeek(weekStart, entry.day)
  if (!isSameDay(classDate, today)) return false

  const [h, m] = entry.start.split(':').map(Number)
  const classStart = new Date(today)
  classStart.setHours(h, m, 0, 0)

  return now.getTime() >= classStart.getTime() - 5 * 60 * 1000
}


function hasRoomConflict(
  schedule: ScheduleEntry[],
  form: typeof blankForm,
  weekStart: Date,
  editingId?: number,
): { entry: ScheduleEntry; clashDate: string } | null {
  const [cs, ce] = [form.start, form.end].map(t => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  })

  const weeks = Array.from({ length: 52 }, (_, i) => addWeeks(weekStart, i))

  for (const entry of schedule) {
    if (entry.id === editingId)   continue
    if (entry.room !== form.room) continue
    if (entry.day  !== form.day)  continue

    const [es, ee] = [entry.start, entry.end].map(t => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    })

    if (!(cs < ee && ce > es)) continue

    const candidate = {
      id:         -1,
      subject:    form.subject,
      duration:   0,
      teacher:    form.teacher,
      day:        form.day,
      start:      form.start,
      end:        form.end,
      room:       form.room,
      recurrence: form.recurrence,
      anchorDate: toISO(dateForDayInWeek(weekStart, form.day)),
      exceptions: [],
    } as ScheduleEntry

    const clashWeek = weeks.find(w =>
      entryOccursInWeek(entry, w) && entryOccursInWeek(candidate, w)
    )

    if (clashWeek) {
      const clashDate = dateForDayInWeek(clashWeek, entry.day)
      return {
        entry,
        clashDate: clashDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      }
    }
  }
  return null
}

/* ─────────────────────────── types ─────────────────────────────── */

interface ScheduleProps {
  schedule: ScheduleEntry[]
  onAdd:    (entry: Omit<ScheduleEntry, 'id'>) => void
  onRemove: (id: number) => void
  onRemoveOccurrence: (id: number, date: string) => void 
  onEdit:   (entry: ScheduleEntry) => void
  user:     CurrentUser
  teachers: string[]
  rooms:    { id: number; name: string; color: string | null }[]
}

const blankForm = {
  subject:    '',
  day:        'Monday' as string,
  start:      '09:00',
  end:        '10:30',
  room:       '',
  teacher:    '',
  recurrence: 'weekly' as RecurrenceType,
}

/* ─────────────────────────── component ─────────────────────────── */

export default function Schedule({ schedule, onAdd, onRemove, onRemoveOccurrence, onEdit, user, teachers, rooms }: ScheduleProps) {
  const today     = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const monthTabs = useMemo(() => getMonthTabs(today), [today])

  const [weekStart,      setWeekStart]      = useState<Date>(() => getWeekStart(today))
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editEntry,      setEditEntry]      = useState<ScheduleEntry | null>(null)
  const [form,           setForm]           = useState(blankForm)
  const [deleteConfirm,  setDeleteConfirm]  = useState<{ id: number; date: string } | null>(null)
  const [activeRooms,    setActiveRooms]    = useState<Set<string>>(new Set())
  const [activeTeachers, setActiveTeachers] = useState<Set<string>>(new Set())
  // for taking the time now for the 5 minute lock 
  const [now, setNow] = useState(() => new Date())

  //for room overlapping error
  const [roomError, setRoomError] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const canEdit = (entry: ScheduleEntry, date: Date) => {
    if (user.role === 'admin') return true
    if (entry.teacher !== `${user.firstName} ${user.lastName}`) return false
    return !isEditLocked(entry, date, getWeekStart(date), now)
  }

  const usedRooms = useMemo(() => rooms.filter(r => schedule.some(e => e.room === r.name)).map(r => r.name), [schedule, rooms])
  const usedTeachers = useMemo(() => teachers.filter(t => schedule.some(e => e.teacher === t)), [schedule, teachers])
  const hasActiveFilters = activeRooms.size > 0 || activeTeachers.size > 0

  const clearRooms    = () => setActiveRooms(new Set())
  const clearTeachers = () => setActiveTeachers(new Set())

  const weekDays = useMemo(() =>
    ALL_DAYS.map((name, i) => ({ name, short: DAY_SHORT[i], date: addDays(weekStart, i) })),
  [weekStart])

  const activeMonthIdx = useMemo(() => {
    const mid = addDays(weekStart, 3)
    return monthTabs.findIndex(m => m.getMonth() === mid.getMonth() && m.getFullYear() === mid.getFullYear())
  }, [weekStart, monthTabs])

  const weekEntries = useMemo(() =>
    ALL_DAYS.map(day => ({
      day,
      items: schedule
        .filter(e => {
          if (e.day !== day) return false
          if (!entryOccursInWeek(e, weekStart)) return false
          if (activeRooms.size > 0    && !activeRooms.has(e.room))       return false
          if (activeTeachers.size > 0 && !activeTeachers.has(e.teacher)) return false
          return true
        })
        .sort((a, b) => a.start.localeCompare(b.start)),
    })),
  [schedule, weekStart, activeRooms, activeTeachers])

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6)
    const sM  = weekStart.toLocaleDateString('en-GB', { month: 'short' })
    const eM  = end.toLocaleDateString('en-GB',       { month: 'short' })
    const sD  = weekStart.getDate()
    const eD  = end.getDate()
    return sM === eM
      ? `${sD} – ${eD} ${sM} ${end.getFullYear()}`
      : `${sD} ${sM} – ${eD} ${eM} ${end.getFullYear()}`
  }, [weekStart])

  const openAdd = () => {
    setEditEntry(null)
    setForm({ ...blankForm, room: rooms[0]?.name ?? '', teacher: user.role === 'admin' ? teachers[0] : `${user.firstName} ${user.lastName}` })
    setModalOpen(true)
  }

  const openEdit = (entry: ScheduleEntry) => {
    setEditEntry(entry)
    setForm({
      subject:    entry.subject,
      day:        entry.day,
      start:      entry.start,
      end:        entry.end,
      room:       entry.room,
      teacher: user.role === 'admin' ? entry.teacher : `${user.firstName} ${user.lastName}`,
      recurrence: entry.recurrence,
    })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditEntry(null); setRoomError(null) }

  const handleSave = () => {
    if (!form.subject.trim()) return
    const [sh, sm] = form.start.split(':').map(Number)
    const [eh, em] = form.end.split(':').map(Number)
    const durationH = Math.max(0.5, (eh * 60 + em - sh * 60 - sm) / 60)
    const teacher   = user.role === 'admin' ? form.teacher : `${user.firstName} ${user.lastName}`
    const conflict = hasRoomConflict(schedule, form, weekStart, editEntry?.id)
    if (conflict) {
      setRoomError(
        `${conflict.entry.room} is already booked for "${conflict.entry.subject}" from ${conflict.entry.start} to ${conflict.entry.end} on ${conflict.clashDate}.`
      )
      return
    }
    setRoomError(null)
    const base = {
      subject:    form.subject.trim(),
      day:        form.day,
      start:      form.start,
      end:        form.end,
      duration:   durationH,
      room:       form.room,
      teacher,
      color: rooms.find(r => r.name === form.room)?.color ?? '#3b82f6',
      recurrence: form.recurrence,
      anchorDate: editEntry?.anchorDate ?? toISO(dateForDayInWeek(weekStart, form.day)),
    }
    editEntry ? onEdit({ ...base, id: editEntry.id }) : onAdd(base)
    closeModal()
  }

  const confirmDelete = (id: number) => { onRemove(id); setDeleteConfirm(null) }

  const confirmDeleteOccurrence = (id: number, date: string) => {
  onRemoveOccurrence(id, date)  // ← was: onEdit({ ...entry, exceptions: [...] })
  setDeleteConfirm(null)
}

  const filterSelectCls =
    'appearance-none pl-3 pr-7 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-[12px] ' +
    'font-medium border-0 focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer'

  return (
    <div className="h-full flex flex-col">

      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-[18px] font-semibold text-black">My Schedule</h1>

        <div className="flex flex-wrap items-center gap-2">
          {/* Room filter */}
          {usedRooms.length > 0 && (
            <div className="relative">
              <select
                className={filterSelectCls}
                value={activeRooms.size === 1 ? [...activeRooms][0] : ''}
                onChange={e => e.target.value === '' ? clearRooms() : setActiveRooms(new Set([e.target.value]))}
              >
                <option value="">All rooms</option>
                {usedRooms.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▾</span>
            </div>
          )}

          {/* Teacher filter */}
          {usedTeachers.length > 0 && (
            <div className="relative">
              <select
                className={filterSelectCls}
                value={activeTeachers.size === 1 ? [...activeTeachers][0] : ''}
                onChange={e => e.target.value === '' ? clearTeachers() : setActiveTeachers(new Set([e.target.value]))}
              >
                <option value="">All teachers</option>
                {usedTeachers.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▾</span>
            </div>
          )}

          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#3b82f6] text-white text-[12px] font-semibold hover:bg-blue-500 transition-colors shadow-md"
          >
            <span className="text-[16px] leading-none">+</span>
            <span className="hidden sm:inline">Add class</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* calendar shell */}
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 bg-white flex flex-col" style={{ minHeight: 0 }}>

        {/* month tabs */}
        <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b border-gray-200 overflow-x-auto">
          {monthTabs.map((m, i) => (
            <button
              key={i}
              onClick={() => setWeekStart(getWeekStart(new Date(m.getFullYear(), m.getMonth(), 15)))}
              className={`px-3 py-1 rounded-md text-[12px] font-semibold shrink-0 transition-colors ${
                i === activeMonthIdx
                  ? 'bg-[#3b82f6] text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {m.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
            </button>
          ))}
        </div>

        {/* week nav */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
          <button onClick={() => setWeekStart(w => addWeeks(w, -1))} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-[14px]">‹</button>
          <span className="text-[13px] font-semibold text-gray-800 tracking-wide">{weekLabel}</span>
          <button onClick={() => setWeekStart(w => addWeeks(w, 1))}  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-[14px]">›</button>
        </div>

        {/* day rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
          {weekDays.map(({ name, short, date }) => {
            const isToday  = isSameDay(date, today)
            const dayItems = weekEntries.find(e => e.day === name)?.items ?? []
            return (
              <div key={name} className="flex min-h-14">
                <div className={`w-12 sm:w-16 shrink-0 flex flex-col items-center justify-center py-3 gap-0.5 border-r border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-[#3b82f6]' : 'text-gray-500'}`}>{short}</span>
                  <span className={`text-[17px] font-bold leading-none ${isToday ? 'text-[#3b82f6]' : 'text-gray-800'}`}>{date.getDate()}</span>
                </div>
                <div className="flex-1 flex flex-col gap-1.5 px-3 py-2 justify-center">
                  {dayItems.length === 0 ? (
                    <span className="text-[12px] text-gray-400 italic">
                      {hasActiveFilters ? 'No matching classes' : 'No classes'}
                    </span>
                  ) : (
                    dayItems.map(entry => (
                      <EventChip
                        key={entry.id}
                        entry={entry}
                        canEdit={canEdit(entry, date)}
                        locked={user.role !== 'admin' && isEditLocked(entry, date, getWeekStart(date), now)} 
                        onEdit={() => openEdit(entry)}
                        onDelete={() => setDeleteConfirm({ id: entry.id, date: toISO(date) })}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editEntry ? 'Edit class' : 'Add class to schedule'}>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Subject / Title</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Advanced English B2"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Day of week</label>
            <select value={form.day} onChange={e => { setForm({ ...form, day:  e.target.value }); setRoomError(null) }} className={inputCls}>
              {ALL_DAYS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Start time</label>
              <input type="time" value={form.start} onChange={e => { setForm({ ...form, start: e.target.value }); setRoomError(null) }} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End time</label>
              <input type="time" value={form.end} onChange={e => { setForm({ ...form, end:   e.target.value }); setRoomError(null) }} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Room</label>
            <select value={form.room} onChange={e => { setForm({ ...form, room: e.target.value }); setRoomError(null) }} className={inputCls}>
              {rooms.map(r => <option key={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Teacher</label>
            {user.role === 'admin' ? (
              <select value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} className={inputCls}>
                {teachers.map(t => <option key={t}>{t}</option>)}
              </select>
            ) : (
              <div className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`}>
                {`${user.firstName} ${user.lastName}`}
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Repeat</label>
            <select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value as RecurrenceType })} className={inputCls}>
              {(Object.entries(RECURRENCE_LABELS) as [RecurrenceType, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        {roomError && (
          <div className="flex items-start mt-4 gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <span className="text-[13px] shrink-0">⚠️</span>
            <span className="text-[12px] leading-snug">{roomError}</span>
          </div>
        )}
        <ModalFooter onCancel={closeModal} onConfirm={handleSave} confirmLabel={editEntry ? 'Save changes' : 'Add class'} />
      </Modal>

      {/* Delete confirm */}
      {deleteConfirm !== null && (() => {
        const entry       = schedule.find(e => e.id === deleteConfirm.id)
        const isRecurring = entry?.recurrence !== 'once'
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-white rounded-xl border border-gray-200 p-5 w-85" onClick={e => e.stopPropagation()}>
              <p className="text-[14px] font-semibold text-gray-800 mb-1">Remove class</p>
              {isRecurring ? (
                <>
                  <p className="text-[12px] text-gray-500 mb-4">This is a recurring event. What would you like to remove?</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => confirmDeleteOccurrence(deleteConfirm.id, deleteConfirm.date)}
                      className="w-full px-3.5 py-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-[12px] font-medium hover:bg-amber-100 transition-colors text-left"
                    >
                      📅 Only this occurrence
                      <span className="block text-[11px] text-amber-600 font-normal mt-0.5">Removes just {deleteConfirm.date}</span>
                    </button>
                    <button
                      onClick={() => confirmDelete(deleteConfirm.id)}
                      className="w-full px-3.5 py-2 bg-red-50 border border-red-300 text-red-700 rounded-lg text-[12px] font-medium hover:bg-red-100 transition-colors text-left"
                    >
                      🗑️ All occurrences
                      <span className="block text-[11px] text-red-500 font-normal mt-0.5">Permanently removes this recurring class</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[12px] text-gray-500 mb-4">Remove this single class from the schedule?</p>
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setDeleteConfirm(null)} className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-[12px] text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                    <button onClick={() => confirmDelete(deleteConfirm.id)} className="px-3.5 py-1.5 bg-red-600/80 text-white rounded-lg text-[12px] font-medium hover:bg-red-600 transition-colors">Remove</button>
                  </div>
                </>
              )}
              <button onClick={() => setDeleteConfirm(null)} className="mt-3 w-full text-center text-[11px] text-gray-400 hover:text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/* ─────────────────── EventChip ─────────────────── */

function EventChip({
  entry,
  onEdit,
  onDelete,
  canEdit,
  locked,
}: {
  entry:    ScheduleEntry
  onEdit:   () => void
  onDelete: () => void
  canEdit:  boolean
  locked?: boolean
}) {
  const color   = entry.color ?? '#3b82f6'
  const recIcon = entry.recurrence !== 'once'

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 transition-all group ${
        canEdit ? 'cursor-pointer hover:brightness-110' : 'cursor-default'
      }`}
      style={{ backgroundColor: `${color}18`, borderLeft: `3px solid ${color}` }}
      onClick={canEdit ? onEdit : undefined}
    >
      <div className="shrink-0 min-w-22">
        <span className="text-[12px] font-semibold text-gray-800">{entry.start} – {entry.end}</span>
      </div>
      <div className="w-px h-6 bg-gray-200 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-gray-900 truncate">{entry.subject}</span>
          {recIcon && <span className="text-[11px] text-gray-400 shrink-0">↻ {entry.recurrence}</span>}
          {locked && <span title="Editing locked — class starting soon" className="text-[10px] text-gray-400 shrink-0">🔒</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-[11px] text-gray-500">📍 {entry.room}</span>
          <span className="hidden sm:inline text-[11px] text-gray-500">👤 {entry.teacher}</span>
        </div>
      </div>
      {canEdit && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={onDelete} className="px-2 py-0.5 rounded text-[10px] text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors">
            REMOVE ✕
          </button>
        </div>
      )}
    </div>
  )
}