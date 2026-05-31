'use client'

import { CurrentUser } from '@/types'
import Card, { CardHeader } from '@/components/layout/Card'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface ProfileProps {
  user: CurrentUser
}

export default function Profile({ user }: ProfileProps) {
  const supabase = createClient()
  const [sent, setSent] = useState(false)

  const handlePasswordReset = async () => {
    await supabase.auth.resetPasswordForEmail(user.email)
    setSent(true)
  }

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
            <dt className="text-[11px] text-gray-400 mb-0.5">Email</dt>
            <dd className="text-gray-800">{user.email}</dd>
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
        {/* <div className="mt-4 pt-4 border-t border-gray-100">
          {sent ? (
            <p className="text-[12px] text-emerald-600">Password reset email sent — check your inbox.</p>
          ) : (
            <button
              onClick={handlePasswordReset}
              className="text-[12px] px-3.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Reset password
            </button>
          )}
        </div> */}
      </Card>
    </div>
  )
}