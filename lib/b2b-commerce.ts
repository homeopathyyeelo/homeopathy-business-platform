/**
 * B2B Commerce Management System
 * Handles dealer, distributor, and wholesaler transactions
 * 
 * Features:
 * - Multi-tier pricing system
 * - Credit management and approval workflows
 * - Bulk ordering capabilities
 * - Dealer-to-dealer (D2D) transactions
 * - Commission tracking
 * - Credit limit enforcement
 */

import { db } from "./database"
import type { Customer, Order, Product } from "./types"
import { OutboxWriter } from "./outbox"

export interface B2BCustomer {
  id: string
  name: string
  customer_type: 'dealer' | 'distributor' | 'wholesaler'
  customer_type_id: string
  credit_limit: number
  current_balance: number
  available_credit: number
  payment_terms: string
  auto_approval_limit: number
  discount_percentage: number
}

export interface B2BOrder {
  id: string
  customer_id: string
  customer_type: string
  order_type: 'B2B' | 'D2D'
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    total_price: number
    pricing_tier: string
  }>
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  credit_terms: string
  requires_approval: boolean
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
  created_at: Date
}

export interface PricingTier {
  id: string
  customer_type: string
  min_quantity: number
  max_quantity?: number
  price: number
  discount_percentage: number
}

export class B2BCommerceService {
  /**
   * Get customer type and pricing information
   */
  async getCustomerPricingInfo(customerId: string): Promise<B2BCustomer> {
    const query = `
      SELECT 
        c.id,
        c.name,
        ct.name as customer_type,
        ct.id as customer_type_id,
        ct.pricing_tier,
        cc.credit_limit,
        cc.current_balance,
        cc.available_credit,
        cc.payment_terms,
        ct.auto_approval_limit,
        ct.discount_percentage
      FROM customers c
      JOIN customer_types ct ON c.customer_type_id = ct.id
      LEFT JOIN customer_credit cc ON c.id = cc.customer_id
      WHERE c.id = $1
    `
    
    const result = await db.query(query, [customerId])
    if (!result.rows[0]) {
      throw new Error('Customer not found or not B2B customer')
    }
    
    return result.rows[0]
  }

  /**
   * Calculate B2B pricing for order items
   */
  async calculateB2BPricing(
    items: Array<{ product_id: string; quantity: number }>,
    customerType: string,
    companyId?: string
  ): Promise<Array<{ product_id: string; quantity: number; unit_price: number; total_price: number; pricing_tier: string }>> {
    const productIds = items.map(item => item.product_id)
    
    const query = `
      SELECT 
        p.id as product_id,
        p.name,
        p.cost_price,
        p.mrp,
        pt.price,
        pt.min_quantity,
        pt.max_quantity,
        ct.name as pricing_tier
      FROM products p
      JOIN product_pricing_tiers pt ON p.id = pt.product_id
      JOIN customer_types ct ON pt.customer_type_id = ct.id
      WHERE p.id = ANY($1) 
        AND ct.name = $2
        AND (pt.effective_until IS NULL OR pt.effective_until >= CURRENT_DATE)
        AND (pt.effective_from <= CURRENT_DATE)
        ${companyId ? 'AND p.company_id = $3' : ''}
      ORDER BY p.id, pt.min_quantity DESC
    `
    
    const params = companyId ? [productIds, customerType, companyId] : [productIds, customerType]
    const result = await db.query(query, params)
    
    return items.map(item => {
      const pricing = result.rows.find(row => 
        row.product_id === item.product_id && 
        item.quantity >= row.min_quantity && 
        (row.max_quantity === null || item.quantity <= row.max_quantity)
      )
      
      if (!pricing) {
        throw new Error(`No pricing found for product ${item.product_id} with quantity ${item.quantity}`)
      }
      
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: pricing.price,
        total_price: pricing.price * item.quantity,
        pricing_tier: pricing.pricing_tier
      }
    })
  }

  /**
   * Validate credit limit for B2B order
   */
  async validateCreditLimit(customerId: string, orderAmount: number): Promise<boolean> {
    const customer = await this.getCustomerPricingInfo(customerId)
    
    if (orderAmount > customer.available_credit) {
      throw new Error(`Order amount ${orderAmount} exceeds available credit ${customer.available_credit}`)
    }
    
    return true
  }

  /**
   * Create B2B order with approval workflow
   */
  async createB2BOrder(orderData: {
    customer_id: string
    items: Array<{ product_id: string; quantity: number }>
    credit_terms?: string
    delivery_date?: Date
    notes?: string
    created_by: string
  }): Promise<B2BOrder> {
    // 1. Get customer information
    const customer = await this.getCustomerPricingInfo(orderData.customer_id)
    
    // 2. Calculate pricing
    const pricedItems = await this.calculateB2BPricing(
      orderData.items,
      customer.customer_type
    )
    
    // 3. Calculate totals
    const subtotal = pricedItems.reduce((sum, item) => sum + item.total_price, 0)
    const discountAmount = subtotal * (customer.discount_percentage / 100)
    const taxableAmount = subtotal - discountAmount
    const taxAmount = taxableAmount * 0.18 // GST 18%
    const totalAmount = taxableAmount + taxAmount
    
    // 4. Validate credit limit
    await this.validateCreditLimit(orderData.customer_id, totalAmount)
    
    // 5. Check if approval is required
    const requiresApproval = totalAmount > customer.auto_approval_limit
    
    // 6. Create order with transaction and outbox events
    const order = await db.transaction(async (trx) => {
      const orderQuery = `
        INSERT INTO orders (
          customer_id, shop_id, order_type, customer_type_id,
          total_amount, discount_amount, status, credit_terms,
          requires_approval, notes, created_at, updated_at
        ) VALUES (
          $1, $2, 'B2B', $3, $4, $5, 
          ${requiresApproval ? "'pending_approval'" : "'confirmed'"},
          $6, $7, $8, NOW(), NOW()
        ) RETURNING *
      `
      
      const orderResult = await trx.query(orderQuery, [
        orderData.customer_id,
        'default_shop_id', // TODO: Get from context
        customer.customer_type_id,
        totalAmount,
        discountAmount,
        orderData.credit_terms || customer.payment_terms,
        orderData.notes,
        orderData.created_by
      ])
      
      const order = orderResult.rows[0]
      
      // 7. Create order items
      for (const item of pricedItems) {
        await trx.query(`
          INSERT INTO order_items (order_id, product_id, quantity, price, total_price)
          VALUES ($1, $2, $3, $4, $5)
        `, [order.id, item.product_id, item.quantity, item.unit_price, item.total_price])
      }
      
      // 8. Update customer credit balance if order is confirmed
      if (!requiresApproval) {
        await trx.query(`
          UPDATE customer_credit 
          SET current_balance = current_balance + $1,
              updated_at = NOW()
          WHERE customer_id = $2
        `, [totalAmount, orderData.customer_id])
      }
      
      // 9. Write outbox events
      const events = [
        {
          aggregate_type: 'order',
          aggregate_id: order.id,
          event_type: 'order.created',
          payload: {
            order_id: order.id,
            customer_id: orderData.customer_id,
            customer_type: customer.customer_type,
            order_type: 'B2B',
            total_amount: totalAmount,
            requires_approval: requiresApproval,
            items: pricedItems,
            created_at: new Date().toISOString()
          }
        }
      ]
      
      if (requiresApproval) {
        events.push({
          aggregate_type: 'order',
          aggregate_id: order.id,
          event_type: 'order.requires_approval',
          payload: {
            order_id: order.id,
            total_amount: totalAmount,
            approval_reason: 'Amount exceeds auto-approval limit',
            created_at: new Date().toISOString()
          } as any
        })
      }
      
      await OutboxWriter.writeEvents(events)
      
      return order
    })
    
    // 10. Trigger approval workflow if needed (outside transaction)
    if (requiresApproval) {
      await this.triggerApprovalWorkflow(order.id, totalAmount)
    }
    
    return {
      id: order.id,
      customer_id: order.customer_id,
      customer_type: customer.customer_type,
      order_type: 'B2B',
      items: pricedItems,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      credit_terms: order.credit_terms,
      requires_approval: requiresApproval,
      status: requiresApproval ? 'pending' : 'approved',
      created_at: order.created_at
    }
  }

  /**
   * Create D2D (Dealer-to-Dealer) transaction
   */
  async createD2DTransaction(transactionData: {
    seller_customer_id: string
    buyer_customer_id: string
    items: Array<{ product_id: string; quantity: number; transfer_price: number }>
    commission_percentage: number
    notes?: string
    created_by: string
  }): Promise<B2BOrder> {
    // 1. Validate both customers are dealers
    const seller = await this.getCustomerPricingInfo(transactionData.seller_customer_id)
    const buyer = await this.getCustomerPricingInfo(transactionData.buyer_customer_id)
    
    if (seller.customer_type !== 'dealer' || buyer.customer_type !== 'dealer') {
      throw new Error('Both customers must be dealers for D2D transactions')
    }
    
    // 2. Calculate totals
    const subtotal = transactionData.items.reduce(
      (sum, item) => sum + (item.transfer_price * item.quantity), 0
    )
    const commissionAmount = subtotal * (transactionData.commission_percentage / 100)
    const totalAmount = subtotal + commissionAmount
    
    // 3. Create D2D order
    const orderQuery = `
      INSERT INTO orders (
        customer_id, shop_id, order_type, customer_type_id,
        total_amount, discount_amount, status, notes,
        created_at, updated_at
      ) VALUES (
        $1, $2, 'D2D', $3, $4, $5, 'confirmed', $6, NOW(), NOW()
      ) RETURNING *
    `
    
    const orderResult = await db.query(orderQuery, [
      transactionData.buyer_customer_id,
      'default_shop_id',
      buyer.customer_type_id,
      totalAmount,
      commissionAmount,
      transactionData.notes
    ])
    
    const order = orderResult.rows[0]
    
    // 4. Create order items
    for (const item of transactionData.items) {
      await db.query(`
        INSERT INTO order_items (order_id, product_id, quantity, price, total_price)
        VALUES ($1, $2, $3, $4, $5)
      `, [order.id, item.product_id, item.quantity, item.transfer_price, item.transfer_price * item.quantity])
    }
    
    // 5. Record commission
    await db.query(`
      INSERT INTO d2d_commissions (
        order_id, seller_customer_id, buyer_customer_id,
        commission_amount, commission_percentage, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      order.id,
      transactionData.seller_customer_id,
      transactionData.buyer_customer_id,
      commissionAmount,
      transactionData.commission_percentage
    ])
    
    return {
      id: order.id,
      customer_id: order.customer_id,
      customer_type: buyer.customer_type,
      order_type: 'D2D',
      items: transactionData.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.transfer_price,
        total_price: item.transfer_price * item.quantity,
        pricing_tier: 'D2D'
      })),
      subtotal,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: totalAmount,
      credit_terms: 'D2D',
      requires_approval: false,
      status: 'approved',
      created_at: order.created_at
    }
  }

  /**
   * Approve B2B order
   */
  async approveB2BOrder(orderId: string, approvedBy: string): Promise<void> {
    const order = await db.query('SELECT * FROM orders WHERE id = $1', [orderId])
    if (!order.rows[0]) {
      throw new Error('Order not found')
    }
    
    if (order.rows[0].status !== 'pending_approval') {
      throw new Error('Order is not pending approval')
    }
    
    // Update order status with transaction and outbox events
    await db.transaction(async (trx) => {
      // Update order status
      await trx.query(`
        UPDATE orders 
        SET status = 'confirmed', 
            approved_by = $1, 
            approved_at = NOW(),
            updated_at = NOW()
        WHERE id = $2
      `, [approvedBy, orderId])
      
      // Update customer credit balance
      await trx.query(`
        UPDATE customer_credit 
        SET current_balance = current_balance + $1,
            updated_at = NOW()
        WHERE customer_id = $2
      `, [order.rows[0].total_amount, order.rows[0].customer_id])
      
      // Write outbox events
      await OutboxWriter.writeEvents([
        {
          aggregate_type: 'order',
          aggregate_id: orderId,
          event_type: 'order.approved',
          payload: {
            order_id: orderId,
            approved_by: approvedBy,
            total_amount: order.rows[0].total_amount,
            customer_id: order.rows[0].customer_id,
            approved_at: new Date().toISOString()
          }
        }
      ])
    })
    
    // Send notification to customer (outside transaction)
    await this.sendOrderApprovalNotification(orderId)
  }

  /**
   * Reject B2B order
   */
  async rejectB2BOrder(orderId: string, rejectedBy: string, reason: string): Promise<void> {
    await db.query(`
      UPDATE orders 
      SET status = 'rejected', 
          approved_by = $1, 
          approved_at = NOW(),
          notes = COALESCE(notes, '') || ' Rejection reason: ' || $3,
          updated_at = NOW()
      WHERE id = $2
    `, [rejectedBy, orderId, reason])
    
    // Send rejection notification
    await this.sendOrderRejectionNotification(orderId, reason)
  }

  /**
   * Get pending approval orders
   */
  async getPendingApprovalOrders(shopId?: string): Promise<B2BOrder[]> {
    const query = `
      SELECT 
        o.*,
        c.name as customer_name,
        ct.name as customer_type_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN customer_types ct ON o.customer_type_id = ct.id
      WHERE o.status = 'pending_approval'
        AND o.order_type = 'B2B'
        ${shopId ? 'AND o.shop_id = $1' : ''}
      ORDER BY o.created_at ASC
    `
    
    const result = await db.query(query, shopId ? [shopId] : [])
    
    return result.rows.map(row => ({
      id: row.id,
      customer_id: row.customer_id,
      customer_type: row.customer_type_name,
      order_type: 'B2B',
      items: [], // TODO: Load order items
      subtotal: row.total_amount - row.discount_amount,
      discount_amount: row.discount_amount,
      tax_amount: 0, // TODO: Calculate from order items
      total_amount: row.total_amount,
      credit_terms: row.credit_terms,
      requires_approval: true,
      status: 'pending',
      created_at: row.created_at
    }))
  }

  /**
   * Get B2B order history for customer
   */
  async getB2BOrderHistory(customerId: string, limit = 50, offset = 0): Promise<B2BOrder[]> {
    const query = `
      SELECT 
        o.*,
        ct.name as customer_type_name
      FROM orders o
      JOIN customer_types ct ON o.customer_type_id = ct.id
      WHERE o.customer_id = $1
        AND o.order_type IN ('B2B', 'D2D')
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `
    
    const result = await db.query(query, [customerId, limit, offset])
    
    return result.rows.map(row => ({
      id: row.id,
      customer_id: row.customer_id,
      customer_type: row.customer_type_name,
      order_type: row.order_type,
      items: [], // TODO: Load order items
      subtotal: row.total_amount - row.discount_amount,
      discount_amount: row.discount_amount,
      tax_amount: 0, // TODO: Calculate from order items
      total_amount: row.total_amount,
      credit_terms: row.credit_terms,
      requires_approval: row.requires_approval,
      status: row.status,
      created_at: row.created_at
    }))
  }

  /**
   * Trigger approval workflow
   */
  private async triggerApprovalWorkflow(orderId: string, amount: number): Promise<void> {
    // TODO: Implement approval workflow
    // - Send notification to approvers
    // - Create approval task
    // - Set up escalation rules
    
    console.log(`Approval workflow triggered for order ${orderId} with amount ${amount}`)
  }

  /**
   * Send order approval notification
   */
  private async sendOrderApprovalNotification(orderId: string): Promise<void> {
    // TODO: Implement notification system
    console.log(`Order approval notification sent for order ${orderId}`)
  }

  /**
   * Send order rejection notification
   */
  private async sendOrderRejectionNotification(orderId: string, reason: string): Promise<void> {
    // TODO: Implement notification system
    console.log(`Order rejection notification sent for order ${orderId}: ${reason}`)
  }
}

export const b2bCommerceService = new B2BCommerceService()
