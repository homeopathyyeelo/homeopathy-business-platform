import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const result = await query('SELECT * FROM categories ORDER BY name');

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('Categories API error:', error);
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
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json({
        success: false,
        error: 'Name and code are required'
      }, { status: 400 });
    }

    // Check if code already exists
    const existing = await query('SELECT id FROM categories WHERE code = $1', [code]);
    if (existing.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Category code already exists'
      }, { status: 409 });
    }

    // Insert new category
    const insertQuery = `
      INSERT INTO categories (name, code, description, is_active, created_at)
      VALUES ($1, $2, $3, true, NOW())
      RETURNING *
    `;

    const result = await query(insertQuery, [name, code, description]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Category created'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
