import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const result = await query<any>(
    `SELECT id, name, contact_person, phone, email, payment_terms, rating, created_at
       FROM vendors WHERE id = $1`,
    [id],
  )
  if (result.rowCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json(result.rows[0])
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await req.json()
  const { name, contact_person, phone, email, payment_terms, rating } = body || {}
  const result = await query<any>(
    `UPDATE vendors SET
       name = COALESCE($2, name),
       contact_person = COALESCE($3, contact_person),
       phone = COALESCE($4, phone),
       email = COALESCE($5, email),
       payment_terms = COALESCE($6, payment_terms),
       rating = COALESCE($7, rating)
     WHERE id = $1
     RETURNING id, name, contact_person, phone, email, payment_terms, rating, created_at`,
    [id, name ?? null, contact_person ?? null, phone ?? null, email ?? null, payment_terms ?? null, rating ?? null],
  )
  if (result.rowCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json(result.rows[0])
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const result = await query<any>(`DELETE FROM vendors WHERE id = $1`, [id])
  if (result.rowCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}



