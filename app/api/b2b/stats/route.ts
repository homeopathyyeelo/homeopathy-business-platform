import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@yeelo/shared-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get("shopId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Build where clause
    const where: any = {
      source: "b2b",
    }

    if (shopId) {
      where.shopId = shopId
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Get B2B statistics
    const [
      totalOrders,
      totalRevenue,
      avgOrderValue,
      topProducts,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where,
        _avg: { totalAmount: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          order: where,
        },
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

    // Calculate growth rate (compare with previous period)
    const previousPeriodStart = new Date()
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 30)
    const previousPeriodEnd = new Date()
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1)

    const previousPeriodRevenue = await prisma.order.aggregate({
      where: {
        ...where,
        createdAt: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
      _sum: { totalAmount: true },
    })

    const currentRevenue = Number(totalRevenue._sum.totalAmount || 0)
    const previousRevenue = Number(previousPeriodRevenue._sum.totalAmount || 0)
    const growthRate = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    // Get top products with names
    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, category: true },
        })
        return {
          productId: item.productId,
          productName: product?.name || "Unknown Product",
          category: product?.category || "Unknown",
          totalQuantity: Number(item._sum.quantity || 0),
          orderCount: item._count.id,
        }
      })
    )

    const stats = {
      totalOrders,
      totalRevenue: currentRevenue,
      avgOrderValue: Number(avgOrderValue._avg.totalAmount || 0),
      growthRate: Math.round(growthRate * 100) / 100,
      topProducts: topProductsWithNames,
      recentOrders,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Error fetching B2B stats:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}
