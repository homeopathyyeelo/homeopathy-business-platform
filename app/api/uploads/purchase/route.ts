import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';
import { parseMargERPCSV, convertMargToStandard, isMargERPFormat } from '@/lib/parsers/marg-erp-parser';
import type { PoolClient } from 'pg';

interface PurchaseUploadRow {
  'Invoice Number': string;
  'Invoice Date': string;
  'Supplier Name': string;
  'Supplier GSTIN'?: string;
  'Product Code': string;
  'Product Name': string;
  'Brand': string;
  'Potency'?: string;
  'Size'?: string;
  'Form'?: string;
  'Unit'?: string;
  'HSN Code'?: string;
  'Batch Number'?: string;
  'Expiry Date'?: string;
  'Quantity': string;
  'Unit Price': string;
  'MRP'?: string;
  'Discount %'?: string;
  'Discount Amount'?: string;
  'Tax %'?: string;
  'Tax Amount'?: string;
  'Total Amount'?: string;
}

// Marg ERP format parser
function parseMargERPFormat(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const records = [];
  let headerInfo = null;
  
  for (const line of lines) {
    const rowType = line.charAt(0);
    
    if (rowType === 'H') {
      // Parse header row to get invoice info
      const fields = line.split(',');
      headerInfo = {
        invoiceNumber: fields[2] || '',
        invoiceDate: formatDate(fields[3] || ''),
        supplierName: fields[31] || '',
        supplierGSTIN: fields[32] || ''
      };
    } else if (rowType === 'T') {
      // Parse transaction row for product details
      const fields = line.split(',');
      if (fields.length >= 20) {
        const record: any = {
          'Invoice Number': headerInfo?.invoiceNumber || '',
          'Invoice Date': headerInfo?.invoiceDate || '',
          'Supplier Name': headerInfo?.supplierName || '',
          'Supplier GSTIN': headerInfo?.supplierGSTIN || '',
          'Product Code': fields[3] || '', // Item code (field 3)
          'Product Name': fields[5] || '', // Product name (field 5)
          'Brand': fields[2] || '', // Brand/Category (field 2)
          'Potency': extractPotency(fields[5] || ''), // Extract from name
          'Size': fields[6] || '', // Size (field 6)
          'Form': extractForm(fields[5] || ''), // Extract from name (field 5)
          'Unit': extractUnit(fields[6] || fields[5] || ''), // Extract from size or name
          'HSN Code': fields[36] || '', // HSN code from field 36
          'Batch Number': fields[8] || '', // Batch number
          'Expiry Date': formatDate(fields[9] || ''), // Expiry date (if valid date)
          'Quantity': fields[20] || '0', // Quantity (field 20)
          'Unit Price': calculateUnitPrice(fields[14], fields[22]), // Calculate from MRP and Discount%
          'MRP': fields[14] || '0', // MRP (field 14)
          'Discount %': fields[22] || '0', // Discount percentage (field 22)
          'Discount Amount': calculateTotalDiscount(fields[20], fields[14], fields[22], fields[24], fields[27]), // Calculate from all discounts  
          'Tax %': fields[12] || '0', // Tax percentage (field 12)
          'Tax Amount': fields[26] || '0', // Tax amount (field 26)
          'Total Amount': fields[25] || '0' // Taxable amount (field 25)
        };
        records.push(record);
      }
    }
  }
  
  return records;
}

// Calculate unit price from MRP and discount percentage
function calculateUnitPrice(mrp: string, discountPercent: string): string {
  const mrpPrice = parseFloat(mrp) || 0;
  const discount = parseFloat(discountPercent) || 0;
  
  // Calculate: Rate = MRP × (100 - Discount%) / 100
  const unitPrice = mrpPrice * (100 - discount) / 100;
  
  return unitPrice.toFixed(2);
}

// Calculate total discount amount (Main discount + Spl% + SPL2)
function calculateTotalDiscount(qty: string, mrp: string, discountPercent: string, splPercent: string, spl2: string): string {
  const quantity = parseFloat(qty) || 0;
  const mrpPrice = parseFloat(mrp) || 0;
  const discount = parseFloat(discountPercent) || 0;
  const spl = parseFloat(splPercent) || 0;
  const spl2Discount = parseFloat(spl2) || 0;
  
  // Main discount amount per unit: MRP × Discount% / 100
  const mainDiscountPerUnit = mrpPrice * discount / 100;
  
  // Total main discount
  const totalMainDiscount = quantity * mainDiscountPerUnit;
  
  // Total Spl% discount
  const totalSplDiscount = quantity * spl;
  
  // Total SPL2 discount
  const totalSpl2Discount = quantity * spl2Discount;
  
  // Total discount
  const totalDiscount = totalMainDiscount + totalSplDiscount + totalSpl2Discount;
  
  return totalDiscount.toFixed(2);
}

// Helper functions to extract product details from name
function extractPotency(name: string): string {
  // Handle specific patterns like "SBL DILUTION 200" -> "200"
  // or "DILUTION 30" -> "30", "DILUTION 1M" -> "1M"
  const match = name.match(/(?:DILUTION|MOTHER TIN)\s+(\d+[CXM]?|\d+[C][H]?|[A-Z]+\d+)/i);
  if (match) return match[1];
  
  // Fallback to general pattern
  const generalMatch = name.match(/(\d+[CXM]?|\d+[C][H]?|[A-Z]+\d+)/i);
  return generalMatch ? generalMatch[1] : '';
}

function extractSize(name: string): string {
  const match = name.match(/(\d+(?:\.\d+)?[M]?[L])/i);
  return match ? match[1] : '';
}

function extractForm(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('dilution')) return 'Dilution';
  if (lowerName.includes('mother tinc') || lowerName.includes('mother tin') || lowerName.includes(' q')) return 'Mother Tincture';
  if (lowerName.includes('drop')) return 'Drops';
  if (lowerName.includes('syrup') || lowerName.includes('syp')) return 'Syrup';
  if (lowerName.includes('spray')) return 'Spray';
  if (lowerName.includes('pomade')) return 'Pomade';
  if (lowerName.includes('ointment') || lowerName.includes('cream')) return 'Ointment';
  return 'Liquid';
}

function extractUnit(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('ml')) return 'ml';
  if (lowerName.includes('gm') || lowerName.includes('g')) return 'gm';
  if (lowerName.includes('tabs') || lowerName.includes('tablet')) return 'tabs';
  return 'ml';
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === '00000000') return '';
  // Handle DDMMYYYY format
  if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
    const day = dateStr.substring(0, 2);
    const month = dateStr.substring(2, 4);
    const year = dateStr.substring(4, 8);
    // Validate year, month, day
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    if (yearNum >= 2000 && yearNum <= 2100 && monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${year}-${month}-${day}`;
    }
  }
  // If not a valid date format, return empty string
  return '';
}

// Simple CSV parser for standard format
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

// Helper functions for auto-creating entities
async function getOrCreateBrand(req: NextRequest, brandName: string): Promise<string | null> {
  if (!brandName || brandName.trim() === '') return null;
  
  const existingResult = await query(
    `SELECT id FROM brands WHERE name = $1 LIMIT 1`,
    [brandName.trim()]
  );
  
  if (existingResult.rows.length > 0) {
    return existingResult.rows[0].id;
  }
  
  // Generate unique code
  const baseCode = brandName.toUpperCase().replace(/\s+/g, '_').substring(0, 50);
  const timestamp = Date.now().toString().slice(-6);
  const uniqueCode = `${baseCode}_${timestamp}`;
  
  const newResult = await query(
    `INSERT INTO brands (name, code, description, is_active) VALUES ($1, $2, $3, true) RETURNING id`,
    [brandName.trim(), uniqueCode, `Auto-created brand for ${brandName}`]
  );
  
  return newResult.rows[0].id;
}

async function getOrCreateCategory(req: NextRequest, categoryName: string): Promise<string | null> {
  if (!categoryName || categoryName.trim() === '') return null;
  
  const existingResult = await query(
    `SELECT id FROM categories WHERE name = $1 LIMIT 1`,
    [categoryName.trim()]
  );
  
  if (existingResult.rows.length > 0) {
    return existingResult.rows[0].id;
  }
  
  // Generate unique code
  const baseCode = categoryName.toUpperCase().replace(/\s+/g, '_').substring(0, 50);
  const timestamp = Date.now().toString().slice(-6);
  const uniqueCode = `${baseCode}_${timestamp}`;
  
  const newResult = await query(
    `INSERT INTO categories (name, code, description, is_active) VALUES ($1, $2, $3, true) RETURNING id`,
    [categoryName.trim(), uniqueCode, `Auto-created category for ${categoryName}`]
  );
  
  return newResult.rows[0].id;
}

async function getOrCreateHSNCode(req: NextRequest, hsnCode: string, gstRate: number): Promise<string> {
  if (!hsnCode) hsnCode = '30049014'; // Default HSN for homeopathic medicines
  
  const existingResult = await query(
    `SELECT id FROM hsn_codes WHERE code = $1 LIMIT 1`,
    [hsnCode]
  );
  
  if (existingResult.rows.length > 0) {
    return existingResult.rows[0].id;
  }
  
  const newResult = await query(
    `INSERT INTO hsn_codes (code, description, gst_rate, is_active) VALUES ($1, $2, $3, true) RETURNING id`,
    [hsnCode, `Auto-created HSN code for ${hsnCode}`, gstRate]
  );
  
  return newResult.rows[0].id;
}

function determineHSNCode(productName: string, form?: string): { hsn: string; gstRate: number } {
  const name = (productName || '').toLowerCase();
  const formType = (form || '').toLowerCase();
  
  // Cosmetic items (18% GST)
  if (name.includes('shampoo') || name.includes('soap') || name.includes('toothpaste') || 
      name.includes('facewash') || name.includes('hair oil') || name.includes('lotion') ||
      name.includes('cream') && !name.includes('medicinal') || name.includes('cosmetic') ||
      name.includes('deodorant') || name.includes('beauty')) {
    return { hsn: '330499', gstRate: 18 };
  }
  
  // Default homeopathic medicines (5% GST)
  return { hsn: '30049014', gstRate: 5 };
}

function determineCategory(productName: string, form?: string): string {
  const name = (productName || '').toLowerCase();
  const formType = (form || '').toLowerCase();
  
  // Determine category based on form and name
  if (formType.includes('tablet') || name.includes('tablet')) return 'Tablets';
  if (formType.includes('dilution') || name.includes('dilution')) return 'Dilutions';
  if (formType.includes('mother tincture') || name.includes('q') || name.includes('mt')) return 'Mother Tinctures';
  if (formType.includes('ointment') || name.includes('ointment')) return 'Ointments & Creams';
  if (formType.includes('cream') || name.includes('cream')) return 'Ointments & Creams';
  if (formType.includes('gel') || name.includes('gel')) return 'Ointments & Creams';
  if (formType.includes('drop') || name.includes('drop')) return 'Drops';
  if (formType.includes('syrup') || name.includes('syrup')) return 'Syrups';
  if (formType.includes('oil') || name.includes('oil')) return 'Oils';
  if (name.includes('bc-') || name.includes('bio combination')) return 'Bio Combination';
  if (name.includes('biochemic') || (name.match(/^\d+[xX]$/))) return 'Biochemic';
  
  return 'Patent Medicines'; // Default category
}

async function createOrUpdateProduct(req: NextRequest, item: PurchaseUploadRow): Promise<{ productId: string; isNew: boolean }> {
  // Check if product exists by code or name
  const existingResult = await query(
    `SELECT id FROM products WHERE sku = $1 OR name = $2 LIMIT 1`,
    [item['Product Code'], item['Product Name']]
  );
  
  if (existingResult.rows.length > 0) {
    // Update existing product with latest data from supplier
    const hsnInfo = determineHSNCode(item['Product Name'], item['Form']);
    const category = determineCategory(item['Product Name'], item['Form']);
    
    await query(
      `UPDATE products SET 
        mrp = $1,
        selling_price = $1,
        gst_rate = $2,
        updated_at = NOW()
       WHERE id = $3`,
      [parseFloat(item['MRP'] || '0'), hsnInfo.gstRate, existingResult.rows[0].id]
    );
    
    return { productId: existingResult.rows[0].id, isNew: false };
  }
  
  // Create new product with all details
  const hsnInfo = determineHSNCode(item['Product Name'], item['Form']);
  const category = determineCategory(item['Product Name'], item['Form']);
  
  // Auto-create brand, category, HSN if needed
  const brandId = await getOrCreateBrand(req, item['Brand']);
  const categoryId = await getOrCreateCategory(req, category);
  const hsnId = await getOrCreateHSNCode(req, hsnInfo.hsn, hsnInfo.gstRate);
  
  // Generate barcode from SKU
  const barcode = item['Product Code']?.toUpperCase().replace(/\s+/g, '') || `PROD${Date.now()}`;
  
  const newResult = await query(
    `INSERT INTO products (
      name, sku, barcode, description, brand_id, category_id, hsn_code_id,
      potency, form, size, unit, mrp, selling_price, gst_rate, stock_qty,
      is_active, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0, true, NOW(), NOW())
    RETURNING id`,
    [
      item['Product Name'],
      item['Product Code'],
      barcode,
      `Auto-created product from purchase upload: ${item['Product Name']}`,
      brandId,
      categoryId,
      hsnId,
      item['Potency'],
      item['Form'],
      item['Size'],
      item['Unit'],
      parseFloat(item['MRP'] || '0'),
      parseFloat(item['MRP'] || '0'),
      hsnInfo.gstRate
    ]
  );
  
  return { productId: newResult.rows[0].id, isNew: true };
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication - get user from auth token cookie
    const authToken = req.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized - No auth token' }, { status: 401 });
    }

    // For now, we'll use a simple approach - in production, validate the token
    // Extract user ID from token (this is a simplified approach)
    let userId = null;
    try {
      // Simple JWT decode (in production, use proper verification)
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      userId = payload.user_id || payload.id || null;
    } catch (error) {
      console.error('Token decode error:', error);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Convert user.id to UUID or null (handle "0" or invalid UUIDs)
    userId = userId && userId !== '0' ? userId : null;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Parse CSV (Marg ERP format)
    const csvText = await file.text();
    let records: PurchaseUploadRow[] = [];
    
    // Detect format and parse accordingly
    if (csvText.includes('<MARGERP FORMAT>')) {
      // Parse Marg ERP format
      records = parseMargERPFormat(csvText);
      console.log(`Detected Marg ERP format: ${records.length} items`);
    } else {
      // Parse simple CSV format
      records = parseCSV(csvText) as PurchaseUploadRow[];
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
    const results: any[] = [];
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

      // GST breakup and margin estimates
      const gstBreakup: Record<string, number> = {};
      let estProfitNumerator = 0; // sum((mrp - unit_price) * qty)
      let estProfitDenominator = 0; // sum(mrp * qty)
      items.forEach((item) => {
        const qty = parseFloat(item.Quantity || '0');
        const unitPrice = parseFloat(item['Unit Price'] || '0');
        const mrp = parseFloat((item as any).MRP || '0');
        const taxPercent = String(parseFloat(item['Tax %'] || '0'));
        gstBreakup[taxPercent] = (gstBreakup[taxPercent] || 0) + (qty * unitPrice * (parseFloat(item['Tax %'] || '0')/100));
        if (mrp > 0 && qty > 0) {
          estProfitNumerator += (mrp - unitPrice) * qty;
          estProfitDenominator += mrp * qty;
        }
      });

      // Create upload session
      // Convert empty date strings to null for PostgreSQL
      const invoiceDate = firstItem['Invoice Date'] && firstItem['Invoice Date'].trim() 
        ? firstItem['Invoice Date'] 
        : null;

      const sessionResult = await query(
        `INSERT INTO upload_sessions (
          upload_type, file_name, file_size, total_rows, status, uploaded_by,
          supplier_name, invoice_number, invoice_date, total_amount, total_items
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          'purchase', file.name, file.size, items.length, 'processing', userId,
          firstItem['Supplier Name'], invoiceNo, invoiceDate,
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
          invoiceDate, subtotal, taxAmount, subtotal, 'pending'
        ]
      );

      if (purchaseResult.rows.length === 0) {
        console.error('Failed to create purchase upload');
        continue;
      }

      // Process items with auto-creation
      const uploadItems: any[] = [];
      let matchedCount = 0;
      let newProductsCount = 0;
      let updatedProductsCount = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Auto-create or update product
        const productResult = await createOrUpdateProduct(req, item);
        
        if (productResult.isNew) {
          newProductsCount++;
        } else {
          updatedProductsCount++;
        }
        
        matchedCount++; // All items are now "matched" since we auto-create products

        const quantity = parseFloat(item.Quantity || '0');
        const unitPrice = parseFloat(item['Unit Price'] || '0');
        const taxPercent = parseFloat(item['Tax %'] || '0');
        const discountPercent = parseFloat(item['Discount %'] || '0');
        const taxAmount = parseFloat(item['Tax Amount'] || '0'); // Use actual tax amount from CSV
        const discountAmount = parseFloat(item['Discount Amount'] || '0'); // Use actual discount amount from CSV
        const totalAmount = parseFloat(item['Total Amount'] || '0'); // Use taxable amount from CSV

        await query(
          `INSERT INTO upload_items (
            session_id, row_number, product_code, product_name, brand, potency, size, form,
            hsn_code, batch_number, expiry_date, quantity, unit_price, mrp, 
            discount_percent, discount_amount, tax_percent, tax_amount, total_amount,
            matched_product_id, match_type, match_confidence, raw_data, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
          [
            session.id, i + 1, item['Product Code'], item['Product Name'],
            item.Brand, item.Potency || null, item.Size, item.Form,
            item['HSN Code'], item['Batch Number'], item['Expiry Date'] && item['Expiry Date'].trim() ? item['Expiry Date'] : null,
            quantity, unitPrice, parseFloat(item.MRP || '0'), discountPercent, discountAmount,
            taxPercent, taxAmount, totalAmount, productResult.productId, productResult.isNew ? 'auto-created' : 'existing', 100,
            JSON.stringify(item), 'matched'
          ]
        );

        uploadItems.push({
          product_code: item['Product Code'],
          product_name: item['Product Name'],
          brand: item.Brand,
          potency: item.Potency || null,
          size: item.Size,
          form: item.Form,
          hsn_code: item['HSN Code'],
          batch_number: item['Batch Number'],
          expiry_date: item['Expiry Date'] && item['Expiry Date'].trim() ? item['Expiry Date'] : null,
          quantity: quantity,
          unit_price: unitPrice,
          mrp: parseFloat(item.MRP || '0'),
          tax_percent: taxPercent,
          tax_amount: taxAmount,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          matched_product_id: productResult.productId,
          match_type: productResult.isNew ? 'auto-created' : 'existing',
          match_confidence: 100,
          status: 'matched'
        });
      }

      await query(
        `UPDATE upload_sessions SET status = $1, processed_rows = $2 WHERE id = $3`,
        ['awaiting_approval', items.length, session.id]
      );

      const estProfitPercent = estProfitDenominator > 0 ? Math.round((estProfitNumerator / estProfitDenominator) * 100) : 0;

      results.push({
        sessionId: session.id,
        invoiceNumber: invoiceNo,
        itemCount: items.length,
        matchedCount: matchedCount,
        unmatchedCount: 0,
        newProductsCount: newProductsCount,
        updatedProductsCount: updatedProductsCount,
        totals: {
          subtotal,
          taxAmount,
          gstBreakup,
          estimatedProfitPercent: estProfitPercent,
        }
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
    // Check authentication - get user from auth token cookie
    const authToken = req.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized - No auth token' }, { status: 401 });
    }

    // For now, we'll use a simple approach - in production, validate the token
    // Extract user ID from token (this is a simplified approach)
    let userId = null;
    try {
      // Simple JWT decode (in production, use proper verification)
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      userId = payload.user_id || payload.id || null;
    } catch (error) {
      console.error('Token decode error:', error);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Convert user.id to UUID or null (handle "0" or invalid UUIDs)
    userId = userId && userId !== '0' ? userId : null;

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
