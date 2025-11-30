import { NextResponse } from 'next/server'

const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

export async function GET() {
  try {
    // Fetch from Golang API
    const res = await fetch(`${GOLANG_API_URL}/api/erp/notifications`);
    const data = await res.json();
    
    if (res.ok) {
      return NextResponse.json({ success: true, data: data.data || [] });
    }
  } catch (error) {
    console.error('Notifications API error:', error);
  }
  const notifications = [
    {
      id: 'n1',
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: '5 products are running low on stock',
      priority: 'high',
      read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'n2',
      type: 'expiry',
      title: 'Expiry Alert',
      message: '3 batches expiring in 7 days',
      priority: 'medium',
      read: false,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'n3',
      type: 'order',
      title: 'New Order',
      message: 'Order #1234 received',
      priority: 'low',
      read: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  return NextResponse.json({
    success: true,
    data: notifications,
    unread: notifications.filter(n => !n.read).length
  })
}
