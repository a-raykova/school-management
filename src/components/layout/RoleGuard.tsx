'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAppData } from '@/providers/AppDataProvider'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  allow: UserRole | UserRole[]
  children: ReactNode
}

function isRoleAllowed(role: UserRole, allow: UserRole | UserRole[]): boolean {
  return Array.isArray(allow) ? allow.includes(role) : role === allow
}

export default function RoleGuard({ allow, children }: RoleGuardProps) {
  const { user, loading } = useAppData()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && !isRoleAllowed(user.role, allow)) {
      router.replace('/')
    }
  }, [loading, user, allow, router])

  if (loading || !user || !isRoleAllowed(user.role, allow)) return null

  return <>{children}</>
}
