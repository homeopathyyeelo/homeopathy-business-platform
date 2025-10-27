import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const result = await query('SELECT * FROM units ORDER BY unit_type, name');

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('Units API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, unit_type, conversion_factor } = body;

    if (!name || !code || !unit_type) {
      return NextResponse.json({
        success: false,
        error: 'Name, code, and unit_type are required'
      }, { status: 400 });
    }

    // Check if code already exists
    const existing = await query('SELECT id FROM units WHERE code = $1', [code]);
    if (existing.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Unit code already exists'
      }, { status: 409 });
    }

    // Insert new unit
    const insertQuery = `
      INSERT INTO units (name, code, unit_type, conversion_factor, is_active, created_at)
      VALUES ($1, $2, $3, $4, true, NOW())
      RETURNING *
    `;

    const result = await query(insertQuery, [
      name,
      code,
      unit_type,
      conversion_factor || 1
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Unit created'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create unit error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
