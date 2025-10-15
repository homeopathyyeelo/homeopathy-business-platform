import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@yeelo/shared-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channel = searchParams.get("channel")
    const language = searchParams.get("language")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Build where clause
    const where: any = {}

    if (channel) {
      where.channel = channel
    }

    if (language) {
      where.language = language
    }

    // Get templates
    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.template.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, channel, content, language, variables } = body

    // Validate required fields
    if (!name || !channel || !content) {
      return NextResponse.json(
        { success: false, error: "Name, channel, and content are required" },
        { status: 400 }
      )
    }

    // Create template
    const template = await prisma.template.create({
      data: {
        name,
        channel: channel.toUpperCase(),
        content,
        language: language || "en",
        variables: variables ? JSON.stringify(variables) : null,
      },
    })

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create template" },
      { status: 500 }
    )
  }
}
