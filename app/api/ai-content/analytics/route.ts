/**
 * AI Content Analytics API
 * Provides insights into AI content generation usage and performance
 */

import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api-utils"
import { aiContentGenerator } from "@/lib/ai-content"

// GET /api/ai-content/analytics - Get AI content generation analytics
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin and marketers can view analytics
    if (!["admin", "marketer"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    // Default to last 30 days if no date range provided
    const dateRange = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date(),
    }

    const analytics = await aiContentGenerator.getContentAnalytics(dateRange)

    // Group analytics by content type
    const contentTypeStats = analytics.reduce((acc: any, row: any) => {
      if (!acc[row.content_type]) {
        acc[row.content_type] = {
          total_generations: 0,
          avg_content_length: 0,
          daily_breakdown: [],
        }
      }

      acc[row.content_type].total_generations += row.generation_count
      acc[row.content_type].avg_content_length = row.avg_content_length
      acc[row.content_type].daily_breakdown.push({
        date: row.generation_date,
        count: row.generation_count,
      })

      return acc
    }, {})

    // Calculate overall statistics
    const totalGenerations = analytics.reduce((sum: number, row: any) => sum + row.generation_count, 0)
    const avgContentLength =
      analytics.reduce((sum: number, row: any) => sum + (row.avg_content_length || 0), 0) / analytics.length

    return NextResponse.json({
      date_range: dateRange,
      overview: {
        total_generations: totalGenerations,
        avg_content_length: Math.round(avgContentLength || 0),
        content_types_used: Object.keys(contentTypeStats).length,
        most_used_type:
          Object.entries(contentTypeStats).sort(
            ([, a]: any, [, b]: any) => b.total_generations - a.total_generations,
          )[0]?.[0] || null,
      },
      content_type_breakdown: contentTypeStats,
      daily_activity: analytics,
    })
  } catch (error) {
    console.error("Error fetching AI content analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
