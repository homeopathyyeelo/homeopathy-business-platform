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

    // Get products with inventory
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

    // Calculate total stock for each product
    const productsWithStock = products.map((product) => ({
      ...product,
      totalStock: product.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
      inStock: product.inventory.some(inv => inv.quantity > 0),
    }))

    return NextResponse.json({
      success: true,
      products: productsWithStock,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, category, imageUrl, shopId } = body

    // Validate required fields
    if (!name || !price || !shopId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        category,
        imageUrl,
        shopId,
      },
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    )
  }
}