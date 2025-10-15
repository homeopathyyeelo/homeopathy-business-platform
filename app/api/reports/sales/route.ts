import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Use getAll method instead of direct query
    const invoices = await db.getAllInvoices();
    
    // Filter by date if provided
    let filtered = invoices;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = invoices.filter((inv: any) => {
        const invDate = new Date(inv.created_at);
        return invDate >= start && invDate <= end;
      });
    }
    
    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
