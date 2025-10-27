import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const result = await query('SELECT * FROM potencies ORDER BY sort_order, name');

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('Potencies API error:', error);
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
    const { name, code, potency_type, description, sort_order } = body;

    if (!name || !code || !potency_type) {
      return NextResponse.json({
        success: false,
        error: 'Name, code, and potency_type are required'
      }, { status: 400 });
    }

    // Check if code already exists
    const existing = await query('SELECT id FROM potencies WHERE code = $1', [code]);
    if (existing.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Potency code already exists'
      }, { status: 409 });
    }

    // Insert new potency
    const insertQuery = `
      INSERT INTO potencies (name, code, potency_type, description, sort_order, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING *
    `;

    const result = await query(insertQuery, [name, code, potency_type, description, sort_order || 0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Potency created'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create potency error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
