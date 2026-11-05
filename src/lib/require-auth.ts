// src/lib/require-auth.ts
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { jsonError } from '@/lib/api-response'
import { ACCOUNT_DEACTIVATED } from '@/constants'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: jsonError('Unauthorized', 401) }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
  if (!dbUser) return { error: jsonError('Unauthorized', 401) }
  if (!dbUser.isActive) return { error: jsonError(ACCOUNT_DEACTIVATED, 403) }

  return { dbUser, error: null }
}