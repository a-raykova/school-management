'use client'

import Announcements from '@/components/announcements/Announcements'
import { useAppData } from '@/providers/AppDataProvider'

export default function AnnouncementsPage() {
  const { announcements, user, handlePostAnnouncement } = useAppData()

  if (!user) return null

  return (
    <Announcements
      announcements={announcements}
      onPost={handlePostAnnouncement}
      user={user}
    />
  )
}
