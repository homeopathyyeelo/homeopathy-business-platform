/**
 * Message Templates API Routes
 * Handles CRUD operations for campaign message templates
 */

import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api-utils"
import { db, logEvent } from "@/lib/database"

// GET /api/campaigns/templates - List all message templates
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["admin", "marketer"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const channel = searchParams.get("channel")
    const category = searchParams.get("category")

    let query = `
      SELECT t.*, u.name as created_by_name,
             COUNT(c.id) as usage_count
      FROM message_templates t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN campaigns c ON t.id = c.template_id
      WHERE 1=1
    `

    const params: any[] = []

    if (type) {
      query += " AND t.type = ?"
      params.push(type)
    }

    if (channel) {
      query += " AND t.channel = ?"
      params.push(channel)
    }

    if (category) {
      query += " AND t.category = ?"
      params.push(category)
    }

    query += " GROUP BY t.id ORDER BY t.created_at DESC"

    const [templates] = await db.execute(query, params)

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/campaigns/templates - Create new message template
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["admin", "marketer"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ["name", "content", "type", "channel", "category"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Validate personalization fields JSON if provided
    if (body.personalization_fields) {
      try {
        JSON.parse(body.personalization_fields)
      } catch (error) {
        return NextResponse.json({ error: "Invalid personalization_fields JSON format" }, { status: 400 })
      }
    }

    const query = `
      INSERT INTO message_templates (
        name, description, content, type, channel, category,
        personalization_fields, variables, is_active, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())
    `

    const result = await db.execute(query, [
      body.name,
      body.description || "",
      body.content,
      body.type,
      body.channel,
      body.category,
      body.personalization_fields || "[]",
      body.variables || "{}",
      user.id,
    ])

    // Log template creation
    await logEvent("template_created", {
      template_id: result.insertId,
      template_name: body.name,
      created_by: user.id,
      channel: body.channel,
      type: body.type,
    })

    return NextResponse.json(
      {
        message: "Template created successfully",
        template_id: result.insertId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
