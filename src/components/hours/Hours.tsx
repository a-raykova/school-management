'use client'

import { useState } from 'react'
import { ScheduleEntry, TeacherOption } from '@/types'
import Card, { CardHeader } from '@/components/layout/Card'
import { computeTeacherHours, computeHonorariums } from '@/utils/hours'

/* ─────────────────────────── sub-components ────────────────────── */

function SummaryCard({
  label,
  children,
  sub,
}: {
  label: string
  children: React.ReactNode
  sub?: string
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3">
      <div className="text-[11px] text-gray-400 mb-1">{label}</div>
      {children}
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

/**
 * A stacked progress bar: confirmed (solid) + projected (hatched/lighter).
 * Both segments are relative to `target`.
 */
function StackedBar({
  workedHours,
  plannedHours,
  maxHours,
}: {
  workedHours:  number
  plannedHours: number
  maxHours:     number
}) {
  const workedPct  = maxHours === 0 ? 0 : (workedHours  / maxHours) * 100
  const plannedPct = maxHours === 0 ? 0 : (plannedHours / maxHours) * 100

  return (
    <div className="flex-1 bg-gray-100 rounded h-2 overflow-hidden flex">
      {workedPct > 0 && (
        <div className="h-full bg-blue-500 transition-all" style={{ width: `${workedPct}%` }} />
      )}
      {plannedPct > 0 && (
        <div
          className="h-full transition-all relative overflow-hidden"
          style={{
            width: `${plannedPct}%`,
            background: `repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)`,
            backgroundColor: 'rgb(96 165 250 / 0.45)',
          }}
        />
      )}
    </div>
  )
}

/* ─────────────────────────── legend ────────────────────────────── */

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-gray-400">
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-2 rounded bg-blue-400" />
        Worked
      </span>
      <span className="flex items-center gap-1">
        <span
          className="inline-block w-3 h-2 rounded"
          style={{
            background: `repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)`,
            backgroundColor: 'rgb(96 165 250 / 0.45)',
          }}
        />
        Planned
      </span>
    </div>
  )
}

/* ─────────────────────────── tab bar ───────────────────────────── */

type HoursTab = 'hours' | 'honorariums'

function TabBar({ active, onChange }: { active: HoursTab; onChange: (t: HoursTab) => void }) {
  const tabCls = (tab: HoursTab) =>
    `px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors ${
      active === tab
        ? 'bg-gray-900 text-white'
        : 'text-gray-500 hover:bg-gray-100'
    }`
  return (
    <div className="flex gap-1 mb-4 bg-gray-50 border border-gray-200 rounded-xl p-1 w-fit">
      <button onClick={() => onChange('hours')} className={tabCls('hours')}>Teaching hours</button>
      <button onClick={() => onChange('honorariums')} className={tabCls('honorariums')}>Honorariums</button>
    </div>
  )
}

/* ─────────────────────────── Honorariums tab ───────────────────── */

function HonorariumsTab({
  schedule,
  teachers,
  selected,
  today,
  onUpdateRate,
}: {
  schedule: ScheduleEntry[]
  teachers: TeacherOption[]
  selected: { year: number; month: number; label: string }
  today: Date
  onUpdateRate: (teacherId: number, rate: number | null) => void
}) {
  const monthStart = new Date(selected.year, selected.month, 1)
  const monthEnd   = new Date(selected.year, selected.month + 1, 0)
  const isPast     = monthEnd < today
  const monthLabel = monthStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const [drafts, setDrafts] = useState<Record<number, string>>({})

  if (!isPast) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-500">
        🗓️ Honorariums for {monthLabel} will be available once the month has fully ended — worked overtime hours are only settled for closed months.
      </div>
    )
  }

  const rows = computeHonorariums(schedule, teachers, selected.year, selected.month, today)
  const grandTotal = rows.reduce((s, r) => s + (r.total ?? 0), 0)
  const missingRateCount = rows.filter(r => r.rate == null).length

  const commitRate = (teacherId: number, raw: string) => {
    const trimmed = raw.trim()
    if (trimmed === '') { onUpdateRate(teacherId, null); return }
    const value = Number(trimmed)
    if (!Number.isFinite(value) || value < 0) return
    onUpdateRate(teacherId, value)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <SummaryCard label="Overtime teachers" sub={`Paid via honorarium — ${monthLabel}`}>
          <div className="text-[22px] font-medium text-blue-600">{rows.length}</div>
        </SummaryCard>
        <SummaryCard label="Total to pay out" sub={monthLabel}>
          <div className="text-[22px] font-medium text-gray-900">{grandTotal.toFixed(2)}€</div>
          {missingRateCount > 0 && (
            <div className="text-[11px] text-amber-600 mt-0.5">{missingRateCount} teacher(s) missing a rate</div>
          )}
        </SummaryCard>
      </div>

      <Card>
        <CardHeader title={`Overtime worked — ${monthLabel}`} />
        {rows.length === 0 ? (
          <p className="text-[12px] text-gray-400 italic">No overtime classes were worked this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                  <th className="pb-2 font-medium">Teacher</th>
                  <th className="pb-2 font-medium">Overtime hours worked</th>
                  <th className="pb-2 font-medium">Rate (€/h)</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(r => (
                  <tr key={r.teacherId}>
                    <td className="py-2.5 text-gray-800 font-medium">{r.name}</td>
                    <td className="py-2.5 text-gray-600">{r.workedOvertimeHours} h</td>
                    <td className="py-2.5">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="—"
                        value={drafts[r.teacherId] ?? (r.rate ?? '')}
                        onChange={e => setDrafts(d => ({ ...d, [r.teacherId]: e.target.value }))}
                        onBlur={e => commitRate(r.teacherId, e.target.value)}
                        className="w-20 px-2 py-1 rounded-lg border border-gray-300 text-[12.5px] focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2.5 text-right font-medium text-gray-900">
                      {r.total == null ? <span className="text-gray-400 font-normal">set rate</span> : `${r.total.toFixed(2)}€`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

/* ─────────────────────────── main component ────────────────────── */

interface HoursProps {
  schedule: ScheduleEntry[]
  teachers: TeacherOption[]
  onUpdateRate: (teacherId: number, rate: number | null) => void
}

export default function Hours({ schedule, teachers, onUpdateRate }: HoursProps) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [tab, setTab] = useState<HoursTab>('hours')

  const months = [-2, -1, 0].map(offset => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    return {
      year:  d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('en-GB', { month: 'long' }),
    }
  })

  const [selected, setSelected] = useState(months[2])

  const teacherHours = computeTeacherHours(schedule, selected.year, selected.month, today)
  const monthStart = new Date(selected.year, selected.month, 1)
  const monthEnd   = new Date(selected.year, selected.month + 1, 0)
  const isFuture   = monthStart > today
  const isPast     = monthEnd < today
  const isOngoing  = !isFuture && !isPast
  const monthLabel = new Date(selected.year, selected.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const totalWorked  = teacherHours.reduce((s, t) => s + t.workedHours, 0)
  const totalPlanned = teacherHours.reduce((s, t) => s + t.plannedHours, 0)
  const topTeacher   = teacherHours[0]
  const maxHours     = Math.max(teacherHours.reduce((m, t) => Math.max(m, t.workedHours + t.plannedHours), 0), 1)

  return (
    <div>
      <TabBar active={tab} onChange={setTab} />

      {/* header + month tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-[18px] font-medium text-gray-900">
          {tab === 'hours' ? 'Teaching hours' : 'Honorariums'} — {monthLabel}
        </h1>
        <div className="flex gap-2">
          {months.map(m => (
            <button
              key={`${m.year}-${m.month}`}
              onClick={() => setSelected(m)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                selected.month === m.month && selected.year === m.year
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'honorariums' ? (
        <HonorariumsTab
          schedule={schedule}
          teachers={teachers}
          selected={selected}
          today={today}
          onUpdateRate={onUpdateRate}
        />
      ) : isFuture ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-500">
          📅 Hours for a future month are not shown — they will appear as the month begins.
        </div>
      ) : (
        <>
          {/* summary cards */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <SummaryCard label="Active teachers" sub="Teaching this month">
              <div className="text-[22px] font-medium text-blue-600">{teacherHours.length}</div>
            </SummaryCard>

            <SummaryCard label="School total" sub="All teachers">
              <div className="text-[22px] font-medium text-gray-900">
                {Math.round((totalWorked + totalPlanned) * 10) / 10} h
              </div>
              {isOngoing && totalPlanned > 0 && (
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {Math.round(totalWorked * 10) / 10} h worked
                </div>
              )}
            </SummaryCard>

            <SummaryCard label="Top teacher">
              <div className="text-[15px] font-medium text-gray-900 mt-1">
                {topTeacher?.name ?? '—'}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {topTeacher
                  ? `${topTeacher.workedHours + topTeacher.plannedHours} h${isOngoing && topTeacher.plannedHours > 0 ? ` (${topTeacher.workedHours} worked)` : ''}`
                  : 'No data'}
              </div>
            </SummaryCard>
          </div>

          {/* bar chart */}
          <Card>
            <CardHeader
              title="All teachers"
              action={isOngoing ? <Legend /> : undefined}
            />

            {teacherHours.length === 0 ? (
              <p className="text-[12px] text-gray-400 italic">No classes scheduled this month.</p>
            ) : (
              <div className="space-y-2.5">
                {teacherHours.map((t) => {
                  const total = t.workedHours + t.plannedHours
                  return (
                    <div key={t.name} className="flex items-center gap-2.5">
                      <div className="text-[12px] min-w-[130px] text-gray-800">{t.name}</div>

                      {isPast ? (
                        <div className="flex-1 bg-gray-100 rounded h-2 overflow-hidden">
                          <div
                            className="h-full rounded transition-all bg-blue-500"
                            style={{ width: `${(total / maxHours) * 100}%` }}
                          />
                        </div>
                      ) : (
                        <StackedBar
                          workedHours={t.workedHours}
                          plannedHours={t.plannedHours}
                          maxHours={maxHours}
                        />
                      )}
                      
                      <div className="text-[12px] text-gray-400 min-w-[80px] text-right">
                        {isPast ? (
                          `${total} h`
                        ) : (
                          <>
                            <span className="text-gray-700">{t.workedHours}</span>
                            {t.plannedHours > 0 && (
                              <span className="text-gray-400"> + {t.plannedHours}</span>
                            )}
                            <span className="text-gray-400"> h</span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* ── ongoing month footnote ── */}
          {isOngoing && (
            <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
              Planned hours reflect remaining scheduled classes and will shift if events are added or removed.
            </p>
          )}
        </>
      )}
    </div>
  )
}