'use client'

import { useMemo } from 'react'
import { ScheduleEntry, CurrentUser } from '@/types'
import { toISO } from '@/utils/date'
import { getWeekStart, addDays, dateForDayInWeek, entryOccursInWeek } from '@/utils/schedule'
import { ALL_DAYS, DAY_SHORT } from '@/constants'


/* ─────────────────────────── helpers ─────────────────────────── */

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function isNowBetween(start: string, end: string): boolean {
  const now  = new Date()
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return hhmm >= start && hhmm < end
}

/* ─────────────────────────── types ─────────────────────────── */

interface MyWeekProps {
  schedule: ScheduleEntry[]
  user:     CurrentUser
}

/* ─────────────────────────── component ─────────────────────────── */

export default function MyWeek({ schedule, user }: MyWeekProps) {
  const today     = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const weekStart = useMemo(() => getWeekStart(today), [today])

  const myName = `${user.firstName} ${user.lastName}`

  const weekDays = useMemo(() =>
    ALL_DAYS.map((name, i) => ({
      name,
      short: DAY_SHORT[i],
      date:  addDays(weekStart, i),
    })),
  [weekStart])

  // per-day classes for this teacher this week
  const weekEntries = useMemo(() =>
    weekDays.map(({ name, date }) => ({
      name,
      date,
      items: schedule
        .filter(e =>
          e.teacher === myName &&
          e.day     === name   &&
          entryOccursInWeek(e, weekStart)
        )
        .sort((a, b) => a.start.localeCompare(b.start)),
    })),
  [schedule, weekDays, weekStart, myName])

  // weekly totals
  const weeklyHours = useMemo(() =>
    weekEntries.reduce((sum, day) =>
      sum + day.items.reduce((s, e) => s + e.duration, 0), 0
    ),
  [weekEntries])

  const totalClasses = weekEntries.reduce((sum, day) => sum + day.items.length, 0)

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6)
    const sM  = weekStart.toLocaleDateString('en-GB', { month: 'short' })
    const eM  = end.toLocaleDateString('en-GB',       { month: 'short' })
    return sM === eM
      ? `${weekStart.getDate()} – ${end.getDate()} ${eM} ${end.getFullYear()}`
      : `${weekStart.getDate()} ${sM} – ${end.getDate()} ${eM} ${end.getFullYear()}`
  }, [weekStart])

  return (
    <div className="h-full flex flex-col">

      {/* ── header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[18px] font-semibold text-black">My Week</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">{weekLabel}</p>
        </div>

        {/* summary pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
            <span className="text-[11px] text-blue-400 block leading-none mb-0.5">Classes This Week</span>
            <span className="text-[22px] font-semibold text-blue-600 leading-none">{totalClasses}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <span className="text-[11px] text-gray-400 block leading-none mb-0.5">Hours This Week</span>
            <span className="text-[22px] font-semibold text-gray-700 leading-none">
              {Math.round(weeklyHours * 10) / 10} h
            </span>
          </div>
        </div>
      </div>

      {/* ── day columns: grid on md+, list on mobile ── */}

      {/* MOBILE: vertical list */}
      <div className="flex flex-col gap-3 md:hidden">
        {weekEntries.map(({ name, date, items }) => {
          const isToday  = isSameDay(date, today)
          const isPast   = date < today
          const nowHHMM  = `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`

          return (
            <div key={name} className={`rounded-xl border overflow-hidden ${isToday ? 'border-blue-200' : 'border-gray-100'}`}>
              {/* day header */}
              <div className={`flex items-center gap-3 px-3 py-2 ${isToday ? 'bg-blue-500' : 'bg-gray-50'}`}>
                <span className={`text-[15px] font-bold ${isToday ? 'text-white' : isPast ? 'text-gray-300' : 'text-gray-700'}`}>
                  {date.getDate()}
                </span>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? 'text-blue-100' : 'text-gray-400'}`}>
                  {DAY_SHORT[ALL_DAYS.indexOf(name)]}
                </span>
                {items.length > 0 && (
                  <span className={`ml-auto text-[11px] ${isToday ? 'text-blue-200' : 'text-gray-400'}`}>
                    {items.length} {items.length === 1 ? 'class' : 'classes'}
                  </span>
                )}
              </div>

              {/* items */}
              {items.length === 0 ? (
                <div className={`px-3 py-2 text-[12px] italic ${isPast ? 'text-gray-200' : 'text-gray-300'}`}>
                  No classes
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {items.map(entry => {
                    const color       = entry.color ?? '#3b82f6'
                    const isLive      = isToday && isNowBetween(entry.start, entry.end)
                    const isEntryPast = isPast || (isToday && entry.end < nowHHMM)
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-3 px-3 py-2.5 relative ${isEntryPast && !isLive ? 'opacity-40' : ''}`}
                        style={{ borderLeft: `3px solid ${isEntryPast && !isLive ? '#d1d5db' : color}` }}
                      >
                        {isLive && (
                          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        <div className="min-w-[90px]">
                          <div className="text-[12px] font-medium text-gray-700">{entry.start} – {entry.end}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-gray-800 truncate">{entry.subject}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">📍 {entry.room}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* DESKTOP: 7-column grid */}
      <div className="hidden md:grid flex-1 grid-cols-7 gap-2" style={{ minHeight: 0 }}>
        {weekEntries.map(({ name, date, items }) => {
          const isToday  = isSameDay(date, today)
          const isPast   = date < today
          const hasItems = items.length > 0
          const nowHHMM  = `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`

          return (
            <div key={name} className="flex flex-col">
              {/* day header */}
              <div className={`flex flex-col items-center py-2 mb-2 rounded-lg ${isToday ? 'bg-blue-500' : 'bg-gray-50'}`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-blue-100' : 'text-gray-400'}`}>
                  {DAY_SHORT[ALL_DAYS.indexOf(name)]}
                </span>
                <span className={`text-[18px] font-bold leading-tight ${isToday ? 'text-white' : isPast ? 'text-gray-300' : 'text-gray-700'}`}>
                  {date.getDate()}
                </span>
                {hasItems && (
                  <span className={`text-[10px] mt-0.5 ${isToday ? 'text-blue-200' : 'text-gray-400'}`}>
                    {items.length} {items.length === 1 ? 'class' : 'classes'}
                  </span>
                )}
              </div>

              {/* class cards */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
                {!hasItems ? (
                  <div className={`flex-1 flex items-center justify-center rounded-lg border border-dashed ${isPast ? 'border-gray-100' : 'border-gray-200'}`}>
                    <span className={`text-[11px] ${isPast ? 'text-gray-200' : 'text-gray-300'}`}>—</span>
                  </div>
                ) : (
                  items.map(entry => {
                    const color       = entry.color ?? '#3b82f6'
                    const isLive      = isToday && isNowBetween(entry.start, entry.end)
                    const isEntryPast = isPast || (isToday && entry.end < nowHHMM)
                    return (
                      <div
                        key={entry.id}
                        className={`rounded-lg px-2 py-2 transition-all relative ${isEntryPast && !isLive ? 'opacity-40' : ''}`}
                        style={{
                          backgroundColor: `${color}15`,
                          borderLeft: `3px solid ${isEntryPast && !isLive ? '#d1d5db' : color}`,
                        }}
                      >
                        {isLive && (
                          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        <div className="text-[11px] font-semibold text-gray-800 leading-tight truncate">{entry.subject}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{entry.start} – {entry.end}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 truncate">📍 {entry.room}</div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── empty state ── */}
      {totalClasses === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
          <span className="text-3xl mb-2">📭</span>
          <span className="text-[13px]">No classes scheduled this week</span>
        </div>
      )}
    </div>
  )
}