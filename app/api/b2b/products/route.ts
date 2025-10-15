import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@yeelo/shared-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Build where clause
    const where: any = {
      isActive: true,
    }

    if (category && category !== "all") {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get products with B2B pricing
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          inventory: {
            where: { quantity: { gt: 0 } },
            select: {
              quantity: true,
              shopId: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ])

    // Apply B2B pricing (dealer discount)
    const productsWithB2BPricing = products.map((product) => {
      const dealerPrice = product.price * 0.8 // 20% dealer discount
      return {
        ...product,
        price: dealerPrice,
        originalPrice: product.price,
        dealerDiscount: 20,
        totalStock: product.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
        inStock: product.inventory.some(inv => inv.quantity > 0),
      }
    })

    return NextResponse.json({
      success: true,
      products: productsWithB2BPricing,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching B2B products:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}
