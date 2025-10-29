import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';
import { getUserFromRequest } from '@/lib/auth';
import type { PoolClient } from 'pg';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        [user.id, reason || 'Rejected by administrator', sessionId]
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
          [user.id, sessionId]
        );

        if (session.upload_type === 'purchase') {
          // Import purchase data
          await importPurchaseData(client, sessionId, user.id);
        } else if (session.upload_type === 'inventory') {
          // Import inventory data
          await importInventoryData(client, sessionId, user.id);
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
async function importPurchaseData(client: PoolClient, sessionId: string, userId: string) {
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
      po_number, invoice_no, vendor_id, order_date,
      subtotal, tax_amount, total_amount, status,
      created_by, approved_by, approved_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    RETURNING id`,
    [
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
    if (!item.matched_product_id) {
      // Skip unmatched products
      continue;
    }

    // Insert purchase item
    await client.query(
      `INSERT INTO purchase_items (
        purchase_id, product_id, product_name, product_code,
        batch_number, expiry_date, quantity, unit_price,
        discount_percent, discount_amount, tax_percent, tax_amount, amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        purchaseOrderId,
        item.matched_product_id,
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
       SET stock_qty = stock_qty + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [item.quantity, item.matched_product_id]
    );

    // Update inventory batch (if using batch tracking)
    await client.query(
      `INSERT INTO inventory (
        product_id, batch_number, expiry_date, quantity,
        cost_price, mrp, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (product_id, batch_number)
      DO UPDATE SET
        quantity = inventory.quantity + EXCLUDED.quantity,
        updated_at = NOW()`,
      [
        item.matched_product_id,
        item.batch_number,
        item.expiry_date,
        item.quantity,
        item.unit_price,
        item.mrp,
      ]
    );
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
     SET status = 'imported'
     WHERE session_id = $1 AND matched_product_id IS NOT NULL`,
    [sessionId]
  );
}

// Helper function to import inventory data
async function importInventoryData(client: PoolClient, sessionId: string, userId: string) {
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
      `INSERT INTO inventory (
        product_id, batch_number, expiry_date, quantity,
        cost_price, selling_price, mrp, location, rack_number, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      ON CONFLICT (product_id, batch_number)
      DO UPDATE SET
        quantity = inventory.quantity + EXCLUDED.quantity,
        cost_price = EXCLUDED.cost_price,
        selling_price = EXCLUDED.selling_price,
        mrp = EXCLUDED.mrp,
        updated_at = NOW()`,
      [
        item.product_id,
        item.batch_number,
        item.expiry_date,
        item.quantity,
        item.cost_price,
        item.selling_price,
        item.mrp,
        item.location,
        item.rack_number,
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
     SET status = 'imported'
     WHERE session_id = $1 AND matched_product_id IS NOT NULL`,
    [sessionId]
  );
}
