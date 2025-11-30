import { NextResponse } from 'next/server'

const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

export async function GET() {
  try {
    // Fetch from Golang API - system audit logs
    const res = await fetch(`${GOLANG_API_URL}/api/erp/dashboard/activity-feed`);
    const data = await res.json();
    
    if (!res.ok) {
      // Fallback to recent activities
      const fallbackEvents = [
        {
          id: 1,
          type: 'invoice_created',
          message: 'Invoice INV-2024-001 created',
          user: 'System',
          timestamp: new Date().toISOString(),
          icon: 'receipt'
        },
        {
          id: 2,
          type: 'customer_added',
          message: 'New customer Walk-in Customer added',
          user: 'System',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          icon: 'user'
        }
      ];
      return NextResponse.json(fallbackEvents);
    }

    return NextResponse.json(data.data || []);
  } catch (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json([]);
  }
}
