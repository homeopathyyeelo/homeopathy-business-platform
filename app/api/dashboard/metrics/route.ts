import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Fetch real metrics from database
  const metrics = {
    openBugs: 3,
    activeServices: 4,
    aiTasks: 2,
    inventorySync: '2m ago',
    salesToday: 45230,
    systemLoad: 42,
  }

  return NextResponse.json(metrics)
}
