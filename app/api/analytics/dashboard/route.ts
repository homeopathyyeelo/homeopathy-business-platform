/**
 * Analytics Dashboard API
 * Provides comprehensive business metrics and KPIs
 */

import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api-utils"
import { analyticsEngine } from "@/lib/analytics"

// GET /api/analytics/dashboard - Get dashboard metrics
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin and staff can view analytics
    if (!["admin", "staff"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const realTime = searchParams.get("real_time") === "true"

    // Default to last 30 days if no date range provided
    const dateRange = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date(),
    }

    if (realTime) {
      const metrics = await analyticsEngine.getRealTimeMetrics()
      return NextResponse.json(metrics)
    }

    const dashboardMetrics = await analyticsEngine.getDashboardMetrics(dateRange)
    const predictiveAnalytics = await analyticsEngine.getPredictiveAnalytics()

    return NextResponse.json({
      ...dashboardMetrics,
      predictions: predictiveAnalytics,
      date_range: dateRange,
    })
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
