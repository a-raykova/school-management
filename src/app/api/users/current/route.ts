import { prisma } from '@/lib/prisma'
import { jsonError, jsonOk } from '@/lib/api-response'
import { toCurrentUser } from '@/lib/mappers'

/** Default demo user: Anna Koeva (seed), overridable via ?email= */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email') ?? 'anna.koeva@intelekti.com'

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    const fallback = await prisma.user.findFirst({
      where: { role: 'TEACHER' },
      orderBy: { id: 'asc' },
    })
    if (!fallback) return jsonError('No users in database', 404)
    return jsonOk(toCurrentUser(fallback))
  }

  return jsonOk(toCurrentUser(user))
}
