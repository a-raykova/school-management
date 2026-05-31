'use client'

import { NavPage, Room, Announcement, CurrentUser, TeacherHours } from '@/types'
import Card, { CardHeader } from '@/components/layout/Card'
import Badge from '@/components/layout/Badge'
import { ScheduleEntry } from '@/types'
import { getWeekStart, addDays, entryOccursInWeek } from '@/utils/schedule'
import { ALL_DAYS, DAY_SHORT } from '@/constants'

interface DashboardProps {
  rooms: Room[]
  announcements: Announcement[]
  onNavigate: (page: NavPage) => void
  user: CurrentUser
  teacherHours: TeacherHours[]
  busiestDay: { day: string; count: number } | null
  schedule: ScheduleEntry[]
  // for schedule + date context
  // schedule: ScheduleEntry[] 
}

export default function Dashboard({
  rooms,
  announcements,
  onNavigate,
  user,
  teacherHours,
  busiestDay,
  schedule
}: DashboardProps) {
  const isAdmin   = user.role === 'admin'
  const myName  = `${user.firstName} ${user.lastName}`
  const freeCount = rooms.filter((r) => r.free).length
  const latestAnn  = announcements[0]
  const newToday = announcements.filter(a => a.isNew).length

  const greeting  = isAdmin ? 'Good morning, Admin' : `Good morning, ${user.firstName}`

  // teacher view: find their own row; admin view: sum everyone
  const myHours = isAdmin
    ? { workedHours: teacherHours.reduce((s, t) => s + t.workedHours, 0), plannedHours: teacherHours.reduce((s, t) => s + t.plannedHours, 0) }
    : teacherHours.find(t => t.name === myName) ?? { workedHours: 0, plannedHours: 0 }

  const workedLabel  = `${Math.round(myHours.workedHours  * 10) / 10} h worked`
  const plannedLabel = `of ${Math.round((myHours.workedHours + myHours.plannedHours) * 10) / 10} h planned`

  const stats = [
    { label: isAdmin ? 'School hours this month' : 'My hours this month', value: workedLabel, sub:   plannedLabel,},
    { label: 'Busiest day this week', value: isAdmin ? '—' : (busiestDay?.day ?? 'None'), sub:   isAdmin ? 'Admin account' : (busiestDay ? `${busiestDay.count} ${busiestDay.count === 1 ? 'class' : 'classes'}` : 'No classes this week'),},
    { label: 'Free rooms now', value: String(freeCount), sub: `of ${rooms.length} rooms` },
    { label: 'Announcements', value: String(announcements.length), sub: newToday > 0 ? `${newToday} new today` : 'No new today' },
  ]


  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[18px] font-medium text-gray-900">{greeting}</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">{dateLabel}</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3">
            <div className="text-[11px] text-gray-400 mb-1">{s.label}</div>
            <div className="text-[20px] sm:text-[22px] font-medium text-gray-900">{s.value}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">

        {/* Today's classes */}
        <Card>
          <CardHeader
            title="Today's classes"
            action={
              user.role !== 'admin' && (
                <button
                  onClick={() => onNavigate('week')}
                  className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  My week
                </button>
              )
            }
          />
          {isAdmin ? (
            <p className="text-[13px] text-gray-400 italic">Admin accounts do not have assigned classes.</p>
          ) : (
            <TodayClasses schedule={schedule} user={user} />
          )}
        </Card>

        {/* Quick rooms */}
        <Card>
          <CardHeader
            title="Quick room availability"
            action={
              <button
                onClick={() => onNavigate('rooms')}
                className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              >
                All rooms
              </button>
            }
          />
          <div className="flex flex-wrap gap-2 mb-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onNavigate('rooms')}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                  room.free
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400">As of now · tap a room for details</p>
        </Card>
      </div>

      {/* Latest announcement */}
      {latestAnn && (
        <Card>
          <CardHeader
            title="Latest announcement"
            action={
              <button
                onClick={() => onNavigate('announcements')}
                className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              >
                All
              </button>
            }
          />
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-gray-900 mb-1">{latestAnn.title}</div>
              <div className="text-[12px] text-gray-500 leading-relaxed">{latestAnn.body}</div>
            </div>
            {latestAnn.isNew && <Badge variant="amber">Today</Badge>}
          </div>
        </Card>
      )}
    </div>
  )
}

//--------------------- my week component ---------------------

function TodayClasses({ schedule, user }: { schedule: ScheduleEntry[]; user: CurrentUser }) {
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const weekStart = getWeekStart(today)
  const myName    = `${user.firstName} ${user.lastName}`
  const todayName = ALL_DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1]
  const nowHHMM   = `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`

  const items = schedule
    .filter(e =>
      e.teacher === myName &&
      e.day     === todayName &&
      entryOccursInWeek(e, weekStart)
    )
    .sort((a, b) => a.start.localeCompare(b.start))

  if (items.length === 0) {
    return <p className="text-[13px] text-gray-400 italic">No classes today.</p>
  }

  return (
    <div className="divide-y divide-gray-50">
      {items.map(entry => {
        const color      = entry.color ?? '#3b82f6'
        const isLive     = entry.start <= nowHHMM && entry.end > nowHHMM
        const isPast     = entry.end <= nowHHMM

        return (
          <div
            key={entry.id}
            className={`flex items-center gap-3 py-2.5 ${isPast && !isLive ? 'opacity-40' : ''}`}
          >
            <div
              className="w-1 self-stretch rounded-full shrink-0"
              style={{ backgroundColor: isPast && !isLive ? '#d1d5db' : color }}
            />
            <div className="min-w-[80px]">
              <div className="text-[12px] font-medium text-gray-700">{entry.start} – {entry.end}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-gray-900 truncate">{entry.subject}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">📍 {entry.room}</div>
            </div>
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Live
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
