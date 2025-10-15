/**
 * Order management utilities for Yeelo Homeopathy Platform
 * Handles order CRUD operations, order processing, and status management
 */

import { query, transaction, logEvent, generateOrderNumber } from "./database"
import { getProductById, updateInventory } from "./products"
import type { Order, OrderItem, OrderRequest, OrderFilter, PaginationParams, Product } from "./types"

/**
 * Get all orders with optional filtering and pagination
 */
export async function getOrders(
  filters: OrderFilter = {},
  pagination: PaginationParams = {},
): Promise<{
  orders: Order[]
  total: number
  page: number
  pages: number
}> {
  const { page = 1, limit = 20, sort = "created_at", order = "desc" } = pagination
  const offset = (page - 1) * limit

  // Build WHERE clause
  const conditions: string[] = []
  const values: any[] = []
  let paramCount = 1

  if (filters.status) {
    conditions.push(`o.status = $${paramCount++}`)
    values.push(filters.status)
  }

  if (filters.source) {
    conditions.push(`o.source = $${paramCount++}`)
    values.push(filters.source)
  }

  if (filters.customer_id) {
    conditions.push(`o.customer_id = $${paramCount++}`)
    values.push(filters.customer_id)
  }

  if (filters.shop_id) {
    conditions.push(`o.shop_id = $${paramCount++}`)
    values.push(filters.shop_id)
  }

  if (filters.date_from) {
    conditions.push(`o.created_at >= $${paramCount++}`)
    values.push(filters.date_from)
  }

  if (filters.date_to) {
    conditions.push(`o.created_at <= $${paramCount++}`)
    values.push(filters.date_to)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM orders o ${whereClause}`
  const countResult = await query(countQuery, values)
  const total = Number.parseInt(countResult.rows[0].count)

  // Get orders with customer and shop info
  const ordersQuery = `
    SELECT 
      o.id, o.uuid, o.customer_id, o.shop_id, o.order_number, o.status, o.source,
      o.total_amount, o.discount_amount, o.delivery_address, o.delivery_type, o.notes,
      o.created_at, o.updated_at,
      c.name as customer_name, c.phone as customer_phone,
      s.name as shop_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN shops s ON o.shop_id = s.id
    ${whereClause}
    ORDER BY o.${sort} ${order.toUpperCase()}
    LIMIT $${paramCount++} OFFSET $${paramCount++}
  `

  values.push(limit, offset)
  const result = await query(ordersQuery, values)

  // Transform results to include customer and shop objects
  const orders = result.rows.map((row) => ({
    id: row.id,
    uuid: row.uuid,
    customer_id: row.customer_id,
    shop_id: row.shop_id,
    order_number: row.order_number,
    status: row.status,
    source: row.source,
    total_amount: row.total_amount,
    discount_amount: row.discount_amount,
    delivery_address: row.delivery_address,
    delivery_type: row.delivery_type,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    customer: row.customer_name
      ? {
          id: row.customer_id,
          name: row.customer_name,
          phone: row.customer_phone,
        }
      : undefined,
    shop: row.shop_name
      ? {
          id: row.shop_id,
          name: row.shop_name,
        }
      : undefined,
  }))

  return {
    orders,
    total,
    page,
    pages: Math.ceil(total / limit),
  }
}

/**
 * Get a single order by ID with full details
 */
export async function getOrderById(id: number): Promise<Order | null> {
  const orderResult = await query(
    `SELECT 
      o.id, o.uuid, o.customer_id, o.shop_id, o.order_number, o.status, o.source,
      o.total_amount, o.discount_amount, o.delivery_address, o.delivery_type, o.notes,
      o.created_at, o.updated_at,
      c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
      s.name as shop_name, s.address as shop_address
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN shops s ON o.shop_id = s.id
    WHERE o.id = $1`,
    [id],
  )

  if (orderResult.rows.length === 0) {
    return null
  }

  const orderRow = orderResult.rows[0]

  // Get order items
  const itemsResult = await query(
    `SELECT 
      oi.id, oi.product_id, oi.quantity, oi.unit_price, oi.total_price,
      p.name as product_name, p.sku as product_sku, p.brand as product_brand
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = $1
    ORDER BY oi.id`,
    [id],
  )

  const items = itemsResult.rows.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    product: item.product_name
      ? {
          id: item.product_id,
          name: item.product_name,
          sku: item.product_sku,
          brand: item.product_brand,
        }
      : undefined,
  }))

  return {
    id: orderRow.id,
    uuid: orderRow.uuid,
    customer_id: orderRow.customer_id,
    shop_id: orderRow.shop_id,
    order_number: orderRow.order_number,
    status: orderRow.status,
    source: orderRow.source,
    total_amount: orderRow.total_amount,
    discount_amount: orderRow.discount_amount,
    delivery_address: orderRow.delivery_address,
    delivery_type: orderRow.delivery_type,
    notes: orderRow.notes,
    created_at: orderRow.created_at,
    updated_at: orderRow.updated_at,
    items,
    customer: orderRow.customer_name
      ? {
          id: orderRow.customer_id,
          name: orderRow.customer_name,
          phone: orderRow.customer_phone,
          email: orderRow.customer_email,
        }
      : undefined,
    shop: orderRow.shop_name
      ? {
          id: orderRow.shop_id,
          name: orderRow.shop_name,
          address: orderRow.shop_address,
        }
      : undefined,
  }
}

/**
 * Create a new order
 */
export async function createOrder(orderData: OrderRequest, userId?: number): Promise<Order> {
  const {
    customer_id,
    shop_id,
    items,
    source = "walkin",
    delivery_type = "pickup",
    delivery_address,
    notes,
  } = orderData

  if (!items || items.length === 0) {
    throw new Error("Order must have at least one item")
  }

  return transaction(async (client) => {
    // Validate products and calculate totals
    let totalAmount = 0
    const validatedItems: (OrderItem & { product: Product })[] = []

    for (const item of items) {
      const product = await getProductById(item.product_id, shop_id)
      if (!product) {
        throw new Error(`Product with ID ${item.product_id} not found`)
      }

      if (product.stock_qty < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stock_qty}, Requested: ${item.quantity}`,
        )
      }

      const itemTotal = item.unit_price * item.quantity
      totalAmount += itemTotal

      validatedItems.push({
        ...item,
        total_price: itemTotal,
        product,
      })
    }

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, shop_id, order_number, status, source, total_amount, delivery_type, delivery_address, notes)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8)
       RETURNING id, uuid, customer_id, shop_id, order_number, status, source, total_amount, discount_amount, delivery_type, delivery_address, notes, created_at, updated_at`,
      [customer_id, shop_id, orderNumber, source, totalAmount, delivery_type, delivery_address, notes],
    )

    const order = orderResult.rows[0]

    // Create order items and update inventory
    for (const item of validatedItems) {
      // Insert order item
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)",
        [order.id, item.product_id, item.quantity, item.unit_price, item.total_price],
      )

      // Update inventory (reduce stock)
      await updateInventory(
        shop_id,
        {
          sku: item.product.sku,
          change: -item.quantity,
          reason: `Order ${orderNumber}`,
        },
        userId,
      )
    }

    // Log order creation event
    await logEvent(
      "order_created",
      "order",
      order.id,
      {
        order_number: orderNumber,
        customer_id,
        shop_id,
        total_amount: totalAmount,
        items_count: items.length,
        source,
      },
      userId,
    )

    return order
  })
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  id: number,
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled",
  userId?: number,
): Promise<Order> {
  const result = await query(
    `UPDATE orders 
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, uuid, customer_id, shop_id, order_number, status, source, total_amount, discount_amount, delivery_type, delivery_address, notes, created_at, updated_at`,
    [status, id],
  )

  if (result.rows.length === 0) {
    throw new Error("Order not found")
  }

  const order = result.rows[0]

  // Log status update event
  await logEvent(
    "order_status_updated",
    "order",
    order.id,
    {
      order_number: order.order_number,
      old_status: "unknown", // Would need to fetch previous status
      new_status: status,
    },
    userId,
  )

  return order
}

/**
 * Cancel an order and restore inventory
 */
export async function cancelOrder(id: number, reason?: string, userId?: number): Promise<Order> {
  return transaction(async (client) => {
    // Get order details
    const orderResult = await client.query("SELECT id, order_number, status, shop_id FROM orders WHERE id = $1", [id])

    if (orderResult.rows.length === 0) {
      throw new Error("Order not found")
    }

    const order = orderResult.rows[0]

    if (order.status === "cancelled") {
      throw new Error("Order is already cancelled")
    }

    if (order.status === "delivered") {
      throw new Error("Cannot cancel a delivered order")
    }

    // Get order items to restore inventory
    const itemsResult = await client.query(
      `SELECT oi.product_id, oi.quantity, p.sku
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id],
    )

    // Update order status
    await client.query(
      "UPDATE orders SET status = 'cancelled', notes = COALESCE(notes || ' | ', '') || $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [`Cancelled: ${reason || "No reason provided"}`, id],
    )

    // Restore inventory for each item
    for (const item of itemsResult.rows) {
      await updateInventory(
        order.shop_id,
        {
          sku: item.sku,
          change: item.quantity,
          reason: `Order ${order.order_number} cancelled`,
        },
        userId,
      )
    }

    // Log cancellation event
    await logEvent(
      "order_cancelled",
      "order",
      order.id,
      {
        order_number: order.order_number,
        reason,
        items_restored: itemsResult.rows.length,
      },
      userId,
    )

    // Return updated order
    const updatedResult = await client.query(
      `SELECT id, uuid, customer_id, shop_id, order_number, status, source, total_amount, discount_amount, delivery_type, delivery_address, notes, created_at, updated_at
       FROM orders WHERE id = $1`,
      [id],
    )

    return updatedResult.rows[0]
  })
}

/**
 * Get order statistics
 */
export async function getOrderStats(
  shopId?: number,
  dateFrom?: Date,
  dateTo?: Date,
): Promise<{
  total_orders: number
  total_revenue: number
  average_order_value: number
  orders_by_status: { status: string; count: number; revenue: number }[]
  orders_by_source: { source: string; count: number; revenue: number }[]
  daily_orders: { date: string; count: number; revenue: number }[]
}> {
  let whereClause = ""
  const values: any[] = []
  let paramCount = 1

  if (shopId) {
    whereClause += `WHERE shop_id = $${paramCount++}`
    values.push(shopId)
  }

  if (dateFrom) {
    whereClause += whereClause ? " AND " : "WHERE "
    whereClause += `created_at >= $${paramCount++}`
    values.push(dateFrom)
  }

  if (dateTo) {
    whereClause += whereClause ? " AND " : "WHERE "
    whereClause += `created_at <= $${paramCount++}`
    values.push(dateTo)
  }

  // Get overall stats
  const statsResult = await query(
    `SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount - discount_amount) as total_revenue,
      AVG(total_amount - discount_amount) as average_order_value
    FROM orders ${whereClause}`,
    values,
  )

  // Get stats by status
  const statusResult = await query(
    `SELECT 
      status,
      COUNT(*) as count,
      SUM(total_amount - discount_amount) as revenue
    FROM orders ${whereClause}
    GROUP BY status
    ORDER BY count DESC`,
    values,
  )

  // Get stats by source
  const sourceResult = await query(
    `SELECT 
      source,
      COUNT(*) as count,
      SUM(total_amount - discount_amount) as revenue
    FROM orders ${whereClause}
    GROUP BY source
    ORDER BY count DESC`,
    values,
  )

  // Get daily stats for the last 30 days
  const dailyResult = await query(
    `SELECT 
      DATE(created_at) as date,
      COUNT(*) as count,
      SUM(total_amount - discount_amount) as revenue
    FROM orders 
    ${whereClause ? whereClause + " AND " : "WHERE "}created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC`,
    values,
  )

  const stats = statsResult.rows[0]

  return {
    total_orders: Number.parseInt(stats.total_orders),
    total_revenue: Number.parseFloat(stats.total_revenue) || 0,
    average_order_value: Number.parseFloat(stats.average_order_value) || 0,
    orders_by_status: statusResult.rows.map((row) => ({
      status: row.status,
      count: Number.parseInt(row.count),
      revenue: Number.parseFloat(row.revenue) || 0,
    })),
    orders_by_source: sourceResult.rows.map((row) => ({
      source: row.source,
      count: Number.parseInt(row.count),
      revenue: Number.parseFloat(row.revenue) || 0,
    })),
    daily_orders: dailyResult.rows.map((row) => ({
      date: row.date,
      count: Number.parseInt(row.count),
      revenue: Number.parseFloat(row.revenue) || 0,
    })),
  }
}

/**
 * Get customer's order history
 */
export async function getCustomerOrders(customerId: number, limit = 20): Promise<Order[]> {
  const result = await query(
    `SELECT 
      o.id, o.uuid, o.customer_id, o.shop_id, o.order_number, o.status, o.source,
      o.total_amount, o.discount_amount, o.delivery_address, o.delivery_type, o.notes,
      o.created_at, o.updated_at,
      s.name as shop_name
    FROM orders o
    LEFT JOIN shops s ON o.shop_id = s.id
    WHERE o.customer_id = $1
    ORDER BY o.created_at DESC
    LIMIT $2`,
    [customerId, limit],
  )

  return result.rows.map((row) => ({
    id: row.id,
    uuid: row.uuid,
    customer_id: row.customer_id,
    shop_id: row.shop_id,
    order_number: row.order_number,
    status: row.status,
    source: row.source,
    total_amount: row.total_amount,
    discount_amount: row.discount_amount,
    delivery_address: row.delivery_address,
    delivery_type: row.delivery_type,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    shop: row.shop_name
      ? {
          id: row.shop_id,
          name: row.shop_name,
        }
      : undefined,
  }))
}

/**
 * Search orders by order number or customer info
 */
export async function searchOrders(searchTerm: string, limit = 20): Promise<Order[]> {
  const searchPattern = `%${searchTerm}%`

  const result = await query(
    `SELECT 
      o.id, o.uuid, o.customer_id, o.shop_id, o.order_number, o.status, o.source,
      o.total_amount, o.discount_amount, o.delivery_address, o.delivery_type, o.notes,
      o.created_at, o.updated_at,
      c.name as customer_name, c.phone as customer_phone,
      s.name as shop_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN shops s ON o.shop_id = s.id
    WHERE o.order_number ILIKE $1 OR c.name ILIKE $1 OR c.phone ILIKE $1
    ORDER BY o.created_at DESC
    LIMIT $2`,
    [searchPattern, limit],
  )

  return result.rows.map((row) => ({
    id: row.id,
    uuid: row.uuid,
    customer_id: row.customer_id,
    shop_id: row.shop_id,
    order_number: row.order_number,
    status: row.status,
    source: row.source,
    total_amount: row.total_amount,
    discount_amount: row.discount_amount,
    delivery_address: row.delivery_address,
    delivery_type: row.delivery_type,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    customer: row.customer_name
      ? {
          id: row.customer_id,
          name: row.customer_name,
          phone: row.customer_phone,
        }
      : undefined,
    shop: row.shop_name
      ? {
          id: row.shop_id,
          name: row.shop_name,
        }
      : undefined,
  }))
}
