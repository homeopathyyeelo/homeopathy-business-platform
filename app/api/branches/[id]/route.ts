import { NextRequest, NextResponse } from 'next/server';

// This would connect to your database in production
let branches: any[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branch = branches.find(b => b.id === params.id);
    
    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: branch,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branch' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const index = branches.findIndex(b => b.id === params.id);
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }
    
    branches[index] = {
      ...branches[index],
      ...body,
      updated_at: new Date().toISOString(),
    };
    
    return NextResponse.json({
      success: true,
      data: branches[index],
      message: 'Branch updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update branch' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const index = branches.findIndex(b => b.id === params.id);
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }
    
    branches.splice(index, 1);
    
    return NextResponse.json({
      success: true,
      message: 'Branch deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete branch' },
      { status: 500 }
    );
  }
}
