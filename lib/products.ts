/**
 * Product management utilities for Yeelo Homeopathy Platform
 * Handles product CRUD operations, inventory management, and stock tracking
 */

import { query, transaction, logEvent } from "./database"
import type {
  Product,
  ProductWithInventory,
  Inventory,
  InventoryUpdate,
  ProductFilter,
  PaginationParams,
} from "./types"

/**
 * Get all products with optional filtering and pagination
 */
export async function getProducts(
  shopId?: number,
  filters: ProductFilter = {},
  pagination: PaginationParams = {},
): Promise<{
  products: ProductWithInventory[]
  total: number
  page: number
  pages: number
}> {
  const { page = 1, limit = 20, sort = "created_at", order = "desc" } = pagination
  const offset = (page - 1) * limit

  // Build WHERE clause
  const conditions: string[] = ["p.is_active = true"]
  const values: any[] = []
  let paramCount = 1

  if (shopId) {
    conditions.push(`i.shop_id = $${paramCount++}`)
    values.push(shopId)
  }

  if (filters.category) {
    conditions.push(`p.category ILIKE $${paramCount++}`)
    values.push(`%${filters.category}%`)
  }

  if (filters.brand) {
    conditions.push(`p.brand ILIKE $${paramCount++}`)
    values.push(`%${filters.brand}%`)
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(`p.tags && $${paramCount++}`)
    values.push(filters.tags)
  }

  if (filters.price_min !== undefined) {
    conditions.push(`p.unit_price >= $${paramCount++}`)
    values.push(filters.price_min)
  }

  if (filters.price_max !== undefined) {
    conditions.push(`p.unit_price <= $${paramCount++}`)
    values.push(filters.price_max)
  }

  if (filters.in_stock) {
    conditions.push(`COALESCE(i.stock_qty, 0) > 0`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  // Get total count
  const countQuery = `
    SELECT COUNT(DISTINCT p.id)
    FROM products p
    ${shopId ? "LEFT JOIN inventory i ON p.id = i.product_id" : ""}
    ${whereClause}
  `

  const countResult = await query(countQuery, values)
  const total = Number.parseInt(countResult.rows[0].count)

  // Get products with inventory
  const productsQuery = `
    SELECT 
      p.id, p.uuid, p.sku, p.name, p.description, p.brand, p.category, 
      p.potency, p.unit_price, p.mrp, p.images, p.tags, p.indications,
      p.is_active, p.created_at, p.updated_at,
      COALESCE(i.stock_qty, 0) as stock_qty,
      COALESCE(i.reorder_point, 0) as reorder_point,
      ${shopId ? "i.shop_id" : "NULL as shop_id"}
    FROM products p
    ${shopId ? "LEFT JOIN inventory i ON p.id = i.product_id AND i.shop_id = $1" : ""}
    ${whereClause}
    ORDER BY p.${sort} ${order.toUpperCase()}
    LIMIT $${paramCount++} OFFSET $${paramCount++}
  `

  values.push(limit, offset)

  const result = await query<ProductWithInventory>(productsQuery, values)

  return {
    products: result.rows,
    total,
    page,
    pages: Math.ceil(total / limit),
  }
}

/**
 * Get a single product by ID with inventory information
 */
export async function getProductById(id: number, shopId?: number): Promise<ProductWithInventory | null> {
  const query_text = `
    SELECT 
      p.id, p.uuid, p.sku, p.name, p.description, p.brand, p.category, 
      p.potency, p.unit_price, p.mrp, p.images, p.tags, p.indications,
      p.is_active, p.created_at, p.updated_at,
      COALESCE(i.stock_qty, 0) as stock_qty,
      COALESCE(i.reorder_point, 0) as reorder_point,
      ${shopId ? "i.shop_id" : "NULL as shop_id"}
    FROM products p
    ${shopId ? "LEFT JOIN inventory i ON p.id = i.product_id AND i.shop_id = $2" : ""}
    WHERE p.id = $1 AND p.is_active = true
  `

  const values = shopId ? [id, shopId] : [id]
  const result = await query<ProductWithInventory>(query_text, values)

  return result.rows[0] || null
}

/**
 * Get a single product by SKU with inventory information
 */
export async function getProductBySku(sku: string, shopId?: number): Promise<ProductWithInventory | null> {
  const query_text = `
    SELECT 
      p.id, p.uuid, p.sku, p.name, p.description, p.brand, p.category, 
      p.potency, p.unit_price, p.mrp, p.images, p.tags, p.indications,
      p.is_active, p.created_at, p.updated_at,
      COALESCE(i.stock_qty, 0) as stock_qty,
      COALESCE(i.reorder_point, 0) as reorder_point,
      ${shopId ? "i.shop_id" : "NULL as shop_id"}
    FROM products p
    ${shopId ? "LEFT JOIN inventory i ON p.id = i.product_id AND i.shop_id = $2" : ""}
    WHERE p.sku = $1 AND p.is_active = true
  `

  const values = shopId ? [sku, shopId] : [sku]
  const result = await query<ProductWithInventory>(query_text, values)

  return result.rows[0] || null
}

/**
 * Create a new product
 */
export async function createProduct(productData: {
  sku: string
  name: string
  description?: string
  brand?: string
  category?: string
  potency?: string
  unit_price: number
  mrp?: number
  images?: string[]
  tags?: string[]
  indications?: string
}): Promise<Product> {
  const {
    sku,
    name,
    description,
    brand,
    category,
    potency,
    unit_price,
    mrp,
    images = [],
    tags = [],
    indications,
  } = productData

  // Check if SKU already exists
  const existingProduct = await query("SELECT id FROM products WHERE sku = $1", [sku])
  if (existingProduct.rows.length > 0) {
    throw new Error("Product with this SKU already exists")
  }

  const result = await query<Product>(
    `INSERT INTO products (sku, name, description, brand, category, potency, unit_price, mrp, images, tags, indications)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, uuid, sku, name, description, brand, category, potency, unit_price, mrp, images, tags, indications, is_active, created_at, updated_at`,
    [sku, name, description, brand, category, potency, unit_price, mrp, images, tags, indications],
  )

  const product = result.rows[0]

  // Log product creation event
  await logEvent("product_created", "product", product.id, {
    sku: product.sku,
    name: product.name,
    category: product.category,
    unit_price: product.unit_price,
  })

  return product
}

/**
 * Update a product
 */
export async function updateProduct(
  id: number,
  updates: {
    name?: string
    description?: string
    brand?: string
    category?: string
    potency?: string
    unit_price?: number
    mrp?: number
    images?: string[]
    tags?: string[]
    indications?: string
    is_active?: boolean
  },
): Promise<Product> {
  const fields = []
  const values = []
  let paramCount = 1

  // Build dynamic update query
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount}`)
      values.push(value)
      paramCount++
    }
  }

  if (fields.length === 0) {
    throw new Error("No fields to update")
  }

  values.push(id)

  const result = await query<Product>(
    `UPDATE products 
     SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount} AND is_active = true
     RETURNING id, uuid, sku, name, description, brand, category, potency, unit_price, mrp, images, tags, indications, is_active, created_at, updated_at`,
    values,
  )

  if (result.rows.length === 0) {
    throw new Error("Product not found")
  }

  const product = result.rows[0]

  // Log product update event
  await logEvent("product_updated", "product", product.id, {
    sku: product.sku,
    updates: Object.keys(updates),
  })

  return product
}

/**
 * Delete a product (soft delete)
 */
export async function deleteProduct(id: number): Promise<void> {
  const result = await query(
    "UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = true",
    [id],
  )

  if (result.rowCount === 0) {
    throw new Error("Product not found")
  }

  // Log product deletion event
  await logEvent("product_deleted", "product", id)
}

/**
 * Get inventory for a specific shop
 */
export async function getShopInventory(shopId: number): Promise<Inventory[]> {
  const result = await query<Inventory>(
    `SELECT i.id, i.product_id, i.shop_id, i.stock_qty, i.reorder_point, i.last_restocked, i.created_at, i.updated_at
     FROM inventory i
     JOIN products p ON i.product_id = p.id
     WHERE i.shop_id = $1 AND p.is_active = true
     ORDER BY i.updated_at DESC`,
    [shopId],
  )

  return result.rows
}

/**
 * Update inventory for a product in a shop
 */
export async function updateInventory(
  shopId: number,
  inventoryUpdate: InventoryUpdate,
  userId?: number,
): Promise<Inventory> {
  const { sku, change, reason, vendor } = inventoryUpdate

  return transaction(async (client) => {
    // Get product by SKU
    const productResult = await client.query("SELECT id, name FROM products WHERE sku = $1 AND is_active = true", [sku])

    if (productResult.rows.length === 0) {
      throw new Error("Product not found")
    }

    const product = productResult.rows[0]

    // Get or create inventory record
    let inventoryResult = await client.query(
      "SELECT id, stock_qty, reorder_point FROM inventory WHERE product_id = $1 AND shop_id = $2",
      [product.id, shopId],
    )

    let inventory
    if (inventoryResult.rows.length === 0) {
      // Create new inventory record
      inventoryResult = await client.query(
        `INSERT INTO inventory (product_id, shop_id, stock_qty, reorder_point)
         VALUES ($1, $2, $3, 5)
         RETURNING id, product_id, shop_id, stock_qty, reorder_point, last_restocked, created_at, updated_at`,
        [product.id, shopId, Math.max(0, change)],
      )
      inventory = inventoryResult.rows[0]
    } else {
      // Update existing inventory
      const currentStock = inventoryResult.rows[0].stock_qty
      const newStock = Math.max(0, currentStock + change)

      inventoryResult = await client.query(
        `UPDATE inventory 
         SET stock_qty = $1, last_restocked = CASE WHEN $2 > 0 THEN CURRENT_TIMESTAMP ELSE last_restocked END, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $3 AND shop_id = $4
         RETURNING id, product_id, shop_id, stock_qty, reorder_point, last_restocked, created_at, updated_at`,
        [newStock, change, product.id, shopId],
      )
      inventory = inventoryResult.rows[0]
    }

    // Log inventory change event
    await logEvent(
      "inventory_updated",
      "inventory",
      inventory.id,
      {
        product_sku: sku,
        product_name: product.name,
        shop_id: shopId,
        change,
        new_stock: inventory.stock_qty,
        reason,
        vendor,
      },
      userId,
    )

    // Check for low stock alert
    if (inventory.stock_qty <= inventory.reorder_point) {
      await logEvent("product_low_stock", "product", product.id, {
        product_sku: sku,
        product_name: product.name,
        shop_id: shopId,
        current_stock: inventory.stock_qty,
        reorder_point: inventory.reorder_point,
      })
    }

    return inventory
  })
}

/**
 * Set reorder point for a product in a shop
 */
export async function setReorderPoint(shopId: number, productId: number, reorderPoint: number): Promise<void> {
  const result = await query(
    `UPDATE inventory 
     SET reorder_point = $1, updated_at = CURRENT_TIMESTAMP
     WHERE product_id = $2 AND shop_id = $3`,
    [reorderPoint, productId, shopId],
  )

  if (result.rowCount === 0) {
    // Create inventory record if it doesn't exist
    await query(
      `INSERT INTO inventory (product_id, shop_id, stock_qty, reorder_point)
       VALUES ($1, $2, 0, $3)`,
      [productId, shopId, reorderPoint],
    )
  }

  // Log reorder point update
  await logEvent("reorder_point_updated", "inventory", null, {
    product_id: productId,
    shop_id: shopId,
    reorder_point: reorderPoint,
  })
}

/**
 * Get products with low stock
 */
export async function getLowStockProducts(shopId: number): Promise<ProductWithInventory[]> {
  const result = await query<ProductWithInventory>(
    `SELECT 
      p.id, p.uuid, p.sku, p.name, p.description, p.brand, p.category, 
      p.potency, p.unit_price, p.mrp, p.images, p.tags, p.indications,
      p.is_active, p.created_at, p.updated_at,
      i.stock_qty, i.reorder_point, i.shop_id
    FROM products p
    JOIN inventory i ON p.id = i.product_id
    WHERE i.shop_id = $1 AND i.stock_qty <= i.reorder_point AND p.is_active = true
    ORDER BY (i.stock_qty::float / NULLIF(i.reorder_point, 0)) ASC`,
    [shopId],
  )

  return result.rows
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string, shopId?: number): Promise<ProductWithInventory[]> {
  const query_text = `
    SELECT 
      p.id, p.uuid, p.sku, p.name, p.description, p.brand, p.category, 
      p.potency, p.unit_price, p.mrp, p.images, p.tags, p.indications,
      p.is_active, p.created_at, p.updated_at,
      COALESCE(i.stock_qty, 0) as stock_qty,
      COALESCE(i.reorder_point, 0) as reorder_point,
      ${shopId ? "i.shop_id" : "NULL as shop_id"}
    FROM products p
    ${shopId ? "LEFT JOIN inventory i ON p.id = i.product_id AND i.shop_id = $2" : ""}
    WHERE p.category ILIKE $1 AND p.is_active = true
    ORDER BY p.name
  `

  const values = shopId ? [`%${category}%`, shopId] : [`%${category}%`]
  const result = await query<ProductWithInventory>(query_text, values)

  return result.rows
}

/**
 * Search products by name, description, or tags
 */
export async function searchProducts(searchTerm: string, shopId?: number, limit = 20): Promise<ProductWithInventory[]> {
  const query_text = `
    SELECT 
      p.id, p.uuid, p.sku, p.name, p.description, p.brand, p.category, 
      p.potency, p.unit_price, p.mrp, p.images, p.tags, p.indications,
      p.is_active, p.created_at, p.updated_at,
      COALESCE(i.stock_qty, 0) as stock_qty,
      COALESCE(i.reorder_point, 0) as reorder_point,
      ${shopId ? "i.shop_id" : "NULL as shop_id"}
    FROM products p
    ${shopId ? "LEFT JOIN inventory i ON p.id = i.product_id AND i.shop_id = $2" : ""}
    WHERE (
      p.name ILIKE $1 OR 
      p.description ILIKE $1 OR 
      p.sku ILIKE $1 OR
      p.brand ILIKE $1 OR
      array_to_string(p.tags, ' ') ILIKE $1
    ) AND p.is_active = true
    ORDER BY 
      CASE 
        WHEN p.name ILIKE $1 THEN 1
        WHEN p.sku ILIKE $1 THEN 2
        WHEN p.brand ILIKE $1 THEN 3
        ELSE 4
      END,
      p.name
    LIMIT $${shopId ? 3 : 2}
  `

  const searchPattern = `%${searchTerm}%`
  const values = shopId ? [searchPattern, shopId, limit] : [searchPattern, limit]
  const result = await query<ProductWithInventory>(query_text, values)

  return result.rows
}

/**
 * Get inventory summary for a shop
 */
export async function getInventorySummary(shopId: number): Promise<{
  total_products: number
  total_stock_value: number
  low_stock_count: number
  out_of_stock_count: number
  categories: { category: string; count: number; stock_value: number }[]
}> {
  // Get overall summary
  const summaryResult = await query(
    `SELECT 
      COUNT(DISTINCT p.id) as total_products,
      SUM(COALESCE(i.stock_qty, 0) * p.unit_price) as total_stock_value,
      COUNT(CASE WHEN i.stock_qty <= i.reorder_point THEN 1 END) as low_stock_count,
      COUNT(CASE WHEN COALESCE(i.stock_qty, 0) = 0 THEN 1 END) as out_of_stock_count
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id AND i.shop_id = $1
    WHERE p.is_active = true`,
    [shopId],
  )

  // Get category breakdown
  const categoryResult = await query(
    `SELECT 
      p.category,
      COUNT(p.id) as count,
      SUM(COALESCE(i.stock_qty, 0) * p.unit_price) as stock_value
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id AND i.shop_id = $1
    WHERE p.is_active = true AND p.category IS NOT NULL
    GROUP BY p.category
    ORDER BY stock_value DESC`,
    [shopId],
  )

  const summary = summaryResult.rows[0]

  return {
    total_products: Number.parseInt(summary.total_products),
    total_stock_value: Number.parseFloat(summary.total_stock_value) || 0,
    low_stock_count: Number.parseInt(summary.low_stock_count),
    out_of_stock_count: Number.parseInt(summary.out_of_stock_count),
    categories: categoryResult.rows.map((row) => ({
      category: row.category,
      count: Number.parseInt(row.count),
      stock_value: Number.parseFloat(row.stock_value) || 0,
    })),
  }
}

/**
 * Bulk update inventory from CSV or array data
 */
export async function bulkUpdateInventory(
  shopId: number,
  updates: InventoryUpdate[],
  userId?: number,
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const update of updates) {
    try {
      await updateInventory(shopId, update, userId)
      success++
    } catch (error) {
      failed++
      errors.push(`${update.sku}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Log bulk update event
  await logEvent(
    "inventory_bulk_updated",
    "inventory",
    null,
    {
      shop_id: shopId,
      total_updates: updates.length,
      success,
      failed,
    },
    userId,
  )

  return { success, failed, errors }
}
