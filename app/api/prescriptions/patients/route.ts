import { NextResponse } from 'next/server'

export async function GET() {
  const patients = [
    { id: 'p1', name: 'Anita Rao', age: 34, phone: '9876500001', lastVisit: '2024-10-06' },
    { id: 'p2', name: 'Rahul Mehta', age: 41, phone: '9876500002', lastVisit: '2024-10-05' },
    { id: 'p3', name: 'Dr. Clinic Account', age: 0, phone: 'NA', lastVisit: null },
  ]
  const summary = {
    total: patients.length,
    withRecentVisit: patients.filter(p => p.lastVisit).length,
  }
  return NextResponse.json({ success: true, data: patients, summary })
}
