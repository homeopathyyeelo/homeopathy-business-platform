import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';
import type { PoolClient } from 'pg';

// Helper functions for auto-creating products
function determineHSNCode(productName: string, form?: string): string {
  const name = (productName || '').toLowerCase();
  const formType = (form || '').toLowerCase();
  
  // Cosmetic items (18% GST)
  if (name.includes('shampoo') || name.includes('soap') || name.includes('toothpaste') || 
      name.includes('facewash') || name.includes('hair oil') || name.includes('lotion') ||
      name.includes('cream') && !name.includes('medicinal') || name.includes('deodorant') ||
      name.includes('cosmetic') || name.includes('beauty')) {
    return '330499'; // 18% GST
  }
  
  // All homeopathic medicines (5% GST)
  return '30049014'; // 5% GST
}

function determineGSTRate(productName: string, form?: string): number {
  const hsnCode = determineHSNCode(productName, form);
  return hsnCode === '330499' ? 18 : 5;
}

async function getOrCreateCategory(client: PoolClient, categoryName: string): Promise<string> {
  // Try to find existing category
  const existingResult = await client.query(
    `SELECT id FROM categories WHERE name = $1 LIMIT 1`,
    [categoryName]
  );
  
  if (existingResult.rows.length > 0) {
    return existingResult.rows[0].id;
  }
  
  // Generate unique code
  const baseCode = categoryName.toUpperCase().replace(/\s+/g, '_').substring(0, 50);
  const timestamp = Date.now().toString().slice(-6);
  const uniqueCode = `${baseCode}_${timestamp}`;
  
  // Create new category
  const newResult = await client.query(
    `INSERT INTO categories (name, code, description, is_active) VALUES ($1, $2, $3, true) RETURNING id`,
    [categoryName, uniqueCode, `Auto-created category: ${categoryName}`]
  );
  
  return newResult.rows[0].id;
}

async function getOrCreateBrand(client: PoolClient, brandName: string): Promise<string> {
  // Try to find existing brand
  const existingResult = await client.query(
    `SELECT id FROM brands WHERE name = $1 LIMIT 1`,
    [brandName]
  );
  
  if (existingResult.rows.length > 0) {
    return existingResult.rows[0].id;
  }
  
  // Generate unique code
  const baseCode = brandName.toUpperCase().replace(/\s+/g, '_').substring(0, 50);
  const timestamp = Date.now().toString().slice(-6);
  const uniqueCode = `${baseCode}_${timestamp}`;
  
  // Create new brand
  const newResult = await client.query(
    `INSERT INTO brands (name, code, description, is_active) VALUES ($1, $2, $3, true) RETURNING id`,
    [brandName, uniqueCode, `Auto-created brand for ${brandName}`]
  );
  
  return newResult.rows[0].id;
}

async function getOrCreateHSNCode(client: PoolClient, hsnCode: string, gstRate: number): Promise<string> {
  // Try to find existing HSN code
  const existingResult = await client.query(
    `SELECT id FROM hsn_codes WHERE code = $1 LIMIT 1`,
    [hsnCode]
  );
  
  if (existingResult.rows.length > 0) {
    return existingResult.rows[0].id;
  }
  
  // Create new HSN code
  const newResult = await client.query(
    `INSERT INTO hsn_codes (code, description, gst_rate, is_active) VALUES ($1, $2, $3, true) RETURNING id`,
    [hsnCode, `Auto-created HSN code for ${hsnCode}`, gstRate]
  );
  
  return newResult.rows[0].id;
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

    // TODO: Check if user has super user role
    // For now, allowing all authenticated users

    const body = await req.json();
    const { sessionId, action, reason } = body; // action: 'approve' | 'reject'

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'Session ID and action are required' },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      // Reject the upload
      const result = await query(
        `UPDATE upload_sessions
         SET approval_status = 'rejected',
             status = 'rejected',
             approved_by = $1,
             approved_at = NOW(),
             rejection_reason = $2,
             updated_at = NOW()
         WHERE id = $3 AND approval_status = 'pending'
         RETURNING *`,
        [userId, reason || 'Rejected by administrator', sessionId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Session not found or already processed' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Upload rejected successfully',
        session: result.rows[0],
      });
    }

    if (action === 'approve') {
      // Approve and import the data
      const result = await transaction(async (client: PoolClient) => {
        // Get session details
        const sessionResult = await client.query(
          `SELECT * FROM upload_sessions WHERE id = $1`,
          [sessionId]
        );

        if (sessionResult.rows.length === 0) {
          throw new Error('Session not found');
        }

        const session = sessionResult.rows[0];

        // Update session status
        await client.query(
          `UPDATE upload_sessions
           SET approval_status = 'approved',
               status = 'approved',
               approved_by = $1,
               approved_at = NOW(),
               updated_at = NOW()
           WHERE id = $2`,
          [userId, sessionId]
        );

        if (session.upload_type === 'purchase') {
          // Import purchase data
          await importPurchaseData(client, sessionId, userId);
        } else if (session.upload_type === 'inventory') {
          // Import inventory data
          await importInventoryData(client, sessionId, userId);
        }

        return session;
      });

      return NextResponse.json({
        success: true,
        message: 'Upload approved and imported successfully',
        session: result,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process approval' },
      { status: 500 }
    );
  }
}

// Helper function to import purchase data
async function importPurchaseData(client: PoolClient, sessionId: string, userId: string | null) {
  // Get purchase upload
  const purchaseResult = await client.query(
    `SELECT * FROM purchase_uploads WHERE session_id = $1 LIMIT 1`,
    [sessionId]
  );

  if (purchaseResult.rows.length === 0) {
    throw new Error('Purchase upload not found');
  }

  const purchase = purchaseResult.rows[0];

  // Create vendor if doesn't exist
  let vendorId = purchase.vendor_id;
  if (!vendorId) {
    const vendorInsert = await client.query(
      `INSERT INTO vendors (name, company_name, gstin, phone, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id`,
      [purchase.vendor_name, purchase.vendor_name, purchase.vendor_gstin || null, null]
    );
    vendorId = vendorInsert.rows[0].id;
  }

  // Create purchase order
  const poResult = await client.query(
    `INSERT INTO purchase_orders (
      order_number, po_number, invoice_no, vendor_id, order_date,
      subtotal, tax_amount, total_amount, status,
      created_by, approved_by, approved_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    RETURNING id`,
    [
      `PO-${Date.now()}`,
      `PO-${Date.now()}`,
      purchase.invoice_number,
      vendorId,
      purchase.invoice_date,
      purchase.subtotal,
      purchase.tax_amount,
      purchase.total_amount,
      'APPROVED',
      userId,
      userId,
    ]
  );

  const purchaseOrderId = poResult.rows[0].id;

  // Get upload items
  const itemsResult = await client.query(
    `SELECT * FROM upload_items WHERE session_id = $1 ORDER BY row_number`,
    [sessionId]
  );

  // Insert purchase items and update inventory
  for (const item of itemsResult.rows) {
    let productId = item.matched_product_id;
    
    // If product doesn't exist, create it first
    if (!productId) {
      console.log(`Creating new product: ${item.product_name} (${item.product_code})`);
      
      // Auto-generate HSN and determine GST
      const hsnCode = determineHSNCode(item.product_name, item.form);
      const gstRate = determineGSTRate(item.product_name, item.form);
      
      // Get category and brand IDs (create if needed)
      const categoryId = await getOrCreateCategory(client, item.brand || 'Uncategorized');
      const brandId = await getOrCreateBrand(client, item.brand || 'Unknown');
      
      // Get or create HSN code
      const hsnCodeId = await getOrCreateHSNCode(client, determineHSNCode(item.product_name, item.form), gstRate);
      
      // Create the product
      const productResult = await client.query(
        `INSERT INTO products (
          name, sku, barcode, brand_id, category_id, potency, form,
          hsn_code_id, gst_rate, mrp, pack_size, unit, description,
          current_stock, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, NOW(), NOW())
        RETURNING id`,
        [
          item.product_name,
          item.product_code || `AUTO-${Date.now()}`,
          (item.product_code || `AUTO-${Date.now()}`).toUpperCase().replace(/\s+/g, ''),
          brandId,
          categoryId,
          item.potency || null, // potency text field
          item.form || null, // form text field
          hsnCodeId,
          gstRate,
          item.mrp || item.unit_price || 0,
          item.size || '1 Unit',
          item.unit || 'pcs', // unit text field
          `Auto-created from purchase upload: ${purchase.invoice_number}`,
          0, // initial stock
        ]
      );
      
      productId = productResult.rows[0].id;
      console.log(`Created product with ID: ${productId}`);
    }

    // Insert purchase item
    await client.query(
      `INSERT INTO purchase_items (
        purchase_order_id, purchase_id, product_id, product_name, product_code,
        batch_number, expiry_date, quantity, unit_price,
        discount_percent, discount_amount, tax_percent, tax_amount, amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        purchaseOrderId,
        purchaseOrderId,
        productId,
        item.product_name,
        item.product_code,
        item.batch_number,
        item.expiry_date,
        item.quantity,
        item.unit_price,
        item.discount_percent || 0,
        item.discount_amount || 0,
        item.tax_percent || 0,
        item.tax_amount || 0,
        item.total_amount,
      ]
    );

    // Update product stock
    await client.query(
      `UPDATE products
       SET current_stock = current_stock + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [item.quantity, productId]
    );

    // Update inventory batch (if using batch tracking)
    await client.query(
      `INSERT INTO inventory_batches (
        product_id, batch_number, expiry_date, quantity, available_quantity,
        unit_cost, selling_price, mrp, is_active
      ) VALUES ($1, $2, $3, $4, $4, $5, $6, $6, true)
      ON CONFLICT (product_id, batch_number)
      DO UPDATE SET
        quantity = inventory_batches.quantity + EXCLUDED.quantity,
        available_quantity = inventory_batches.available_quantity + EXCLUDED.available_quantity,
        updated_at = NOW()`,
      [
        productId,
        item.batch_number,
        item.expiry_date,
        item.quantity,
        item.unit_price,
        item.mrp,
      ]
    );

    // Also reflect stock in core.inventory_batches if present (UI may read this)
    try {
      const invTable = await client.query(`SELECT to_regclass('core.inventory_batches') as exists`);
      if (invTable.rows[0]?.exists) {
        // Pick a shop to attribute the stock to
        const shopRow = await client.query(`SELECT id FROM core.shops ORDER BY created_at ASC LIMIT 1`);
        const shopId = shopRow.rows[0]?.id;
        if (shopId) {
          await client.query(
            `INSERT INTO core.inventory_batches (
               shop_id, product_id, batch_no, expiry_date, qty, landed_unit_cost, last_restocked
             ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (shop_id, product_id, batch_no)
             DO UPDATE SET
               qty = core.inventory_batches.qty + EXCLUDED.qty,
               landed_unit_cost = COALESCE(EXCLUDED.landed_unit_cost, core.inventory_batches.landed_unit_cost),
               last_restocked = NOW()`,
            [
              shopId,
              item.matched_product_id,
              item.batch_number,
              item.expiry_date,
              item.quantity,
              item.unit_price,
            ]
          );
        }
      }
    } catch (e) {
      // Non-fatal: core schema may not exist; continue
    }
  }

  // Update purchase upload status
  await client.query(
    `UPDATE purchase_uploads
     SET status = 'imported', purchase_order_id = $1
     WHERE session_id = $2`,
    [purchaseOrderId, sessionId]
  );

  // Update upload items status
  await client.query(
    `UPDATE upload_items
     SET status = 'matched'
     WHERE session_id = $1 AND matched_product_id IS NOT NULL`,
    [sessionId]
  );
}

// Helper function to import inventory data
async function importInventoryData(client: PoolClient, sessionId: string, userId: string | null) {
  // Get inventory uploads
  const inventoryResult = await client.query(
    `SELECT * FROM inventory_uploads WHERE session_id = $1`,
    [sessionId]
  );

  for (const item of inventoryResult.rows) {
    if (!item.product_id) {
      // Skip unmatched products
      continue;
    }

    // Update product stock
    await client.query(
      `UPDATE products
       SET stock_qty = stock_qty + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [item.quantity, item.product_id]
    );

    // Insert or update inventory
    await client.query(
      `INSERT INTO inventory_batches (
        product_id, batch_number, expiry_date, quantity, available_quantity,
        unit_cost, selling_price, mrp, warehouse_location, is_active
      ) VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, true)
      ON CONFLICT (product_id, batch_number)
      DO UPDATE SET
        quantity = inventory_batches.quantity + EXCLUDED.quantity,
        available_quantity = inventory_batches.available_quantity + EXCLUDED.available_quantity,
        unit_cost = EXCLUDED.unit_cost,
        selling_price = EXCLUDED.selling_price,
        mrp = EXCLUDED.mrp,
        updated_at = NOW()`,
      [
        item.product_id,
        item.batch_number,
        item.expiry_date,
        item.quantity,
        item.cost_price || item.unit_price,
        item.selling_price || item.mrp,
        item.mrp,
        item.location || 'DEFAULT',
      ]
    );

    // Update inventory upload status
    await client.query(
      `UPDATE inventory_uploads
       SET status = 'imported'
       WHERE id = $1`,
      [item.id]
    );
  }

  // Update upload items status
  await client.query(
    `UPDATE upload_items
     SET status = 'matched'
     WHERE session_id = $1 AND matched_product_id IS NOT NULL`,
    [sessionId]
  );
}
