import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Fetch from ai_tasks table
  const activities = [
    { 
      id: '1', 
      agent: 'AI Purchase Agent', 
      action: 'Created 3 new PO suggestions based on low stock alerts', 
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(), 
      status: 'completed' as const 
    },
    { 
      id: '2', 
      agent: 'AI Bug-Fix Agent', 
      action: 'Analyzed validation error in /api/purchases/upload', 
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(), 
      status: 'running' as const 
    },
    { 
      id: '3', 
      agent: 'AI Analytics Agent', 
      action: 'Recalculated daily KPIs and sales forecasts', 
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(), 
      status: 'completed' as const 
    },
    { 
      id: '4', 
      agent: 'AI Enrichment Agent', 
      action: 'Enriched 15 invoice lines with product matches', 
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(), 
      status: 'completed' as const 
    },
  ]

  return NextResponse.json(activities)
}
