import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  const result = await query<any>(
    `SELECT id, name, contact_person, phone, email, payment_terms, rating, created_at FROM vendors ORDER BY created_at DESC`,
  )
  return NextResponse.json(result.rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, contact_person, phone, email, payment_terms, rating } = body || {}
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  const result = await query<any>(
    `INSERT INTO vendors (name, contact_person, phone, email, payment_terms, rating)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, name, contact_person, phone, email, payment_terms, rating, created_at`,
    [name, contact_person ?? null, phone ?? null, email ?? null, payment_terms ?? null, rating ?? null],
  )
  return NextResponse.json(result.rows[0], { status: 201 })
}


