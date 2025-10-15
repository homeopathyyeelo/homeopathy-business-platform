import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@yeelo/shared-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const channel = searchParams.get("channel")

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (channel) {
      where.channel = channel
    }

    // Get campaigns
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          template: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaigns" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, channel, content, targetSegment, scheduledAt, isRecurring, recurringSchedule } = body

    // Validate required fields
    if (!name || !channel || !content) {
      return NextResponse.json(
        { success: false, error: "Name, channel, and content are required" },
        { status: 400 }
      )
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        channel: channel.toUpperCase(),
        content,
        targetAudience: targetSegment ? JSON.stringify({ segmentId: targetSegment }) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduleType: isRecurring ? "recurring" : "immediate",
        cronSchedule: isRecurring ? recurringSchedule : null,
      },
    })

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    )
  }
}
