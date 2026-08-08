'use client'

import Profile from '@/components/profile/Profile'
import { useAppData } from '@/providers/AppDataProvider'

export default function ProfilePage() {
  const { user } = useAppData()

  if (!user) return null

  return <Profile user={user} />
}
