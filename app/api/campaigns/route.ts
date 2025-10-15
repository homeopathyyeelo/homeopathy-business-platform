/**
 * Campaign Management API Routes
 * Handles CRUD operations for marketing campaigns
 */

import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api-utils"
import { campaignManager } from "@/lib/campaigns"
import { logEvent } from "@/lib/database"
import { db } from "@/lib/database" // Declare the db variable

// GET /api/campaigns - List all campaigns with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin and marketers can view campaigns
    if (!["admin", "marketer"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const channel = searchParams.get("channel")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    let query = `
      SELECT c.*, u.name as creator_name, t.name as template_name,
             COUNT(cm.id) as message_count,
             SUM(CASE WHEN cm.status = 'sent' THEN 1 ELSE 0 END) as sent_count
      FROM campaigns c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN message_templates t ON c.template_id = t.id
      LEFT JOIN campaign_messages cm ON c.id = cm.campaign_id
      WHERE 1=1
    `

    const params: any[] = []

    if (status) {
      query += " AND c.status = ?"
      params.push(status)
    }

    if (type) {
      query += " AND c.type = ?"
      params.push(type)
    }

    if (channel) {
      query += " AND c.channel = ?"
      params.push(channel)
    }

    query += " GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?"
    params.push(limit, (page - 1) * limit)

    const [campaigns] = await db.execute(query, params)

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total: campaigns.length,
      },
    })
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin and marketers can create campaigns
    if (!["admin", "marketer"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ["name", "description", "type", "channel", "target_audience", "schedule_type"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Validate target audience JSON
    try {
      JSON.parse(body.target_audience)
    } catch (error) {
      return NextResponse.json({ error: "Invalid target_audience JSON format" }, { status: 400 })
    }

    const campaignData = {
      ...body,
      created_by: user.id,
    }

    const campaign = await campaignManager.createCampaign(campaignData)

    // Log campaign creation
    await logEvent("campaign_created", {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      created_by: user.id,
      channel: campaign.channel,
      type: campaign.type,
    })

    return NextResponse.json(
      {
        message: "Campaign created successfully",
        campaign,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
