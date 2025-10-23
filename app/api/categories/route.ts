import { NextRequest, NextResponse } from 'next/server';

let categories: any[] = [
  { id: '1', name: 'Dilutions', code: 'CAT001', description: 'Homeopathic Dilutions', is_active: true, created_at: new Date().toISOString() },
  { id: '2', name: 'Mother Tinctures', code: 'CAT002', description: 'Mother Tinctures', is_active: true, created_at: new Date().toISOString() },
  { id: '3', name: 'Biochemic', code: 'CAT003', description: 'Biochemic Medicines', is_active: true, created_at: new Date().toISOString() },
  { id: '4', name: 'Triturations', code: 'CAT004', description: 'Trituration Tablets', is_active: true, created_at: new Date().toISOString() },
];

export async function GET() {
  return NextResponse.json({ success: true, data: categories, count: categories.length });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newCategory = {
      id: String(categories.length + 1),
      ...body,
      is_active: body.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    categories.push(newCategory);
    return NextResponse.json({ success: true, data: newCategory, message: 'Category created' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 });
  }
}
