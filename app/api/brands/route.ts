import { NextRequest, NextResponse } from 'next/server';

let brands: any[] = [
  { id: '1', name: 'SBL', code: 'BRD001', description: 'SBL Pvt Ltd', country: 'India', is_active: true, created_at: new Date().toISOString() },
  { id: '2', name: 'Dr. Reckeweg', code: 'BRD002', description: 'Dr. Reckeweg Germany', country: 'Germany', is_active: true, created_at: new Date().toISOString() },
  { id: '3', name: 'Willmar Schwabe', code: 'BRD003', description: 'Willmar Schwabe India', country: 'India', is_active: true, created_at: new Date().toISOString() },
  { id: '4', name: 'BJain', code: 'BRD004', description: 'B Jain Publishers', country: 'India', is_active: true, created_at: new Date().toISOString() },
];

export async function GET() {
  return NextResponse.json({ success: true, data: brands, count: brands.length });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newBrand = {
      id: String(brands.length + 1),
      ...body,
      is_active: body.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    brands.push(newBrand);
    return NextResponse.json({ success: true, data: newBrand, message: 'Brand created' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create brand' }, { status: 500 });
  }
}
