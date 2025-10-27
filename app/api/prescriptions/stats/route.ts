import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Fetch from database
  const stats = {
    todayPrescriptions: 12,
    weekPrescriptions: 67,
    pendingFollowups: 8,
    avgRating: 4.6,
    topMedicines: [
      { name: 'Arnica 30C', count: 45 },
      { name: 'Belladonna 30C', count: 38 },
      { name: 'Nux Vomica 30C', count: 32 },
      { name: 'Pulsatilla 30C', count: 28 },
      { name: 'Rhus Tox 30C', count: 25 },
    ],
    topDiagnoses: [
      { name: 'Acute Fever', count: 23 },
      { name: 'Cold & Cough', count: 19 },
      { name: 'Digestive Issues', count: 15 },
      { name: 'Joint Pain', count: 12 },
      { name: 'Headache', count: 10 },
    ],
    recentPrescriptions: [
      { id: 'RX-001', date: '2024-10-27', patient: 'Anita Rao', diagnosis: 'Acute Fever', medicineCount: 3, status: 'ACTIVE' },
      { id: 'RX-002', date: '2024-10-27', patient: 'Rahul Mehta', diagnosis: 'Cold & Cough', medicineCount: 2, status: 'ACTIVE' },
      { id: 'RX-003', date: '2024-10-26', patient: 'Priya Sharma', diagnosis: 'Digestive Issues', medicineCount: 2, status: 'COMPLETED' },
    ],
  }

  return NextResponse.json({ success: true, data: stats })
}
