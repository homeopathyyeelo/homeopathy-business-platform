/**
 * Campaign Launch API Route
 * Handles launching campaigns to start sending messages
 */

import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api-utils"
import { campaignManager } from "@/lib/campaigns"
import { logEvent } from "@/lib/database"

// POST /api/campaigns/[id]/launch - Launch a campaign
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  let user // Declare user variable here
  try {
    user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin and marketers can launch campaigns
    if (!["admin", "marketer"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const campaignId = Number.parseInt(params.id)

    // Check if campaign exists and is in draft status
    const campaign = await campaignManager.getCampaignById(campaignId)
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    if (campaign.status !== "draft") {
      return NextResponse.json(
        {
          error: `Cannot launch campaign with status: ${campaign.status}`,
        },
        { status: 400 },
      )
    }

    // Validate campaign has required data
    if (!campaign.template_id && campaign.channel !== "multi_channel") {
      return NextResponse.json(
        {
          error: "Campaign must have a message template before launching",
        },
        { status: 400 },
      )
    }

    // Get target audience count for validation
    const targetCustomers = await campaignManager.getTargetCustomers(campaign.target_audience)
    if (targetCustomers.length === 0) {
      return NextResponse.json(
        {
          error: "No customers match the target audience criteria",
        },
        { status: 400 },
      )
    }

    // Launch the campaign
    await campaignManager.launchCampaign(campaignId, user.id)

    // Log successful launch
    await logEvent("campaign_launched", {
      campaign_id: campaignId,
      campaign_name: campaign.name,
      launched_by: user.id,
      target_count: targetCustomers.length,
      channel: campaign.channel,
    })

    return NextResponse.json({
      message: "Campaign launched successfully",
      target_count: targetCustomers.length,
      estimated_cost: targetCustomers.length * 0.1, // Assuming 0.1 cost per message
    })
  } catch (error) {
    console.error("Error launching campaign:", error)

    // Log launch failure
    await logEvent("campaign_launch_failed", {
      campaign_id: Number.parseInt(params.id),
      error: error.message,
      attempted_by: user?.id,
    })

    return NextResponse.json({ error: "Failed to launch campaign" }, { status: 500 })
  }
}
