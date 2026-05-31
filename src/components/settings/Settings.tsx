'use client'

import Card, { CardHeader } from '@/components/layout/Card'
import { useState } from 'react'

export default function Settings() {
  const [emailNotifs, setEmailNotifs] = useState(true)

  return (
    <div>
      <h1 className="text-[18px] font-medium text-gray-900 mb-4">Settings</h1>

      <div className="space-y-3">
        <Card>
          <CardHeader title="Notifications" />
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-[13px] text-gray-800">Email notifications</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Receive schedule changes and announcements by email</div>
            </div>
            <button
              onClick={() => setEmailNotifs(v => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${emailNotifs ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${emailNotifs ? 'translate-x-4' : ''}`} />
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader title="About" />
          <dl className="grid gap-2 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-gray-400">App</dt>
              <dd className="text-gray-700">ИнтелектИ Portal</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Version</dt>
              <dd className="text-gray-700">1.0.0</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  )
}