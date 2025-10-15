import { NextResponse } from "next/server"
import { transaction } from "@/lib/database"

export async function POST(req: Request) {
  const body = await req.json()
  const { purchase_order_id, vendor_invoice_no, received_by_user_id, items } = body || {}
  if (!purchase_order_id || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "purchase_order_id and items required" }, { status: 400 })
  }
  const created = await transaction(async (client) => {
    const r = await client.query<any>(
      `INSERT INTO vendor_receipts (purchase_order_id, vendor_invoice_no, received_by_user_id)
       VALUES ($1,$2,$3) RETURNING id`,
      [purchase_order_id, vendor_invoice_no ?? null, received_by_user_id ?? null],
    )
    const receiptId = r.rows[0].id
    for (const it of items) {
      const { purchase_item_id, product_id, qty, unit_cost, batch_no, expiry_date, shop_id } = it
      await client.query(
        `INSERT INTO vendor_receipt_items (vendor_receipt_id, purchase_item_id, product_id, qty, unit_cost, batch_no, expiry_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [receiptId, purchase_item_id ?? null, product_id, qty, unit_cost ?? null, batch_no ?? null, expiry_date ?? null],
      )
      await client.query(
        `INSERT INTO inventory (shop_id, product_id, batch_no, expiry_date, quantity, reserved, min_threshold, last_restocked)
         VALUES ($1,$2,$3,$4,$5,0,0,NOW())
         ON CONFLICT (shop_id, product_id, batch_no)
         DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, last_restocked = NOW()`,
        [shop_id, product_id, batch_no ?? null, expiry_date ?? null, qty],
      )
      await client.query(
        `UPDATE purchase_items SET received_qty = COALESCE(received_qty,0) + $2 WHERE id = $1`,
        [purchase_item_id, qty],
      )
    }
    return { id: receiptId }
  })
  return NextResponse.json(created, { status: 201 })
}



