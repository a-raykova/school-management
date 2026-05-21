'use client'

import Card, { CardHeader } from '@/components/layout/Card'

export default function Settings() {
  return (
    <div>
      <h1 className="text-[18px] font-medium text-gray-900 mb-4">Settings</h1>
      <Card>
        <CardHeader title="Preferences" />
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Notification and display preferences will appear here once the portal is connected to your
          account backend.
        </p>
      </Card>
    </div>
  )
}
