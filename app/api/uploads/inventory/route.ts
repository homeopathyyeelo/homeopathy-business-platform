import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getUserFromRequest } from '@/lib/auth';

interface InventoryUploadRow {
  'Product Code': string;
  'Product Name': string;
  'Brand': string;
  'Potency'?: string;
  'Size': string;
  'Form': string;
  'Batch Number': string;
  'Expiry Date': string;
  'Quantity': string;
  'Cost Price': string;
  'Selling Price': string;
  'MRP': string;
  'Warehouse'?: string;
  'Location'?: string;
  'Rack Number'?: string;
}

// Simple CSV parser
function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const record: any = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }
  
  return records;
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileContent = await file.text();
    const records = parseCSV(fileContent) as InventoryUploadRow[];

    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Create upload session
    const sessionResult = await query(
      `INSERT INTO upload_sessions (
        upload_type, file_name, file_size, total_rows, status, uploaded_by,
        total_items
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      ['inventory', file.name, file.size, records.length, 'processing', user.id, records.length]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
    
    const session = sessionResult.rows[0];

    // Process items
    const uploadItems = [];
    let matchedCount = 0;
    let unmatchedCount = 0;

    for (let i = 0; i < records.length; i++) {
      const item = records[i];
      
      // Try to match product
      let matchedProductId = null;
      let matchType = null;
      let matchConfidence = 0;

      // First try exact SKU match
      const productResult = await query(
        `SELECT id FROM products WHERE sku = $1 LIMIT 1`,
        [item['Product Code']]
      );

      if (productResult.rows.length > 0) {
        matchedProductId = productResult.rows[0].id;
        matchType = 'exact';
        matchConfidence = 1.0;
        matchedCount++;
      } else {
        // Try fuzzy name match
        const fuzzyResult = await query(
          `SELECT id, name FROM products WHERE name ILIKE $1 LIMIT 1`,
          [`%${item['Product Name']}%`]
        );

        if (fuzzyResult.rows.length > 0) {
          matchedProductId = fuzzyResult.rows[0].id;
          matchType = 'fuzzy';
          matchConfidence = 0.7;
          matchedCount++;
        } else {
          unmatchedCount++;
        }
      }

      const quantity = parseFloat(item.Quantity || '0');
      const costPrice = parseFloat(item['Cost Price'] || '0');
      const sellingPrice = parseFloat(item['Selling Price'] || '0');
      const mrp = parseFloat(item.MRP || '0');

      uploadItems.push({
        session_id: session.id,
        row_number: i + 1,
        status: matchedProductId ? 'validated' : 'pending',
        product_code: item['Product Code'],
        product_name: item['Product Name'],
        brand: item.Brand,
        potency: item.Potency || null,
        size: item.Size,
        form: item.Form,
        batch_number: item['Batch Number'],
        expiry_date: item['Expiry Date'],
        quantity: quantity,
        unit_price: costPrice,
        mrp: mrp,
        matched_product_id: matchedProductId,
        match_type: matchType,
        match_confidence: matchConfidence,
        validation_errors: matchedProductId ? null : { product: 'Product not found in database' },
        raw_data: item,
      });

      // Also insert into inventory_uploads table
      await query(
        `INSERT INTO inventory_uploads (
          session_id, product_id, product_code, product_name,
          batch_number, expiry_date, quantity, cost_price, selling_price, mrp,
          warehouse_id, location, rack_number, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          session.id, matchedProductId, item['Product Code'], item['Product Name'],
          item['Batch Number'], item['Expiry Date'], quantity, costPrice,
          sellingPrice, mrp, null, item.Location || null, item['Rack Number'] || null,
          'pending'
        ]
      );
    }

    // Insert upload items
    for (const uploadItem of uploadItems) {
      await query(
        `INSERT INTO upload_items (
          session_id, row_number, status, product_code, product_name,
          brand, potency, size, form, batch_number, expiry_date,
          quantity, unit_price, mrp, matched_product_id,
          match_type, match_confidence, validation_errors, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          uploadItem.session_id, uploadItem.row_number, uploadItem.status,
          uploadItem.product_code, uploadItem.product_name, uploadItem.brand,
          uploadItem.potency, uploadItem.size, uploadItem.form,
          uploadItem.batch_number, uploadItem.expiry_date, uploadItem.quantity,
          uploadItem.unit_price, uploadItem.mrp, uploadItem.matched_product_id,
          uploadItem.match_type, uploadItem.match_confidence,
          uploadItem.validation_errors ? JSON.stringify(uploadItem.validation_errors) : null,
          JSON.stringify(uploadItem.raw_data)
        ]
      );
    }

    // Update session status to awaiting approval
    await query(
      `UPDATE upload_sessions SET status = $1, processed_rows = $2 WHERE id = $3`,
      ['awaiting_approval', records.length, session.id]
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${records.length} inventory item(s)`,
      sessionId: session.id,
      itemCount: records.length,
      matchedCount,
      unmatchedCount,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process upload' },
      { status: 500 }
    );
  }
}

// GET: Fetch upload sessions
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let queryText = `
      SELECT * FROM upload_sessions
      WHERE upload_type = 'inventory'
    `;
    const params: any[] = [];

    if (status) {
      queryText += ` AND approval_status = $1`;
      params.push(status);
    }

    queryText += ` ORDER BY created_at DESC`;

    const result = await query(queryText, params);

    return NextResponse.json({ sessions: result.rows });

  } catch (error: any) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch uploads' },
      { status: 500 }
    );
  }
}
