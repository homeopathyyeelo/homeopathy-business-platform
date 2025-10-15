/**
 * AI Demand Forecasting API
 * Provides intelligent demand predictions for inventory management
 */

import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api-utils"
import { aiAutomationService } from "@/lib/ai-automation"

// POST /api/ai/forecast-demand - Generate demand forecast
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin, staff, and inventory managers can access forecasting
    if (!["admin", "staff", "inventory_manager"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { 
      product_id, 
      shop_id, 
      days_ahead = 30,
      include_seasonality = true,
      external_factors 
    } = body

    if (!product_id || !shop_id) {
      return NextResponse.json(
        { error: "product_id and shop_id are required" },
        { status: 400 }
      )
    }

    if (days_ahead < 1 || days_ahead > 365) {
      return NextResponse.json(
        { error: "days_ahead must be between 1 and 365" },
        { status: 400 }
      )
    }

    const forecast = await aiAutomationService.forecastDemand({
      product_id,
      shop_id,
      days_ahead,
      include_seasonality,
      external_factors
    })

    return NextResponse.json({
      success: true,
      data: forecast,
      message: "Demand forecast generated successfully"
    })

  } catch (error: any) {
    console.error("Demand forecasting error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate demand forecast" },
      { status: 500 }
    )
  }
}

// GET /api/ai/forecast-demand - Get demand forecasts for multiple products
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin, staff, and inventory managers can access forecasting
    if (!["admin", "staff", "inventory_manager"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const shop_id = searchParams.get("shop_id")
    const product_ids = searchParams.get("product_ids")?.split(",")
    const days_ahead = parseInt(searchParams.get("days_ahead") || "30")

    if (!shop_id) {
      return NextResponse.json(
        { error: "shop_id is required" },
        { status: 400 }
      )
    }

    if (!product_ids || product_ids.length === 0) {
      return NextResponse.json(
        { error: "product_ids is required" },
        { status: 400 }
      )
    }

    // Generate forecasts for multiple products
    const forecasts = await Promise.all(
      product_ids.map(product_id => 
        aiAutomationService.forecastDemand({
          product_id,
          shop_id,
          days_ahead,
          include_seasonality: true
        }).catch(error => ({
          product_id,
          error: error.message
        }))
      )
    )

    const successfulForecasts = forecasts.filter(f => !f.error)
    const failedForecasts = forecasts.filter(f => f.error)

    return NextResponse.json({
      success: true,
      data: {
        forecasts: successfulForecasts,
        failed_forecasts: failedForecasts,
        summary: {
          total_products: product_ids.length,
          successful: successfulForecasts.length,
          failed: failedForecasts.length
        }
      },
      message: `Generated forecasts for ${successfulForecasts.length}/${product_ids.length} products`
    })

  } catch (error: any) {
    console.error("Bulk demand forecasting error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate demand forecasts" },
      { status: 500 }
    )
  }
}
