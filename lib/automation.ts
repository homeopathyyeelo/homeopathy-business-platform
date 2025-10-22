/**
 * Marketing Automation Engine
 * Handles trigger-based campaigns, drip sequences, and automated workflows
 *
 * Features:
 * - Trigger-based campaigns (order placed, birthday, abandoned cart)
 * - Drip email/message sequences
 * - Customer journey automation
 * - Behavioral triggers
 * - A/B testing for automated campaigns
 */

import { db } from "./database"
import { campaignManager } from "./campaigns"

export class AutomationEngine {
  /**
   * Process automation triggers (called by cron job or event handlers)
   */
  async processTriggers(): Promise<void> {
    // Process different types of triggers
    await this.processBirthdayTriggers()
    await this.processAbandonedCartTriggers()
    await this.processOrderFollowUpTriggers()
    await this.processInactiveCustomerTriggers()
    await this.processReorderReminderTriggers()
  }

  /**
   * Process birthday triggers - send birthday wishes and offers
   */
  private async processBirthdayTriggers(): Promise<void> {
    const query = `
      SELECT c.*, ca.area_name
      FROM customers c
      LEFT JOIN customer_areas ca ON c.area_id = ca.id
      WHERE c.consent_marketing = 1
      AND c.date_of_birth IS NOT NULL
      AND DATE_FORMAT(c.date_of_birth, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d')
      AND c.id NOT IN (
        SELECT customer_id FROM campaign_messages 
        WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE type = 'birthday'
        )
        AND DATE(created_at) = CURDATE()
      )
    `

    const [customers] = await db.execute(query)

    for (const customer of customers as any[]) {
      await this.triggerBirthdayCampaign(customer)
    }
  }

  /**
   * Process abandoned cart triggers
   */
  private async processAbandonedCartTriggers(): Promise<void> {
    const query = `
      SELECT c.*, ca.area_name, 
             COUNT(ci.id) as cart_items,
             SUM(ci.quantity * p.price) as cart_value
      FROM customers c
      LEFT JOIN customer_areas ca ON c.area_id = ca.id
      JOIN cart_items ci ON c.id = ci.customer_id
      JOIN products p ON ci.product_id = p.id
      WHERE c.consent_marketing = 1
      AND ci.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND ci.created_at <= DATE_SUB(NOW(), INTERVAL 2 HOUR)
      AND c.id NOT IN (
        SELECT customer_id FROM orders 
        WHERE created_at >= ci.created_at
      )
      AND c.id NOT IN (
        SELECT customer_id FROM campaign_messages 
        WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE type = 'abandoned_cart'
        )
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      )
      GROUP BY c.id
      HAVING cart_items > 0
    `

    const [customers] = await db.execute(query)

    for (const customer of customers as any[]) {
      await this.triggerAbandonedCartCampaign(customer)
    }
  }

  /**
   * Process order follow-up triggers
   */
  private async processOrderFollowUpTriggers(): Promise<void> {
    // Follow up 3 days after order delivery
    const query = `
      SELECT c.*, o.id as order_id, o.total_amount, o.delivered_at
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      WHERE c.consent_marketing = 1
      AND o.status = 'delivered'
      AND o.delivered_at IS NOT NULL
      AND DATE(o.delivered_at) = DATE_SUB(CURDATE(), INTERVAL 3 DAY)
      AND o.id NOT IN (
        SELECT JSON_EXTRACT(personalization_data, '$.order_id') FROM campaign_messages 
        WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE type = 'follow_up'
        )
      )
    `

    const [orders] = await db.execute(query)

    for (const order of orders as any[]) {
      await this.triggerOrderFollowUpCampaign(order)
    }
  }

  /**
   * Process inactive customer triggers
   */
  private async processInactiveCustomerTriggers(): Promise<void> {
    const query = `
      SELECT c.*, ca.area_name, c.last_order_date,
             DATEDIFF(CURDATE(), c.last_order_date) as days_inactive
      FROM customers c
      LEFT JOIN customer_areas ca ON c.area_id = ca.id
      WHERE c.consent_marketing = 1
      AND c.last_order_date IS NOT NULL
      AND c.last_order_date <= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      AND c.id NOT IN (
        SELECT customer_id FROM campaign_messages 
        WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE type = 'reactivation'
        )
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      )
    `

    const [customers] = await db.execute(query)

    for (const customer of customers as any[]) {
      await this.triggerReactivationCampaign(customer)
    }
  }

  /**
   * Process reorder reminder triggers
   */
  private async processReorderReminderTriggers(): Promise<void> {
    // Remind customers to reorder products they typically buy monthly
    const query = `
      SELECT c.*, p.name as product_name, p.id as product_id,
             MAX(oi.created_at) as last_purchase_date,
             COUNT(*) as purchase_frequency
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE c.consent_marketing = 1
      AND oi.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY c.id, p.id
      HAVING purchase_frequency >= 2
      AND last_purchase_date <= DATE_SUB(CURDATE(), INTERVAL 25 DAY)
      AND CONCAT(c.id, '-', p.id) NOT IN (
        SELECT CONCAT(customer_id, '-', JSON_EXTRACT(personalization_data, '$.product_id'))
        FROM campaign_messages 
        WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE type = 'reorder_reminder'
        )
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      )
    `

    const [reorderOpportunities] = await db.execute(query)

    for (const opportunity of reorderOpportunities as any[]) {
      await this.triggerReorderReminderCampaign(opportunity)
    }
  }

  /**
   * Trigger birthday campaign for a customer
   */
  private async triggerBirthdayCampaign(customer: any): Promise<void> {
    // Create personalized birthday message
    const personalizedData = {
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_area: customer.area_name,
      birthday_offer: "20% OFF", // Could be dynamic based on customer tier
      offer_code: `BDAY${customer.id}${new Date().getFullYear()}`,
    }

    // Get birthday template
    const [templates] = await db.execute(
      "SELECT * FROM message_templates WHERE type = ? AND category = ? AND is_active = 1 LIMIT 1",
      ["promotional", "birthday"],
    )

    if (templates.length === 0) return

    const template = templates[0]

    // Create campaign message
    await campaignManager.createCampaignMessage({
      campaign_id: 0, // Special campaign ID for automated messages
      customer_id: customer.id,
      channel: customer.whatsapp_number ? "whatsapp" : "sms",
      template_id: template.id,
      personalization_data: personalizedData,
      scheduled_at: new Date(),
      status: "pending",
    })

    // Log automation trigger
    await this.logAutomationEvent("birthday_triggered", {
      customer_id: customer.id,
      customer_name: customer.name,
      template_id: template.id,
    })
  }

  /**
   * Trigger abandoned cart campaign
   */
  private async triggerAbandonedCartCampaign(customer: any): Promise<void> {
    const personalizedData = {
      customer_name: customer.name,
      customer_phone: customer.phone,
      cart_value: `${customer.cart_value}`,
      cart_items: customer.cart_items,
      recovery_discount: "10% OFF",
      recovery_code: `CART${customer.id}${Date.now()}`,
    }

    const [templates] = await db.execute(
      "SELECT * FROM message_templates WHERE type = ? AND category = ? AND is_active = 1 LIMIT 1",
      ["promotional", "abandoned_cart"],
    )

    if (templates.length === 0) return

    const template = templates[0]

    await campaignManager.createCampaignMessage({
      campaign_id: 0,
      customer_id: customer.id,
      channel: customer.whatsapp_number ? "whatsapp" : "sms",
      template_id: template.id,
      personalization_data: personalizedData,
      scheduled_at: new Date(),
      status: "pending",
    })

    await this.logAutomationEvent("abandoned_cart_triggered", {
      customer_id: customer.id,
      cart_value: customer.cart_value,
      cart_items: customer.cart_items,
    })
  }

  /**
   * Trigger order follow-up campaign
   */
  private async triggerOrderFollowUpCampaign(order: any): Promise<void> {
    const personalizedData = {
      customer_name: order.name,
      customer_phone: order.phone,
      order_id: order.order_id,
      order_amount: `${order.total_amount}`,
      delivery_date: order.delivered_at,
      feedback_link: `https://yeelohomeopathy.com/feedback/${order.order_id}`,
    }

    const [templates] = await db.execute(
      "SELECT * FROM message_templates WHERE type = ? AND category = ? AND is_active = 1 LIMIT 1",
      ["follow_up", "order_delivered"],
    )

    if (templates.length === 0) return

    const template = templates[0]

    await campaignManager.createCampaignMessage({
      campaign_id: 0,
      customer_id: order.id,
      channel: order.whatsapp_number ? "whatsapp" : "sms",
      template_id: template.id,
      personalization_data: personalizedData,
      scheduled_at: new Date(),
      status: "pending",
    })

    await this.logAutomationEvent("order_followup_triggered", {
      customer_id: order.id,
      order_id: order.order_id,
      order_amount: order.total_amount,
    })
  }

  /**
   * Trigger reactivation campaign for inactive customers
   */
  private async triggerReactivationCampaign(customer: any): Promise<void> {
    const personalizedData = {
      customer_name: customer.name,
      customer_phone: customer.phone,
      days_inactive: customer.days_inactive,
      comeback_offer: "25% OFF",
      comeback_code: `WELCOME${customer.id}BACK`,
      last_order_date: customer.last_order_date,
    }

    const [templates] = await db.execute(
      "SELECT * FROM message_templates WHERE type = ? AND category = ? AND is_active = 1 LIMIT 1",
      ["promotional", "reactivation"],
    )

    if (templates.length === 0) return

    const template = templates[0]

    await campaignManager.createCampaignMessage({
      campaign_id: 0,
      customer_id: customer.id,
      channel: customer.whatsapp_number ? "whatsapp" : "sms",
      template_id: template.id,
      personalization_data: personalizedData,
      scheduled_at: new Date(),
      status: "pending",
    })

    await this.logAutomationEvent("reactivation_triggered", {
      customer_id: customer.id,
      days_inactive: customer.days_inactive,
      last_order_date: customer.last_order_date,
    })
  }

  /**
   * Trigger reorder reminder campaign
   */
  private async triggerReorderReminderCampaign(opportunity: any): Promise<void> {
    const personalizedData = {
      customer_name: opportunity.name,
      customer_phone: opportunity.phone,
      product_name: opportunity.product_name,
      product_id: opportunity.product_id,
      last_purchase_date: opportunity.last_purchase_date,
      reorder_discount: "15% OFF",
      reorder_code: `REORDER${opportunity.id}${opportunity.product_id}`,
    }

    const [templates] = await db.execute(
      "SELECT * FROM message_templates WHERE type = ? AND category = ? AND is_active = 1 LIMIT 1",
      ["promotional", "reorder_reminder"],
    )

    if (templates.length === 0) return

    const template = templates[0]

    await campaignManager.createCampaignMessage({
      campaign_id: 0,
      customer_id: opportunity.id,
      channel: opportunity.whatsapp_number ? "whatsapp" : "sms",
      template_id: template.id,
      personalization_data: personalizedData,
      scheduled_at: new Date(),
      status: "pending",
    })

    await this.logAutomationEvent("reorder_reminder_triggered", {
      customer_id: opportunity.id,
      product_id: opportunity.product_id,
      product_name: opportunity.product_name,
    })
  }

  /**
   * Log automation events for analytics
   */
  private async logAutomationEvent(eventType: string, eventData: any): Promise<void> {
    const query = `
      INSERT INTO automation_events (event_type, event_data, created_at)
      VALUES (?, ?, NOW())
    `

    await db.execute(query, [eventType, JSON.stringify(eventData)])
  }

  /**
   * Get automation analytics
   */
  async getAutomationAnalytics(dateRange: { start: Date; end: Date }): Promise<any> {
    const query = `
      SELECT 
        event_type,
        COUNT(*) as trigger_count,
        DATE(created_at) as trigger_date
      FROM automation_events
      WHERE created_at BETWEEN ? AND ?
      GROUP BY event_type, DATE(created_at)
      ORDER BY trigger_date DESC, trigger_count DESC
    `

    const [results] = await db.execute(query, [dateRange.start, dateRange.end])
    return results
  }
}

// Export singleton instance
export const automationEngine = new AutomationEngine()
