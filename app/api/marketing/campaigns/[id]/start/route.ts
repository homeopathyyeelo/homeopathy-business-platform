import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@yeelo/shared-db"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

    // Get campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      )
    }

    if (campaign.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Campaign is not in draft status" },
        { status: 400 }
      )
    }

    // Update campaign status to running
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "RUNNING",
        scheduledAt: new Date(),
      },
    })

    try {
      // Trigger campaign execution via Golang API
      const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
      const res = await fetch(`${GOLANG_API_URL}/api/erp/marketing/campaigns/${id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ success: true, data: data.data });
      }
    } catch (error) {
      console.error('Campaign start error:', error);
    }
    // This would typically involve:
    // 1. Getting target audience
    // 2. Sending messages via appropriate channel
    // 3. Tracking delivery and engagement

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
    })
  } catch (error) {
    console.error("Error starting campaign:", error)
    return NextResponse.json(
      { success: false, error: "Failed to start campaign" },
      { status: 500 }
    )
  }
}
