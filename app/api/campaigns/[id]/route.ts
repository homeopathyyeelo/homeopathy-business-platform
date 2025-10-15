/**
 * Individual Campaign API Routes
 * Handles operations on specific campaigns
 */

import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api-utils"
import { campaignManager } from "@/lib/campaigns"
import { db, logEvent } from "@/lib/database"

// GET /api/campaigns/[id] - Get campaign details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["admin", "marketer"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const campaignId = Number.parseInt(params.id)
    const campaign = await campaignManager.getCampaignById(campaignId)

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Get campaign analytics
    const analytics = await campaignManager.getCampaignAnalytics(campaignId)

    return NextResponse.json({
      campaign,
      analytics,
    })
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/campaigns/[id] - Update campaign
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["admin", "marketer"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const campaignId = Number.parseInt(params.id)
    const body = await request.json()

    // Check if campaign exists
    const existingCampaign = await campaignManager.getCampaignById(campaignId)
    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Don't allow updating active campaigns
    if (existingCampaign.status === "active") {
      return NextResponse.json(
        {
          error: "Cannot update active campaign. Pause it first.",
        },
        { status: 400 },
      )
    }

    // Update campaign
    const updateFields = []
    const updateValues = []

    const allowedFields = [
      "name",
      "description",
      "type",
      "channel",
      "target_audience",
      "template_id",
      "schedule_type",
      "schedule_data",
      "personalization_fields",
      "budget",
      "expected_reach",
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = ?`)
        updateValues.push(
          ["schedule_data", "personalization_fields"].includes(field) ? JSON.stringify(body[field]) : body[field],
        )
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    updateFields.push("updated_at = NOW()")
    updateValues.push(campaignId)

    const query = `UPDATE campaigns SET ${updateFields.join(", ")} WHERE id = ?`
    await db.execute(query, updateValues)

    // Log campaign update
    await logEvent("campaign_updated", {
      campaign_id: campaignId,
      updated_by: user.id,
      updated_fields: Object.keys(body),
    })

    const updatedCampaign = await campaignManager.getCampaignById(campaignId)
    return NextResponse.json({
      message: "Campaign updated successfully",
      campaign: updatedCampaign,
    })
  } catch (error) {
    console.error("Error updating campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/campaigns/[id] - Delete campaign
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin can delete campaigns
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const campaignId = Number.parseInt(params.id)

    // Check if campaign exists
    const campaign = await campaignManager.getCampaignById(campaignId)
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Don't allow deleting active campaigns
    if (campaign.status === "active") {
      return NextResponse.json(
        {
          error: "Cannot delete active campaign. Pause it first.",
        },
        { status: 400 },
      )
    }

    // Delete campaign and related data
    await db.execute("DELETE FROM campaign_messages WHERE campaign_id = ?", [campaignId])
    await db.execute("DELETE FROM campaign_events WHERE campaign_id = ?", [campaignId])
    await db.execute("DELETE FROM campaigns WHERE id = ?", [campaignId])

    // Log campaign deletion
    await logEvent("campaign_deleted", {
      campaign_id: campaignId,
      campaign_name: campaign.name,
      deleted_by: user.id,
    })

    return NextResponse.json({ message: "Campaign deleted successfully" })
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
