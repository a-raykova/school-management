'use client'

import { useState } from 'react'
import { Room } from '@/types'
import Badge from '@/components/layout/Badge'

interface RoomsProps {
  rooms: Room[]
}

type RoomFilter = 'all' | 'free' | 'occupied'

const filters: { value: RoomFilter; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'free',     label: 'Free' },
  { value: 'occupied', label: 'In use' },
]

export default function Rooms({ rooms }: RoomsProps) {
  const [filter, setFilter] = useState<RoomFilter>('all')

  const filtered =
    filter === 'all'      ? rooms :
    filter === 'free'     ? rooms.filter((r) => r.free) :
                            rooms.filter((r) => !r.free)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-[18px] font-medium text-gray-900">Rooms</h1>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] text-gray-400 mr-1">Filter:</span>
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-[12px] border transition-colors ${
                filter === f.value
                  ? 'bg-blue-50 text-blue-700 border-transparent font-medium'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filtered.map((room) => (
          <div
            key={room.id}
            className={`bg-white rounded-xl p-3.5 cursor-pointer transition-colors hover:border-gray-300 border border-gray-100 ${
              room.free
                ? 'border-l-[3px] !border-l-emerald-500'
                : 'border-l-[3px] !border-l-red-500'
            }`}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="text-[13px] font-medium text-gray-900">{room.name}</div>
              <Badge variant={room.free ? 'green' : 'red'}>
                {room.free ? 'Free' : 'In use'}
              </Badge>
            </div>
            <div className="text-[11px] text-gray-500">
              {room.free ? 'Available now' : room.subject}
            </div>
            {!room.free && room.teacher && (
              <div className="text-[11px] text-gray-400 mt-1.5 pt-1.5 border-t border-gray-50">
                {room.teacher} · {room.time}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}