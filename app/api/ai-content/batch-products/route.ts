/**
 * Batch Product Description Generation API
 * Handles bulk generation of product descriptions
 */

import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api-utils"
import { aiContentGenerator } from "@/lib/ai-content"
import { db, logEvent } from "@/lib/database"

// POST /api/ai-content/batch-products - Generate descriptions for multiple products
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin can run batch operations
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { product_ids, update_existing = false } = body

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        {
          error: "product_ids array is required and must not be empty",
        },
        { status: 400 },
      )
    }

    if (product_ids.length > 50) {
      return NextResponse.json(
        {
          error: "Maximum 50 products can be processed in a single batch",
        },
        { status: 400 },
      )
    }

    // Get products that need descriptions
    let query = `
      SELECT id, name, category, potency, indications, ingredients, 
             target_audience, description
      FROM products 
      WHERE id IN (${product_ids.map(() => "?").join(",")})
    `

    if (!update_existing) {
      query += ' AND (description IS NULL OR description = "")'
    }

    const [products] = await db.execute(query, product_ids)

    if (products.length === 0) {
      return NextResponse.json({
        message: "No products found that need description generation",
        processed: 0,
      })
    }

    // Generate descriptions in batch
    const results = await aiContentGenerator.batchGenerateProductDescriptions(products as any[])

    // Update products with generated descriptions
    let successCount = 0
    let errorCount = 0

    for (const result of results) {
      try {
        if (!result.description.startsWith("Error generating")) {
          await db.execute("UPDATE products SET description = ?, updated_at = NOW() WHERE id = ?", [
            result.description,
            result.product_id,
          ])
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        console.error(`Failed to update product ${result.product_id}:`, error)
        errorCount++
      }
    }

    // Log batch operation
    await logEvent("ai_batch_product_descriptions", {
      requested_by: user.id,
      total_products: product_ids.length,
      processed_products: products.length,
      successful_updates: successCount,
      errors: errorCount,
      update_existing: update_existing,
    })

    return NextResponse.json({
      message: "Batch product description generation completed",
      total_requested: product_ids.length,
      products_processed: products.length,
      successful_updates: successCount,
      errors: errorCount,
      results: results.map((r) => ({
        product_id: r.product_id,
        success: !r.description.startsWith("Error generating"),
        description_length: r.description.length,
      })),
    })
  } catch (error) {
    console.error("Error in batch product description generation:", error)
    return NextResponse.json(
      {
        error: "Failed to process batch request",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
