import { jsonOk } from '@/lib/api-response'
import { toCurrentUser } from '@/lib/mappers'
import { requireAuth } from '@/lib/require-auth'

export async function GET() {
  const { dbUser, error } = await requireAuth()
  if (error) return error

  return jsonOk(toCurrentUser(dbUser))
}