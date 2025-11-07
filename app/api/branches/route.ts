import { NextRequest, NextResponse } from 'next/server';

// In-memory store (replace with database in production)
let branches: any[] = [
  {
    id: '1',
    name: 'Main Branch',
    code: 'BR001',
    address: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '9876543310',
    email: 'main@yeelo.com',
    is_head_office: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: branches,
      count: branches.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newBranch = {
      id: String(branches.length + 1),
      ...body,
      is_active: body.is_active ?? true,
      is_head_office: body.is_head_office ?? false,
      created_at: new Date().toISOString(),
    };
    
    branches.push(newBranch);
    
    return NextResponse.json({
      success: true,
      data: newBranch,
      message: 'Branch created successfully',
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create branch' },
      { status: 500 }
    );
  }
}
