import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk } from '@/lib/api-response'
import { toCurrentUser } from '@/lib/mappers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user?.email) {
    return jsonError('Unauthorized', 401)
  }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
  if (!dbUser) return jsonError('User not found', 404)

  return jsonOk(toCurrentUser(dbUser))
}
