import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

const TABLE_NAME = 'prescriptions';
const ID_PREFIX = 'RX';

// GET all records
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');
    
    const conditions: Record<string, any> = {};
    if (isActive !== null) {
      conditions.is_active = isActive === 'true';
    }
    
    const records = await db.getAll(TABLE_NAME, Object.keys(conditions).length > 0 ? conditions : undefined);
    
    return NextResponse.json(records, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching ${TABLE_NAME}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${TABLE_NAME}`, message: error.message },
      { status: 500 }
    );
  }
}

// POST create new record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newRecord = await db.insert(TABLE_NAME, body);
    
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error(`Error creating ${TABLE_NAME}:`, error);
    return NextResponse.json(
      { error: `Failed to create ${TABLE_NAME}`, message: error.message },
      { status: 500 }
    );
  }
}

// PUT update record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const updatedRecord = await db.update(TABLE_NAME, id, updateData);
    
    return NextResponse.json(updatedRecord, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating ${TABLE_NAME}:`, error);
    return NextResponse.json(
      { error: `Failed to update ${TABLE_NAME}`, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE record
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const deletedRecord = await db.delete(TABLE_NAME, id);
    
    return NextResponse.json(deletedRecord, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting ${TABLE_NAME}:`, error);
    return NextResponse.json(
      { error: `Failed to delete ${TABLE_NAME}`, message: error.message },
      { status: 500 }
    );
  }
}
