import { NextRequest, NextResponse } from 'next/server'

const commissions = [
  { id: 'COM-001', salesperson: 'Ramesh Sharma', period: 'Oct 2024', sales: 150000, rate: 2.5, amount: 3750, status: 'PENDING' },
  { id: 'COM-002', salesperson: 'Priya Patel', period: 'Oct 2024', sales: 200000, rate: 3.0, amount: 6000, status: 'PENDING' },
  { id: 'COM-003', salesperson: 'Amit Kumar', period: 'Sep 2024', sales: 180000, rate: 2.5, amount: 4500, status: 'PAID' },
]

export async function GET() {
  const summary = {
    total: commissions.length,
    pending: commissions.filter(c => c.status === 'PENDING').length,
    totalPending: commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0),
    totalPaid: commissions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0),
  }
  return NextResponse.json({ success: true, data: commissions, summary })
}
