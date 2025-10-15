/**
 * Customer management utilities for Yeelo Homeopathy Platform
 * Handles customer CRUD operations, consent management, and area linking
 */

import { query, transaction, logEvent, validatePhoneNumber } from "./database"
import type { Customer, Address, CustomerFilter, PaginationParams } from "./types"

/**
 * Get all customers with optional filtering and pagination
 */
export async function getCustomers(
  filters: CustomerFilter = {},
  pagination: PaginationParams = {},
): Promise<{
  customers: Customer[]
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

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(`c.tags && $${paramCount++}`)
    values.push(filters.tags)
  }

  if (filters.areas && filters.areas.length > 0) {
    conditions.push(`EXISTS (
      SELECT 1 FROM customer_areas ca 
      WHERE ca.customer_id = c.id AND ca.area_id = ANY($${paramCount++})
    )`)
    values.push(filters.areas)
  }

  if (filters.consent_marketing !== undefined) {
    conditions.push(`c.consent_marketing = $${paramCount++}`)
    values.push(filters.consent_marketing)
  }

  if (filters.consent_whatsapp !== undefined) {
    conditions.push(`c.consent_whatsapp = $${paramCount++}`)
    values.push(filters.consent_whatsapp)
  }

  if (filters.consent_sms !== undefined) {
    conditions.push(`c.consent_sms = $${paramCount++}`)
    values.push(filters.consent_sms)
  }

  if (filters.preferred_language) {
    conditions.push(`c.preferred_language = $${paramCount++}`)
    values.push(filters.preferred_language)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM customers c ${whereClause}`
  const countResult = await query(countQuery, values)
  const total = Number.parseInt(countResult.rows[0].count)

  // Get customers
  const customersQuery = `
    SELECT c.id, c.uuid, c.name, c.phone, c.email, c.addresses, c.tags, 
           c.consent_marketing, c.consent_sms, c.consent_whatsapp, 
           c.preferred_language, c.created_at, c.updated_at
    FROM customers c
    ${whereClause}
    ORDER BY c.${sort} ${order.toUpperCase()}
    LIMIT $${paramCount++} OFFSET $${paramCount++}
  `

  values.push(limit, offset)
  const result = await query<Customer>(customersQuery, values)

  return {
    customers: result.rows,
    total,
    page,
    pages: Math.ceil(total / limit),
  }
}

/**
 * Get a single customer by ID
 */
export async function getCustomerById(id: number): Promise<Customer | null> {
  const result = await query<Customer>(
    `SELECT id, uuid, name, phone, email, addresses, tags, 
            consent_marketing, consent_sms, consent_whatsapp, 
            preferred_language, created_at, updated_at
     FROM customers 
     WHERE id = $1`,
    [id],
  )

  return result.rows[0] || null
}

/**
 * Get a single customer by phone number
 */
export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const cleanPhone = phone.replace(/\D/g, "").slice(-10)

  const result = await query<Customer>(
    `SELECT id, uuid, name, phone, email, addresses, tags, 
            consent_marketing, consent_sms, consent_whatsapp, 
            preferred_language, created_at, updated_at
     FROM customers 
     WHERE phone LIKE $1`,
    [`%${cleanPhone}`],
  )

  return result.rows[0] || null
}

/**
 * Create a new customer
 */
export async function createCustomer(customerData: {
  name: string
  phone: string
  email?: string
  addresses?: Address[]
  tags?: string[]
  consent_marketing?: boolean
  consent_sms?: boolean
  consent_whatsapp?: boolean
  preferred_language?: "en" | "hi" | "hinglish"
}): Promise<Customer> {
  const {
    name,
    phone,
    email,
    addresses = [],
    tags = [],
    consent_marketing = false,
    consent_sms = false,
    consent_whatsapp = false,
    preferred_language = "en",
  } = customerData

  // Validate phone number
  if (!validatePhoneNumber(phone)) {
    throw new Error("Invalid phone number format")
  }

  const cleanPhone = phone.replace(/\D/g, "").slice(-10)

  // Check if customer already exists
  const existingCustomer = await getCustomerByPhone(cleanPhone)
  if (existingCustomer) {
    throw new Error("Customer with this phone number already exists")
  }

  // Validate email if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email format")
  }

  const result = await query<Customer>(
    `INSERT INTO customers (name, phone, email, addresses, tags, consent_marketing, consent_sms, consent_whatsapp, preferred_language)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, uuid, name, phone, email, addresses, tags, consent_marketing, consent_sms, consent_whatsapp, preferred_language, created_at, updated_at`,
    [
      name.trim(),
      cleanPhone,
      email?.trim(),
      JSON.stringify(addresses),
      tags,
      consent_marketing,
      consent_sms,
      consent_whatsapp,
      preferred_language,
    ],
  )

  const customer = result.rows[0]

  // Log customer creation event
  await logEvent("customer_created", "customer", customer.id, {
    name: customer.name,
    phone: customer.phone,
    consent_marketing,
    consent_whatsapp,
    consent_sms,
  })

  return customer
}

/**
 * Update a customer
 */
export async function updateCustomer(
  id: number,
  updates: {
    name?: string
    email?: string
    addresses?: Address[]
    tags?: string[]
    consent_marketing?: boolean
    consent_sms?: boolean
    consent_whatsapp?: boolean
    preferred_language?: "en" | "hi" | "hinglish"
  },
): Promise<Customer> {
  const fields = []
  const values = []
  let paramCount = 1

  // Build dynamic update query
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      if (key === "addresses") {
        fields.push(`${key} = $${paramCount}`)
        values.push(JSON.stringify(value))
      } else {
        fields.push(`${key} = $${paramCount}`)
        values.push(value)
      }
      paramCount++
    }
  }

  if (fields.length === 0) {
    throw new Error("No fields to update")
  }

  // Validate email if being updated
  if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
    throw new Error("Invalid email format")
  }

  values.push(id)

  const result = await query<Customer>(
    `UPDATE customers 
     SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, uuid, name, phone, email, addresses, tags, consent_marketing, consent_sms, consent_whatsapp, preferred_language, created_at, updated_at`,
    values,
  )

  if (result.rows.length === 0) {
    throw new Error("Customer not found")
  }

  const customer = result.rows[0]

  // Log customer update event
  await logEvent("customer_updated", "customer", customer.id, {
    updates: Object.keys(updates),
  })

  return customer
}

/**
 * Delete a customer (soft delete by removing consent)
 */
export async function deleteCustomer(id: number): Promise<void> {
  const result = await query(
    `UPDATE customers 
     SET consent_marketing = false, consent_sms = false, consent_whatsapp = false, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [id],
  )

  if (result.rowCount === 0) {
    throw new Error("Customer not found")
  }

  // Log customer deletion event
  await logEvent("customer_deleted", "customer", id)
}

/**
 * Search customers by name, phone, or email
 */
export async function searchCustomers(searchTerm: string, limit = 20): Promise<Customer[]> {
  const searchPattern = `%${searchTerm}%`

  const result = await query<Customer>(
    `SELECT id, uuid, name, phone, email, addresses, tags, 
            consent_marketing, consent_sms, consent_whatsapp, 
            preferred_language, created_at, updated_at
     FROM customers 
     WHERE name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1
     ORDER BY 
       CASE 
         WHEN name ILIKE $1 THEN 1
         WHEN phone ILIKE $1 THEN 2
         ELSE 3
       END,
       name
     LIMIT $2`,
    [searchPattern, limit],
  )

  return result.rows
}

/**
 * Link customer to local area
 */
export async function linkCustomerToArea(customerId: number, areaId: number, isPrimary = false): Promise<void> {
  return transaction(async (client) => {
    // If setting as primary, remove primary flag from other areas
    if (isPrimary) {
      await client.query("UPDATE customer_areas SET is_primary = false WHERE customer_id = $1", [customerId])
    }

    // Insert or update the link
    await client.query(
      `INSERT INTO customer_areas (customer_id, area_id, is_primary)
       VALUES ($1, $2, $3)
       ON CONFLICT (customer_id, area_id) 
       DO UPDATE SET is_primary = $3, created_at = CURRENT_TIMESTAMP`,
      [customerId, areaId, isPrimary],
    )

    // Log area linking event
    await logEvent("customer_area_linked", "customer", customerId, {
      area_id: areaId,
      is_primary: isPrimary,
    })
  })
}

/**
 * Get customers by area
 */
export async function getCustomersByArea(
  areaId: number,
  consentType?: "marketing" | "sms" | "whatsapp",
): Promise<Customer[]> {
  let consentCondition = ""
  if (consentType === "marketing") consentCondition = "AND c.consent_marketing = true"
  if (consentType === "sms") consentCondition = "AND c.consent_sms = true"
  if (consentType === "whatsapp") consentCondition = "AND c.consent_whatsapp = true"

  const result = await query<Customer>(
    `SELECT c.id, c.uuid, c.name, c.phone, c.email, c.addresses, c.tags, 
            c.consent_marketing, c.consent_sms, c.consent_whatsapp, 
            c.preferred_language, c.created_at, c.updated_at
     FROM customers c
     JOIN customer_areas ca ON c.id = ca.customer_id
     WHERE ca.area_id = $1 ${consentCondition}
     ORDER BY c.name`,
    [areaId],
  )

  return result.rows
}

/**
 * Get customer statistics
 */
export async function getCustomerStats(): Promise<{
  total_customers: number
  marketing_consent: number
  whatsapp_consent: number
  sms_consent: number
  by_language: { language: string; count: number }[]
  by_area: { area_name: string; count: number }[]
  recent_registrations: number // Last 30 days
}> {
  // Get overall stats
  const statsResult = await query(`
    SELECT 
      COUNT(*) as total_customers,
      COUNT(CASE WHEN consent_marketing = true THEN 1 END) as marketing_consent,
      COUNT(CASE WHEN consent_whatsapp = true THEN 1 END) as whatsapp_consent,
      COUNT(CASE WHEN consent_sms = true THEN 1 END) as sms_consent,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_registrations
    FROM customers
  `)

  // Get language breakdown
  const languageResult = await query(`
    SELECT preferred_language as language, COUNT(*) as count
    FROM customers
    GROUP BY preferred_language
    ORDER BY count DESC
  `)

  // Get area breakdown
  const areaResult = await query(`
    SELECT la.name as area_name, COUNT(ca.customer_id) as count
    FROM local_areas la
    JOIN customer_areas ca ON la.id = ca.area_id
    GROUP BY la.id, la.name
    ORDER BY count DESC
    LIMIT 10
  `)

  const stats = statsResult.rows[0]

  return {
    total_customers: Number.parseInt(stats.total_customers),
    marketing_consent: Number.parseInt(stats.marketing_consent),
    whatsapp_consent: Number.parseInt(stats.whatsapp_consent),
    sms_consent: Number.parseInt(stats.sms_consent),
    by_language: languageResult.rows.map((row) => ({
      language: row.language,
      count: Number.parseInt(row.count),
    })),
    by_area: areaResult.rows.map((row) => ({
      area_name: row.area_name,
      count: Number.parseInt(row.count),
    })),
    recent_registrations: Number.parseInt(stats.recent_registrations),
  }
}

/**
 * Update customer consent preferences
 */
export async function updateCustomerConsent(
  id: number,
  consent: {
    marketing?: boolean
    sms?: boolean
    whatsapp?: boolean
  },
): Promise<Customer> {
  const fields = []
  const values = []
  let paramCount = 1

  if (consent.marketing !== undefined) {
    fields.push(`consent_marketing = $${paramCount++}`)
    values.push(consent.marketing)
  }

  if (consent.sms !== undefined) {
    fields.push(`consent_sms = $${paramCount++}`)
    values.push(consent.sms)
  }

  if (consent.whatsapp !== undefined) {
    fields.push(`consent_whatsapp = $${paramCount++}`)
    values.push(consent.whatsapp)
  }

  if (fields.length === 0) {
    throw new Error("No consent fields to update")
  }

  values.push(id)

  const result = await query<Customer>(
    `UPDATE customers 
     SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, uuid, name, phone, email, addresses, tags, consent_marketing, consent_sms, consent_whatsapp, preferred_language, created_at, updated_at`,
    values,
  )

  if (result.rows.length === 0) {
    throw new Error("Customer not found")
  }

  const customer = result.rows[0]

  // Log consent update event
  await logEvent("customer_consent_updated", "customer", customer.id, consent)

  return customer
}

/**
 * Add tags to customer
 */
export async function addCustomerTags(id: number, newTags: string[]): Promise<Customer> {
  const result = await query<Customer>(
    `UPDATE customers 
     SET tags = array(SELECT DISTINCT unnest(tags || $1)), updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, uuid, name, phone, email, addresses, tags, consent_marketing, consent_sms, consent_whatsapp, preferred_language, created_at, updated_at`,
    [newTags, id],
  )

  if (result.rows.length === 0) {
    throw new Error("Customer not found")
  }

  const customer = result.rows[0]

  // Log tag addition event
  await logEvent("customer_tags_added", "customer", customer.id, { added_tags: newTags })

  return customer
}

/**
 * Remove tags from customer
 */
export async function removeCustomerTags(id: number, tagsToRemove: string[]): Promise<Customer> {
  const result = await query<Customer>(
    `UPDATE customers 
     SET tags = array(SELECT unnest(tags) EXCEPT SELECT unnest($1)), updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, uuid, name, phone, email, addresses, tags, consent_marketing, consent_sms, consent_whatsapp, preferred_language, created_at, updated_at`,
    [tagsToRemove, id],
  )

  if (result.rows.length === 0) {
    throw new Error("Customer not found")
  }

  const customer = result.rows[0]

  // Log tag removal event
  await logEvent("customer_tags_removed", "customer", customer.id, { removed_tags: tagsToRemove })

  return customer
}
