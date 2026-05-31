import { RecurrenceType } from "@/types"

export const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  once:     'Does not repeat',
  weekly:   'Every week',
  biweekly: 'Every 2 weeks',
  monthly:  'Every month (same weekday)',
}

export const inputCls =
  'w-full px-2.5 py-1.5 rounded-lg text-[13px] focus:outline-none transition-colors ' +
  'bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500'
export const labelCls = 'block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1'