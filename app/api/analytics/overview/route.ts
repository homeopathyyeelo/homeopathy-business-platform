import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const stats = await db.getDashboardStats();
    return NextResponse.json(stats || {
      total_products: 0,
      total_customers: 0,
      total_suppliers: 0,
      monthly_revenue: 0,
      low_stock_count: 0,
      expiring_soon_count: 0
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({
      total_products: 0,
      total_customers: 0,
      total_suppliers: 0,
      monthly_revenue: 0,
      low_stock_count: 0,
      expiring_soon_count: 0,
      error: error.message
    });
  }
}
