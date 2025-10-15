import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@yeelo/shared-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Get customer segments (this would typically be from a segments table)
    // For now, we'll create some mock segments based on customer data
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          select: {
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    })

    // Create segments based on customer behavior
    const segments = [
      {
        id: "high-value",
        name: "High Value Customers",
        description: "Customers with high lifetime value",
        customerCount: customers.filter(c => 
          c.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0) > 1000
        ).length,
        criteria: "Total spent > ₹1000",
        updatedAt: new Date(),
      },
      {
        id: "frequent-buyers",
        name: "Frequent Buyers",
        description: "Customers who order regularly",
        customerCount: customers.filter(c => c.orders.length > 3).length,
        criteria: "More than 3 orders",
        updatedAt: new Date(),
      },
      {
        id: "new-customers",
        name: "New Customers",
        description: "Recently acquired customers",
        customerCount: customers.filter(c => {
          const daysSinceCreated = (Date.now() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceCreated < 30
        }).length,
        criteria: "Joined in last 30 days",
        updatedAt: new Date(),
      },
      {
        id: "inactive-customers",
        name: "Inactive Customers",
        description: "Customers who haven't ordered recently",
        customerCount: customers.filter(c => {
          if (c.orders.length === 0) return true
          const lastOrder = c.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
          const daysSinceLastOrder = (Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceLastOrder > 90
        }).length,
        criteria: "No orders in last 90 days",
        updatedAt: new Date(),
      },
    ]

    return NextResponse.json({
      success: true,
      segments,
      pagination: {
        page,
        limit,
        total: segments.length,
        pages: Math.ceil(segments.length / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching segments:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch segments" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, criteria, conditions } = body

    // Validate required fields
    if (!name || !description || !criteria) {
      return NextResponse.json(
        { success: false, error: "Name, description, and criteria are required" },
        { status: 400 }
      )
    }

    // Create segment (this would typically be saved to a segments table)
    // For now, we'll return a mock response
    const segment = {
      id: `segment-${Date.now()}`,
      name,
      description,
      criteria,
      conditions: conditions || [],
      customerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return NextResponse.json({
      success: true,
      segment,
    })
  } catch (error) {
    console.error("Error creating segment:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create segment" },
      { status: 500 }
    )
  }
}
