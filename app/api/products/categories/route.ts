import { NextRequest, NextResponse } from 'next/server';

// Mock categories data
const mockCategories = [
  { id: 1, name: 'Dilution', description: 'Homeopathic dilutions', count: 150 },
  { id: 2, name: 'Mother Tincture', description: 'Mother tinctures (Q potency)', count: 80 },
  { id: 3, name: 'Biochemic', description: 'Biochemic tablets', count: 45 },
  { id: 4, name: 'Ointment', description: 'External applications', count: 30 },
  { id: 5, name: 'Drops', description: 'Liquid drops', count: 25 },
  { id: 6, name: 'Tablets', description: 'Homeopathic tablets', count: 60 }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: mockCategories,
    categories: mockCategories,
    total: mockCategories.length
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newCategory = {
      id: mockCategories.length + 1,
      ...body,
      count: 0
    };
    mockCategories.push(newCategory);
    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
