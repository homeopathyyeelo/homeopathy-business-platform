import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';
import { getUserFromRequest } from '@/lib/auth';
import { parseMargERPCSV, convertMargToStandard, isMargERPFormat } from '@/lib/parsers/marg-erp-parser';

interface PurchaseUploadRow {
  'Invoice Number': string;
  'Invoice Date': string;
  'Supplier Name': string;
  'Supplier GSTIN'?: string;
  'Product Code': string;
  'Product Name': string;
  'Brand': string;
  'Potency'?: string;
  'Size': string;
  'Form': string;
  'HSN Code': string;
  'Batch Number': string;
  'Expiry Date': string;
  'Quantity': string;
  'Unit Price': string;
  'MRP': string;
  'Discount %'?: string;
  'Tax %': string;
  'Total Amount': string;
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
    // Check authentication
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read CSV file
    const fileContent = await file.text();
    let records: PurchaseUploadRow[] = [];

    // Detect format and parse accordingly
    if (isMargERPFormat(fileContent)) {
      // Parse Marg ERP format
      const margInvoices = parseMargERPCSV(fileContent);
      const converted = convertMargToStandard(margInvoices);
      
      // Flatten all items from all invoices
      records = converted.flatMap(inv => inv.items);
      
      console.log(`Detected Marg ERP format: ${converted.length} invoice(s), ${records.length} items`);
    } else {
      // Parse simple CSV format
      records = parseCSV(fileContent) as PurchaseUploadRow[];
      console.log(`Detected simple CSV format: ${records.length} items`);
    }

    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or invalid format' }, { status: 400 });
    }

    // Group by invoice number
    const invoiceGroups = new Map<string, PurchaseUploadRow[]>();
    for (const record of records) {
      const invoiceNo = record['Invoice Number'];
      if (!invoiceGroups.has(invoiceNo)) {
        invoiceGroups.set(invoiceNo, []);
      }
      invoiceGroups.get(invoiceNo)!.push(record);
    }

    // Process each invoice
    const results = [];
    for (const [invoiceNo, items] of invoiceGroups.entries()) {
      const firstItem = items[0];
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => 
        sum + parseFloat(item['Total Amount'] || '0'), 0
      );
      const taxAmount = items.reduce((sum, item) => {
        const qty = parseFloat(item.Quantity || '0');
        const unitPrice = parseFloat(item['Unit Price'] || '0');
        const taxPercent = parseFloat(item['Tax %'] || '0');
        return sum + (qty * unitPrice * taxPercent / 100);
      }, 0);

      // Create upload session
      const sessionResult = await query(
        `INSERT INTO upload_sessions (
          upload_type, file_name, file_size, total_rows, status, uploaded_by,
          supplier_name, invoice_number, invoice_date, total_amount, total_items
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          'purchase', file.name, file.size, items.length, 'processing', user.id,
          firstItem['Supplier Name'], invoiceNo, firstItem['Invoice Date'],
          subtotal, items.length
        ]
      );

      if (sessionResult.rows.length === 0) {
        console.error('Failed to create session');
        continue;
      }
      
      const session = sessionResult.rows[0];

      // Check if vendor exists
      let vendorId = null;
      const vendorResult = await query(
        `SELECT id FROM vendors WHERE name = $1 LIMIT 1`,
        [firstItem['Supplier Name']]
      );
      
      if (vendorResult.rows.length > 0) {
        vendorId = vendorResult.rows[0].id;
      }

      // Create purchase upload record
      const purchaseResult = await query(
        `INSERT INTO purchase_uploads (
          session_id, vendor_id, vendor_name, vendor_gstin,
          invoice_number, invoice_date, subtotal, tax_amount, total_amount, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          session.id, vendorId, firstItem['Supplier Name'],
          firstItem['Supplier GSTIN'] || null, invoiceNo,
          firstItem['Invoice Date'], subtotal, taxAmount, subtotal, 'pending'
        ]
      );

      if (purchaseResult.rows.length === 0) {
        console.error('Failed to create purchase upload');
        continue;
      }

      // Process items
      const uploadItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
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
          }
        }

        const quantity = parseFloat(item.Quantity || '0');
        const unitPrice = parseFloat(item['Unit Price'] || '0');
        const taxPercent = parseFloat(item['Tax %'] || '0');
        const discountPercent = parseFloat(item['Discount %'] || '0');
        const taxAmount = (quantity * unitPrice * taxPercent) / 100;
        const discountAmount = (quantity * unitPrice * discountPercent) / 100;
        const totalAmount = (quantity * unitPrice) + taxAmount - discountAmount;

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
          hsn_code: item['HSN Code'],
          batch_number: item['Batch Number'],
          expiry_date: item['Expiry Date'],
          quantity: quantity,
          unit_price: unitPrice,
          mrp: parseFloat(item.MRP || '0'),
          discount_percent: discountPercent,
          discount_amount: discountAmount,
          tax_percent: taxPercent,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          matched_product_id: matchedProductId,
          match_type: matchType,
          match_confidence: matchConfidence,
          validation_errors: matchedProductId ? null : { product: 'Product not found in database' },
          raw_data: item,
        });
      }

      // Bulk insert items
      for (const uploadItem of uploadItems) {
        await query(
          `INSERT INTO upload_items (
            session_id, row_number, status, product_code, product_name,
            brand, potency, size, form, hsn_code, batch_number, expiry_date,
            quantity, unit_price, mrp, discount_percent, discount_amount,
            tax_percent, tax_amount, total_amount, matched_product_id,
            match_type, match_confidence, validation_errors, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
          [
            uploadItem.session_id, uploadItem.row_number, uploadItem.status,
            uploadItem.product_code, uploadItem.product_name, uploadItem.brand,
            uploadItem.potency, uploadItem.size, uploadItem.form, uploadItem.hsn_code,
            uploadItem.batch_number, uploadItem.expiry_date, uploadItem.quantity,
            uploadItem.unit_price, uploadItem.mrp, uploadItem.discount_percent,
            uploadItem.discount_amount, uploadItem.tax_percent, uploadItem.tax_amount,
            uploadItem.total_amount, uploadItem.matched_product_id, uploadItem.match_type,
            uploadItem.match_confidence, uploadItem.validation_errors ? JSON.stringify(uploadItem.validation_errors) : null,
            JSON.stringify(uploadItem.raw_data)
          ]
        );
      }

      // Update session status to awaiting approval
      await query(
        `UPDATE upload_sessions SET status = $1, processed_rows = $2 WHERE id = $3`,
        ['awaiting_approval', items.length, session.id]
      );

      results.push({
        sessionId: session.id,
        invoiceNumber: invoiceNo,
        itemCount: items.length,
        matchedCount: uploadItems.filter(i => i.matched_product_id).length,
        unmatchedCount: uploadItems.filter(i => !i.matched_product_id).length,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} invoice(s)`,
      results,
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
    const type = searchParams.get('type') || 'purchase';
    const status = searchParams.get('status');

    let queryText = `
      SELECT * FROM upload_sessions
      WHERE upload_type = $1
    `;
    const params: any[] = [type];

    if (status) {
      queryText += ` AND approval_status = $2`;
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
