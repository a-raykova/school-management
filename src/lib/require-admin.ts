import { requireAuth } from '@/lib/require-auth'
import { jsonError } from '@/lib/api-response'

export async function requireAdmin() {
  const { dbUser, error } = await requireAuth()
  if (error) return { error }

  if (dbUser.role !== 'ADMIN') return { error: jsonError('Forbidden', 403) }

  return { dbUser, error: null }
}