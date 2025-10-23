import { NextRequest, NextResponse } from 'next/server';

const mockLowStock = [
  { id: 1, product: { id: 4, name: 'Pulsatilla 30C' }, quantity: 15, minStock: 30, status: 'CRITICAL' },
  { id: 2, product: { id: 7, name: 'Bryonia 200C' }, quantity: 35, minStock: 50, status: 'LOW_STOCK' }
];

export async function GET() {
  return NextResponse.json({ success: true, data: mockLowStock, total: mockLowStock.length });
}
