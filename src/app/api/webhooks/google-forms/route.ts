import { prisma } from '@/lib/prisma'
import { timingSafeEqual } from 'node:crypto'
import { jsonError, jsonOk, parseJsonBody } from '@/lib/api-response'
import type { PaymentMethod, PaymentSchedule } from '@/generated/prisma/client'

//The Google Form sends free-text labels so we need to normalise them into the exact enum values the database accepts
//unrecognised things fall back to the safe defaults (CASH / FULL)
function toPaymentMethod(value: string | undefined): PaymentMethod {
  const normalized = (value ?? '').toLowerCase().replace(/[\s_-]/g, '')
  return normalized === 'banktransfer' || normalized === 'bank'
    ? 'BANK_TRANSFER'
    : 'CASH'
}

function toPaymentSchedule(value: string | undefined): PaymentSchedule {
  return (value ?? '').toLowerCase() === 'split' ? 'SPLIT' : 'FULL'
}

/** compares secrets in constant time, so the secret can't be guessed by timing */
function secretMatches(given: string | null, expected: string | undefined): boolean {
  if (!given || !expected) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
    if (!secretMatches(request.headers.get('x-webhook-secret'), process.env.WEBHOOK_SECRET)) {
    return jsonError('Unauthorized', 401)
  }

  const body = await parseJsonBody<{
    parentFullName: string
    parentPhone: string
    childFullName: string
    paymentMethod: string
    paymentSchedule: string
  }>(request)

  if (!body?.parentFullName || !body?.childFullName) {
    return jsonError('Missing required fields')
  }

  // keep junk out of the database
  const tooLong = [body.parentFullName, body.childFullName, body.parentPhone]
    .some((v) => typeof v === 'string' && v.length > 200)
  if (tooLong) return jsonError('A field is too long')

  const student = await prisma.student.create({
    data: {
      parentFullName:  body.parentFullName,
      parentPhone:     body.parentPhone ?? '',
      childFullName:   body.childFullName,
      paymentMethod:   toPaymentMethod(body.paymentMethod),
      paymentSchedule: toPaymentSchedule(body.paymentSchedule),
    },
  })

  return jsonOk(student, 201)
}