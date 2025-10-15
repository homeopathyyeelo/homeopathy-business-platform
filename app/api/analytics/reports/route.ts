/**
 * Custom Reports API
 * Handles generation of custom analytical reports
 */

import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api-utils"
import { analyticsEngine } from "@/lib/analytics"
import { logEvent } from "@/lib/database"

// POST /api/analytics/reports - Generate custom report
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin can generate custom reports
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { date_range, metrics, group_by, filters } = body

    if (!date_range || !date_range.start || !date_range.end) {
      return NextResponse.json(
        {
          error: "date_range with start and end dates is required",
        },
        { status: 400 },
      )
    }

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        {
          error: "metrics array is required and must not be empty",
        },
        { status: 400 },
      )
    }

    const reportFilters = {
      date_range: {
        start: new Date(date_range.start),
        end: new Date(date_range.end),
      },
      metrics,
      group_by,
      filters,
    }

    const report = await analyticsEngine.generateCustomReport(reportFilters)

    // Log report generation
    await logEvent("custom_report_generated", {
      generated_by: user.id,
      date_range: reportFilters.date_range,
      metrics: metrics,
      group_by: group_by,
    })

    return NextResponse.json({
      message: "Custom report generated successfully",
      report,
    })
  } catch (error) {
    console.error("Error generating custom report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
