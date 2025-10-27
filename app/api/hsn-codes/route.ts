import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const result = await query('SELECT * FROM hsn_codes ORDER BY code');

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('HSN Codes API error:', error);
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
    const { code, description, gst_rate } = body;

    if (!code || !gst_rate) {
      return NextResponse.json({
        success: false,
        error: 'Code and gst_rate are required'
      }, { status: 400 });
    }

    // Check if code already exists
    const existing = await query('SELECT id FROM hsn_codes WHERE code = $1', [code]);
    if (existing.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'HSN code already exists'
      }, { status: 409 });
    }

    // Insert new HSN code
    const insertQuery = `
      INSERT INTO hsn_codes (code, description, gst_rate, is_active, created_at)
      VALUES ($1, $2, $3, true, NOW())
      RETURNING *
    `;

    const result = await query(insertQuery, [code, description, gst_rate]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'HSN Code created'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create HSN code error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
