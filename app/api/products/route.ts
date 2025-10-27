import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = '';
    let params: any[] = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      whereClause += `WHERE category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      const searchCondition = `AND (name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex + 1})`;
      whereClause += whereClause ? searchCondition : `WHERE ${searchCondition.substring(4)}`;
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      params.slice(0, paramIndex - 1)
    );

    // Get products with pagination
    const productsQuery = `
      SELECT * FROM products
      ${whereClause}
      ORDER BY name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await query(productsQuery, params);

    return NextResponse.json({
      success: true,
      products: result.rows,
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < parseInt(countResult.rows[0].total)
      }
    });

  } catch (error: any) {
    console.error('Products API error:', error);
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
    const {
      name,
      sku,
      category,
      brand,
      potency,
      price,
      mrp,
      stock_qty,
      unit,
      description,
      hsn_code,
      tax_rate = 0
    } = body;

    if (!name || !sku || !category || !price) {
      return NextResponse.json({
        success: false,
        error: 'Name, SKU, category, and price are required'
      }, { status: 400 });
    }

    // Check if SKU already exists
    const existing = await query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (existing.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'SKU already exists'
      }, { status: 409 });
    }

    // Insert new product
    const insertQuery = `
      INSERT INTO products (name, sku, category, brand, potency, price, mrp, stock_qty, unit, description, hsn_code, tax_rate, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW(), NOW())
      RETURNING *
    `;

    const result = await query(insertQuery, [
      name, sku, category, brand, potency, price, mrp, stock_qty || 0, unit, description, hsn_code, tax_rate
    ]);

    return NextResponse.json({
      success: true,
      product: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
