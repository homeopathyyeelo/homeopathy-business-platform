import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const result = await query('SELECT * FROM forms ORDER BY sort_order, name');

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('Forms API error:', error);
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
    const { name, code, form_type, description, is_prescription_required, sort_order } = body;

    if (!name || !code || !form_type) {
      return NextResponse.json({
        success: false,
        error: 'Name, code, and form_type are required'
      }, { status: 400 });
    }

    // Check if code already exists
    const existing = await query('SELECT id FROM forms WHERE code = $1', [code]);
    if (existing.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Form code already exists'
      }, { status: 409 });
    }

    // Insert new form
    const insertQuery = `
      INSERT INTO forms (name, code, form_type, description, is_prescription_required, sort_order, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
      RETURNING *
    `;

    const result = await query(insertQuery, [
      name,
      code,
      form_type,
      description,
      is_prescription_required || false,
      sort_order || 0
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Form created'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create form error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
