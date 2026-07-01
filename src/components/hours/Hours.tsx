'use client'

import { useState } from 'react'
import { ScheduleEntry } from '@/types'
import Card, { CardHeader } from '@/components/layout/Card'
import { computeTeacherHours } from '@/utils/hours'

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

/* ─────────────────────────── main component ────────────────────── */

interface HoursProps {
  schedule: ScheduleEntry[]
}

export default function Hours({ schedule }: HoursProps) {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const months = [-2, -1, 0].map(offset => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    return {
      year:  d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('en-GB', { month: 'long' }),
    }
  })

  const [selected, setSelected] = useState(months[2])

  const teachers   = computeTeacherHours(schedule, selected.year, selected.month, today)
  const monthStart = new Date(selected.year, selected.month, 1)
  const monthEnd   = new Date(selected.year, selected.month + 1, 0)
  const isFuture   = monthStart > today
  const isPast     = monthEnd < today
  const isOngoing  = !isFuture && !isPast
  const monthLabel = new Date(selected.year, selected.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const totalWorked  = teachers.reduce((s, t) => s + t.workedHours, 0)
  const totalPlanned = teachers.reduce((s, t) => s + t.plannedHours, 0)
  const topTeacher   = teachers[0]
  const maxHours     = Math.max(teachers.reduce((m, t) => Math.max(m, t.workedHours + t.plannedHours), 0), 1)

  return (
    <div>
      {/* header + month tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-[18px] font-medium text-gray-900">Teaching hours — {monthLabel}</h1>
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

      {/* future month guard */}
      {isFuture ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-500">
          📅 Hours for a future month are not shown — they will appear as the month begins.
        </div>
      ) : (
        <>
          {/* summary cards */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <SummaryCard label="Active teachers" sub="Teaching this month">
              <div className="text-[22px] font-medium text-blue-600">{teachers.length}</div>
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

            {teachers.length === 0 ? (
              <p className="text-[12px] text-gray-400 italic">No classes scheduled this month.</p>
            ) : (
              <div className="space-y-2.5">
                {teachers.map((t) => {
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