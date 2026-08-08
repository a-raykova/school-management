'use client'

import Payments from '@/components/payments/Payments'
import RoleGuard from '@/components/layout/RoleGuard'
import { useAppData } from '@/providers/AppDataProvider'

export default function PaymentsPage() {
  const {
    students,
    payments,
    fees,
    handleLogPayment,
    handleAddFee,
  } = useAppData()

  return (
    <RoleGuard allow="admin">
      <Payments
        students={students}
        payments={payments}
        fees={fees}
        onLogPayment={handleLogPayment}
        onAddFee={handleAddFee}
      />
    </RoleGuard>
  )
}
