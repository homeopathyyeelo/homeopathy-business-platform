/**
 * AI Dynamic Pricing API
 * Provides intelligent pricing recommendations based on demand, stock, and market conditions
 */

import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api-utils"
import { aiAutomationService } from "@/lib/ai-automation"

// POST /api/ai/dynamic-pricing - Calculate optimal pricing
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin, staff, and pricing managers can access dynamic pricing
    if (!["admin", "staff", "pricing_manager"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const {
      product_id,
      current_price,
      current_stock,
      expiry_date,
      demand_forecast,
      competitor_prices,
      cost_price
    } = body

    if (!product_id || current_price === undefined || current_stock === undefined) {
      return NextResponse.json(
        { error: "product_id, current_price, and current_stock are required" },
        { status: 400 }
      )
    }

    if (cost_price === undefined) {
      return NextResponse.json(
        { error: "cost_price is required for pricing calculation" },
        { status: 400 }
      )
    }

    const pricingRecommendation = await aiAutomationService.calculateOptimalPricing({
      product_id,
      current_price,
      current_stock,
      expiry_date: expiry_date ? new Date(expiry_date) : undefined,
      demand_forecast: demand_forecast || 0,
      competitor_prices,
      cost_price
    })

    return NextResponse.json({
      success: true,
      data: pricingRecommendation,
      message: "Pricing recommendation generated successfully"
    })

  } catch (error: any) {
    console.error("Dynamic pricing error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to calculate optimal pricing" },
      { status: 500 }
    )
  }
}

// GET /api/ai/dynamic-pricing - Get pricing recommendations for multiple products
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin, staff, and pricing managers can access dynamic pricing
    if (!["admin", "staff", "pricing_manager"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const shop_id = searchParams.get("shop_id")
    const category = searchParams.get("category")
    const include_expiring = searchParams.get("include_expiring") === "true"

    if (!shop_id) {
      return NextResponse.json(
        { error: "shop_id is required" },
        { status: 400 }
      )
    }

    // Get products for pricing analysis
    let productQuery = `
      SELECT 
        p.id, p.name, p.current_price, p.cost_price,
        i.quantity as current_stock,
        i.expiry_date
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      WHERE i.shop_id = $1 AND p.is_active = true
    `
    
    const queryParams = [shop_id]
    
    if (category) {
      productQuery += " AND p.category = $2"
      queryParams.push(category)
    }
    
    if (include_expiring) {
      productQuery += " AND i.expiry_date IS NOT NULL AND i.expiry_date <= $" + (queryParams.length + 1)
      queryParams.push(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 days from now
    }

    // TODO: Execute query and get products
    // For now, return mock data
    const products = [
      {
        id: "1",
        name: "Sample Product 1",
        current_price: 100,
        cost_price: 60,
        current_stock: 50,
        expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      }
    ]

    // Generate pricing recommendations for each product
    const pricingRecommendations = await Promise.all(
      products.map(async (product) => {
        try {
          const recommendation = await aiAutomationService.calculateOptimalPricing({
            product_id: product.id,
            current_price: product.current_price,
            current_stock: product.current_stock,
            expiry_date: product.expiry_date,
            demand_forecast: 30, // TODO: Get actual demand forecast
            cost_price: product.cost_price
          })
          
          return {
            product_id: product.id,
            product_name: product.name,
            recommendation
          }
        } catch (error) {
          return {
            product_id: product.id,
            product_name: product.name,
            error: error instanceof Error ? error.message : "Unknown error"
          }
        }
      })
    )

    const successfulRecommendations = pricingRecommendations.filter(r => !r.error)
    const failedRecommendations = pricingRecommendations.filter(r => r.error)

    return NextResponse.json({
      success: true,
      data: {
        recommendations: successfulRecommendations,
        failed_recommendations: failedRecommendations,
        summary: {
          total_products: products.length,
          successful: successfulRecommendations.length,
          failed: failedRecommendations.length
        }
      },
      message: `Generated pricing recommendations for ${successfulRecommendations.length}/${products.length} products`
    })

  } catch (error: any) {
    console.error("Bulk dynamic pricing error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate pricing recommendations" },
      { status: 500 }
    )
  }
}
