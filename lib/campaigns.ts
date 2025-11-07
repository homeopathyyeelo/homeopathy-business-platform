/**
 * Campaign and Marketing Management System
 * Handles automated marketing campaigns, WhatsApp integration, SMS, and social media
 *
 * Features:
 * - Multi-channel campaign management (WhatsApp, SMS, Email, Social Media)
 * - Customer segmentation and targeting
 * - Automated follow-ups and drip campaigns
 * - Template management with personalization
 * - Campaign analytics and performance tracking
 * - Integration with external APIs (WhatsApp Business, SMS providers)
 */

import { db } from "./database"
import type { Customer, Campaign, CampaignAnalytics } from "./types"
import { authFetch } from '@/lib/api/fetch-utils';

export class CampaignManager {
  /**
   * Create a new marketing campaign
   * Supports multiple channels: whatsapp, sms, email, instagram, gmb
   */
  async createCampaign(campaignData: {
    name: string
    description: string
    type: "promotional" | "educational" | "follow_up" | "abandoned_cart" | "birthday" | "seasonal"
    channel: "whatsapp" | "sms" | "email" | "instagram" | "gmb" | "multi_channel"
    target_audience: string // JSON string with segmentation criteria
    template_id?: number
    schedule_type: "immediate" | "scheduled" | "recurring" | "trigger_based"
    schedule_data?: any // JSON with scheduling details
    personalization_fields?: string[] // Fields to personalize in messages
    budget?: number
    expected_reach?: number
    created_by: number
  }): Promise<Campaign> {
    const query = `
      INSERT INTO campaigns (
        name, description, type, channel, target_audience, template_id,
        schedule_type, schedule_data, personalization_fields, budget,
        expected_reach, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, NOW(), NOW())
    `

    const result = await db.execute(query, [
      campaignData.name,
      campaignData.description,
      campaignData.type,
      campaignData.channel,
      campaignData.target_audience,
      campaignData.template_id,
      campaignData.schedule_type,
      JSON.stringify(campaignData.schedule_data),
      JSON.stringify(campaignData.personalization_fields),
      campaignData.budget,
      campaignData.expected_reach,
      campaignData.created_by,
    ])

    return this.getCampaignById(result.insertId)
  }

  /**
   * Get campaign by ID with full details
   */
  async getCampaignById(campaignId: number): Promise<Campaign | null> {
    const query = `
      SELECT c.*, t.name as template_name, t.content as template_content,
             u.name as creator_name
      FROM campaigns c
      LEFT JOIN message_templates t ON c.template_id = t.id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `

    const [rows] = await db.execute(query, [campaignId])
    return rows[0] || null
  }

  /**
   * Get target customers based on campaign segmentation criteria
   */
  async getTargetCustomers(targetAudience: string): Promise<Customer[]> {
    const criteria = JSON.parse(targetAudience)
    let query = `
      SELECT DISTINCT c.*, ca.area_name, ca.pincode
      FROM customers c
      LEFT JOIN customer_areas ca ON c.area_id = ca.id
      WHERE c.consent_marketing = 1
    `

    const params: any[] = []

    // Add segmentation filters
    if (criteria.age_min || criteria.age_max) {
      if (criteria.age_min) {
        query += ` AND TIMESTAMPDIFF(YEAR, c.date_of_birth, CURDATE()) >= ?`
        params.push(criteria.age_min)
      }
      if (criteria.age_max) {
        query += ` AND TIMESTAMPDIFF(YEAR, c.date_of_birth, CURDATE()) <= ?`
        params.push(criteria.age_max)
      }
    }

    if (criteria.areas && criteria.areas.length > 0) {
      query += ` AND ca.area_name IN (${criteria.areas.map(() => "?").join(",")})`
      params.push(...criteria.areas)
    }

    if (criteria.tags && criteria.tags.length > 0) {
      query += ` AND c.tags REGEXP ?`
      params.push(criteria.tags.join("|"))
    }

    if (criteria.last_order_days) {
      query += ` AND c.id IN (
        SELECT customer_id FROM orders 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      )`
      params.push(criteria.last_order_days)
    }

    if (criteria.total_spent_min) {
      query += ` AND c.total_spent >= ?`
      params.push(criteria.total_spent_min)
    }

    const [rows] = await db.execute(query, params)
    return rows as Customer[]
  }

  /**
   * Launch a campaign - start sending messages to target audience
   */
  async launchCampaign(campaignId: number, launchedBy: number): Promise<void> {
    const campaign = await this.getCampaignById(campaignId)
    if (!campaign) throw new Error("Campaign not found")

    // Get target customers
    const targetCustomers = await this.getTargetCustomers(campaign.target_audience)

    // Update campaign status
    await db.execute("UPDATE campaigns SET status = ?, launched_at = NOW(), launched_by = ? WHERE id = ?", [
      "active",
      launchedBy,
      campaignId,
    ])

    // Create campaign messages for each target customer
    for (const customer of targetCustomers) {
      await this.createCampaignMessage({
        campaign_id: campaignId,
        customer_id: customer.id,
        channel: campaign.channel,
        template_id: campaign.template_id,
        personalization_data: {
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_area: customer.area_name,
          last_order_date: customer.last_order_date,
        },
        scheduled_at: this.calculateScheduleTime(campaign.schedule_type, campaign.schedule_data),
        status: "pending",
      })
    }

    // Log campaign launch event
    await this.logCampaignEvent(campaignId, "launched", {
      target_count: targetCustomers.length,
      launched_by: launchedBy,
    })
  }

  /**
   * Create a campaign message for a specific customer
   */
  async createCampaignMessage(messageData: {
    campaign_id: number
    customer_id: number
    channel: string
    template_id?: number
    personalization_data: any
    scheduled_at?: Date
    status: "pending" | "sent" | "delivered" | "failed" | "clicked"
  }): Promise<void> {
    const query = `
      INSERT INTO campaign_messages (
        campaign_id, customer_id, channel, template_id, personalization_data,
        scheduled_at, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `

    await db.execute(query, [
      messageData.campaign_id,
      messageData.customer_id,
      messageData.channel,
      messageData.template_id,
      JSON.stringify(messageData.personalization_data),
      messageData.scheduled_at,
      messageData.status,
    ])
  }

  /**
   * Process pending campaign messages (called by cron job)
   */
  async processPendingMessages(): Promise<void> {
    const query = `
      SELECT cm.*, c.name as customer_name, c.phone, c.email, c.whatsapp_number,
             t.content as template_content, t.type as template_type,
             camp.name as campaign_name
      FROM campaign_messages cm
      JOIN customers c ON cm.customer_id = c.id
      LEFT JOIN message_templates t ON cm.template_id = t.id
      JOIN campaigns camp ON cm.campaign_id = camp.id
      WHERE cm.status = 'pending' 
      AND (cm.scheduled_at IS NULL OR cm.scheduled_at <= NOW())
      ORDER BY cm.created_at ASC
      LIMIT 100
    `

    const [messages] = await db.execute(query)

    for (const message of messages as any[]) {
      try {
        await this.sendMessage(message)
        await this.updateMessageStatus(message.id, "sent")
      } catch (error) {
        console.error(`Failed to send message ${message.id}:`, error)
        await this.updateMessageStatus(message.id, "failed", error.message)
      }
    }
  }

  /**
   * Send a message via the appropriate channel
   */
  private async sendMessage(message: any): Promise<void> {
    const personalizedContent = this.personalizeContent(
      message.template_content,
      JSON.parse(message.personalization_data),
    )

    switch (message.channel) {
      case "whatsapp":
        await this.sendWhatsAppMessage(message.whatsapp_number || message.phone, personalizedContent)
        break
      case "sms":
        await this.sendSMSMessage(message.phone, personalizedContent)
        break
      case "email":
        await this.sendEmailMessage(message.email, message.campaign_name, personalizedContent)
        break
      default:
        throw new Error(`Unsupported channel: ${message.channel}`)
    }
  }

  /**
   * Personalize message content with customer data
   */
  private personalizeContent(template: string, data: any): string {
    let content = template

    // Replace placeholders with actual data
    Object.keys(data).forEach((key) => {
      const placeholder = `{{${key}}}`
      content = content.replace(new RegExp(placeholder, "g"), data[key] || "")
    })

    return content
  }

  /**
   * Send WhatsApp message using WhatsApp Business API
   */
  private async sendWhatsAppMessage(phoneNumber: string, message: string): Promise<void> {
    // Integration with WhatsApp Business API
    // This would use your WhatsApp Business API credentials
    const whatsappAPI = process.env.WHATSAPP_API_URL
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!whatsappAPI || !accessToken) {
      throw new Error("WhatsApp API configuration missing")
    }

    const response = await authFetch(`${whatsappAPI}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: { body: message },
      }),
    })

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`)
    }
  }

  /**
   * Send SMS message using SMS provider API
   */
  private async sendSMSMessage(phoneNumber: string, message: string): Promise<void> {
    // Integration with SMS provider (e.g., Twilio, TextLocal, etc.)
    const smsAPI = process.env.SMS_API_URL
    const smsAPIKey = process.env.SMS_API_KEY

    if (!smsAPI || !smsAPIKey) {
      throw new Error("SMS API configuration missing")
    }

    const response = await authFetch(smsAPI, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${smsAPIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: message,
        from: process.env.SMS_SENDER_ID || "YeeloHomeo",
      }),
    })

    if (!response.ok) {
      throw new Error(`SMS API error: ${response.statusText}`)
    }
  }

  /**
   * Send email message
   */
  private async sendEmailMessage(email: string, subject: string, content: string): Promise<void> {
    // Integration with email service (e.g., SendGrid, Mailgun, etc.)
    const emailAPI = process.env.EMAIL_API_URL
    const emailAPIKey = process.env.EMAIL_API_KEY

    if (!emailAPI || !emailAPIKey) {
      throw new Error("Email API configuration missing")
    }

    const response = await authFetch(`${emailAPI}/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailAPIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "noreply@yeelohomeopathy.com",
        to: email,
        subject: subject,
        html: content,
      }),
    })

    if (!response.ok) {
      throw new Error(`Email API error: ${response.statusText}`)
    }
  }

  /**
   * Update message status
   */
  private async updateMessageStatus(messageId: number, status: string, errorMessage?: string): Promise<void> {
    const query = `
      UPDATE campaign_messages 
      SET status = ?, error_message = ?, updated_at = NOW()
      WHERE id = ?
    `

    await db.execute(query, [status, errorMessage, messageId])
  }

  /**
   * Calculate when to send message based on schedule type
   */
  private calculateScheduleTime(scheduleType: string, scheduleData: any): Date | null {
    const now = new Date()

    switch (scheduleType) {
      case "immediate":
        return now
      case "scheduled":
        return new Date(scheduleData.send_at)
      case "recurring":
        // Calculate next occurrence based on recurrence pattern
        return this.calculateNextRecurrence(scheduleData)
      case "trigger_based":
        // For trigger-based campaigns, return null (will be set when trigger occurs)
        return null
      default:
        return now
    }
  }

  /**
   * Calculate next recurrence for recurring campaigns
   */
  private calculateNextRecurrence(scheduleData: any): Date {
    const now = new Date()
    const { frequency, interval, time } = scheduleData

    const nextDate = new Date(now)

    switch (frequency) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + interval)
        break
      case "weekly":
        nextDate.setDate(nextDate.getDate() + interval * 7)
        break
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + interval)
        break
    }

    // Set specific time if provided
    if (time) {
      const [hours, minutes] = time.split(":")
      nextDate.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)
    }

    return nextDate
  }

  /**
   * Log campaign events for analytics
   */
  async logCampaignEvent(campaignId: number, eventType: string, eventData: any): Promise<void> {
    const query = `
      INSERT INTO campaign_events (campaign_id, event_type, event_data, created_at)
      VALUES (?, ?, ?, NOW())
    `

    await db.execute(query, [campaignId, eventType, JSON.stringify(eventData)])
  }

  /**
   * Get campaign analytics and performance metrics
   */
  async getCampaignAnalytics(campaignId: number): Promise<CampaignAnalytics> {
    const queries = {
      basic: `
        SELECT 
          COUNT(*) as total_messages,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_count,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
          SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END) as clicked_count
        FROM campaign_messages WHERE campaign_id = ?
      `,
      revenue: `
        SELECT COALESCE(SUM(o.total_amount), 0) as generated_revenue
        FROM orders o
        JOIN campaign_messages cm ON o.customer_id = cm.customer_id
        WHERE cm.campaign_id = ? AND o.created_at >= cm.sent_at
        AND o.created_at <= DATE_ADD(cm.sent_at, INTERVAL 30 DAY)
      `,
      engagement: `
        SELECT 
          AVG(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as click_rate,
          AVG(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivery_rate
        FROM campaign_messages WHERE campaign_id = ?
      `,
    }

    const [basicStats] = await db.execute(queries.basic, [campaignId])
    const [revenueStats] = await db.execute(queries.revenue, [campaignId])
    const [engagementStats] = await db.execute(queries.engagement, [campaignId])

    return {
      campaign_id: campaignId,
      total_messages: basicStats[0].total_messages,
      sent_count: basicStats[0].sent_count,
      delivered_count: basicStats[0].delivered_count,
      failed_count: basicStats[0].failed_count,
      clicked_count: basicStats[0].clicked_count,
      delivery_rate: engagementStats[0].delivery_rate,
      click_rate: engagementStats[0].click_rate,
      generated_revenue: revenueStats[0].generated_revenue,
      roi: revenueStats[0].generated_revenue / (basicStats[0].total_messages * 0.1), // Assuming 0.1 cost per message
      created_at: new Date(),
    }
  }
}

// Export singleton instance
export const campaignManager = new CampaignManager()
