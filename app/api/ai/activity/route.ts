import { NextResponse } from 'next/server'

export async function GET() {
  const activities = [
    { 
      id: '1', 
      agent: 'AI Purchase Agent', 
      action: 'Created 3 new PO suggestions based on low stock alerts', 
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(), 
      status: 'completed' as const 
    },    
  ]

  try {
    // Fetch from Golang API
    const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
    const res = await fetch(`${GOLANG_API_URL}/api/erp/ai/activity`);
    const data = await res.json();
    
    if (res.ok) {
      return NextResponse.json({ success: true, data: data.data || activities });
    }
  } catch (error) {
    console.error('AI activity error:', error);
  }

  return NextResponse.json(activities)
}
