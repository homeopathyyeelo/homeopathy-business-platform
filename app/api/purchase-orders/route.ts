import { NextResponse } from "next/server"
import { query, transaction } from "@/lib/database"

export async function GET() {
  const result = await query<any>(
    `SELECT po.id, po.po_number, po.status, po.total_amount, po.placed_at, po.expected_delivery,
            v.name as vendor_name, s.name as shop_name
       FROM purchase_orders po
       LEFT JOIN vendors v ON v.id = po.vendor_id
       LEFT JOIN shops s ON s.id = po.shop_id
       ORDER BY po.created_at DESC`,
  )
  return NextResponse.json(result.rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { vendor_id, shop_id, items } = body || {}
  if (!vendor_id || !shop_id || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "vendor_id, shop_id, items required" }, { status: 400 })
  }

  const poNumber = `PO-${Date.now()}`

  const created = await transaction(async (client) => {
    const poRes = await client.query<any>(
      `INSERT INTO purchase_orders (vendor_id, shop_id, po_number, status, total_amount, placed_at)
       VALUES ($1,$2,$3,'placed',0, NOW()) RETURNING id`,
      [vendor_id, shop_id, poNumber],
    )
    const poId = poRes.rows[0].id
    let total = 0
    for (const it of items) {
      const { product_id, unit_cost, qty, batch_no, expiry_date } = it
      total += (Number(unit_cost) || 0) * (Number(qty) || 0)
      await client.query(
        `INSERT INTO purchase_items (purchase_order_id, product_id, unit_cost, qty, batch_no, expiry_date)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [poId, product_id, unit_cost, qty, batch_no ?? null, expiry_date ?? null],
      )
    }
    await client.query(`UPDATE purchase_orders SET total_amount=$1 WHERE id=$2`, [total, poId])
    return { id: poId, po_number: poNumber, total_amount: total }
  })

  return NextResponse.json(created, { status: 201 })
}


