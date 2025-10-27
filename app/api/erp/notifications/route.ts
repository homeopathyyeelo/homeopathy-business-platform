import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Fetch from database
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
