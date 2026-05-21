'use client'

import { CurrentUser } from '@/types'
import Card, { CardHeader } from '@/components/layout/Card'

interface ProfileProps {
  user: CurrentUser
}

export default function Profile({ user }: ProfileProps) {
  return (
    <div>
      <h1 className="text-[18px] font-medium text-gray-900 mb-4">Profile</h1>
      <Card>
        <CardHeader title="Account" />
        <dl className="grid gap-3 text-[13px]">
          <div>
            <dt className="text-[11px] text-gray-400 mb-0.5">Display name</dt>
            <dd className="font-medium text-gray-800">{user.firstName} {user.lastName}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-gray-400 mb-0.5">Role</dt>
            <dd className="font-medium text-gray-800 capitalize">{user.role}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-gray-400 mb-0.5">Subtitle</dt>
            <dd className="text-gray-800">{user.subtitle}</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
