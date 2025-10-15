import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const po = await query<any>(
    `SELECT id, vendor_id, shop_id, po_number, status, total_amount, placed_at, expected_delivery, created_at
       FROM purchase_orders WHERE id = $1`,
    [id],
  )
  if (po.rowCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 })
  const items = await query<any>(
    `SELECT id, product_id, unit_cost, qty, received_qty, batch_no, expiry_date
       FROM purchase_items WHERE purchase_order_id = $1`,
    [id],
  )
  return NextResponse.json({ ...po.rows[0], items: items.rows })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await req.json()
  const { status, expected_delivery } = body || {}
  const res = await query<any>(
    `UPDATE purchase_orders SET status = COALESCE($2, status), expected_delivery = COALESCE($3, expected_delivery)
       WHERE id = $1 RETURNING id, vendor_id, shop_id, po_number, status, total_amount, placed_at, expected_delivery, created_at`,
    [id, status ?? null, expected_delivery ?? null],
  )
  if (res.rowCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json(res.rows[0])
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { id } = params
  await query<any>(`DELETE FROM purchase_items WHERE purchase_order_id = $1`, [id])
  const res = await query<any>(`DELETE FROM purchase_orders WHERE id = $1`, [id])
  if (res.rowCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}



