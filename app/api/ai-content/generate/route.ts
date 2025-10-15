/**
 * AI Content Generation API Routes
 * Handles AI-powered content creation requests
 */

import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api-utils"
import { aiContentGenerator } from "@/lib/ai-content"
import { logEvent } from "@/lib/database"

// POST /api/ai-content/generate - Generate AI content
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin and marketers can generate content
    if (!["admin", "marketer"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { content_type, ...contentData } = body

    if (!content_type) {
      return NextResponse.json({ error: "content_type is required" }, { status: 400 })
    }

    let result

    switch (content_type) {
      case "product_description":
        if (!contentData.name || !contentData.category) {
          return NextResponse.json(
            {
              error: "name and category are required for product descriptions",
            },
            { status: 400 },
          )
        }
        result = await aiContentGenerator.generateProductDescription(contentData)
        break

      case "campaign_content":
        if (!contentData.type || !contentData.channel || !contentData.target_audience) {
          return NextResponse.json(
            {
              error: "type, channel, and target_audience are required for campaign content",
            },
            { status: 400 },
          )
        }
        result = await aiContentGenerator.generateCampaignContent(contentData)
        break

      case "social_media_post":
        if (!contentData.platform || !contentData.content_type) {
          return NextResponse.json(
            {
              error: "platform and content_type are required for social media posts",
            },
            { status: 400 },
          )
        }
        result = await aiContentGenerator.generateSocialMediaPost(contentData)
        break

      case "customer_template":
        if (!contentData.type || !contentData.channel || !contentData.tone) {
          return NextResponse.json(
            {
              error: "type, channel, and tone are required for customer templates",
            },
            { status: 400 },
          )
        }
        result = await aiContentGenerator.generateCustomerTemplate(contentData)
        break

      case "blog_content":
        if (
          !contentData.topic ||
          !contentData.target_keywords ||
          !contentData.content_type ||
          !contentData.target_audience
        ) {
          return NextResponse.json(
            {
              error: "topic, target_keywords, content_type, and target_audience are required for blog content",
            },
            { status: 400 },
          )
        }
        result = await aiContentGenerator.generateBlogContent(contentData)
        break

      case "content_variants":
        if (!contentData.original_content) {
          return NextResponse.json(
            {
              error: "original_content is required for content variants",
            },
            { status: 400 },
          )
        }
        result = await aiContentGenerator.generateContentVariants(
          contentData.original_content,
          contentData.variant_count || 2,
        )
        break

      case "personalized_content":
        if (!contentData.customer_data || !contentData.content_type) {
          return NextResponse.json(
            {
              error: "customer_data and content_type are required for personalized content",
            },
            { status: 400 },
          )
        }
        result = await aiContentGenerator.generatePersonalizedContent(
          contentData.customer_data,
          contentData.content_type,
        )
        break

      default:
        return NextResponse.json(
          {
            error: `Unsupported content type: ${content_type}`,
          },
          { status: 400 },
        )
    }

    // Log content generation request
    await logEvent("ai_content_generated", {
      content_type,
      generated_by: user.id,
      content_length: typeof result === "string" ? result.length : JSON.stringify(result).length,
      request_data: contentData,
    })

    return NextResponse.json({
      message: "Content generated successfully",
      content_type,
      result,
    })
  } catch (error) {
    console.error("Error generating AI content:", error)
    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
