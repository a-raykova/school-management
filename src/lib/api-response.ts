import { NextResponse } from 'next/server'

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

/**
 * Unexpected error: log the details on the server, send only a general message
 * (database errors can reveal table names, queries, etc.).
 */
export function serverError(e: unknown, publicMessage: string) {
  console.error(`[api] ${publicMessage}:`, e)
  return jsonError(publicMessage, 500)
}
