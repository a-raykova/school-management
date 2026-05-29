import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { jsonError } from '@/lib/api-response'
 
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: jsonError('Unauthorized', 401) }
 
  const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
  if (!dbUser || dbUser.role !== 'ADMIN') return { error: jsonError('Forbidden', 403) }
 
  return { dbUser, error: null }
}