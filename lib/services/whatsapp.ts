/**
 * WhatsApp Service
 * Handles WhatsApp messaging integration for HomeoERP
 */

export interface WhatsAppMessage {
  to: string;
  message: string;
  template?: string;
  variables?: Record<string, string>;
}

export interface WhatsAppConfig {
  apiKey?: string;
  apiUrl?: string;
  enabled: boolean;
}

export class WhatsApp {
  private config: WhatsAppConfig;

  constructor(config?: Partial<WhatsAppConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.NEXT_PUBLIC_WHATSAPP_API_KEY || '',
      apiUrl: config?.apiUrl || process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'https://api.whatsapp.com',
      enabled: config?.enabled !== undefined ? config.enabled : false,
    };
  }

  /**
   * Send a WhatsApp message
   */
  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config.enabled) {
      console.log('[WhatsApp] Service disabled, skipping message:', message);
      return { success: true, messageId: 'disabled' };
    }

    try {
      // TODO: Implement actual WhatsApp API integration
      console.log('[WhatsApp] Sending message:', message);
      
      // Simulate API call
      return {
        success: true,
        messageId: `wa_${Date.now()}`,
      };
    } catch (error) {
      console.error('[WhatsApp] Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send order confirmation via WhatsApp
   */
  async sendOrderConfirmation(
    phoneNumber: string,
    orderDetails: {
      orderNumber: string;
      customerName: string;
      totalAmount: number;
      items: string[];
    }
  ): Promise<boolean> {
    const message = `
Hello ${orderDetails.customerName}! 

Your order #${orderDetails.orderNumber} has been confirmed.

Items:
${orderDetails.items.join('\n')}

Total: ₹${orderDetails.totalAmount.toFixed(2)}

Thank you for shopping with us!
    `.trim();

    const result = await this.sendMessage({
      to: phoneNumber,
      message,
    });

    return result.success;
  }

  /**
   * Send payment reminder via WhatsApp
   */
  async sendPaymentReminder(
    phoneNumber: string,
    reminderDetails: {
      customerName: string;
      invoiceNumber: string;
      dueAmount: number;
      dueDate: string;
    }
  ): Promise<boolean> {
    const message = `
Dear ${reminderDetails.customerName},

This is a friendly reminder that payment for Invoice #${reminderDetails.invoiceNumber} is due.

Amount Due: ₹${reminderDetails.dueAmount.toFixed(2)}
Due Date: ${reminderDetails.dueDate}

Please make the payment at your earliest convenience.

Thank you!
    `.trim();

    const result = await this.sendMessage({
      to: phoneNumber,
      message,
    });

    return result.success;
  }

  /**
   * Send delivery update via WhatsApp
   */
  async sendDeliveryUpdate(
    phoneNumber: string,
    deliveryDetails: {
      customerName: string;
      orderNumber: string;
      status: string;
      trackingUrl?: string;
    }
  ): Promise<boolean> {
    let message = `
Hello ${deliveryDetails.customerName}!

Your order #${deliveryDetails.orderNumber} status: ${deliveryDetails.status}
    `.trim();

    if (deliveryDetails.trackingUrl) {
      message += `\n\nTrack your order: ${deliveryDetails.trackingUrl}`;
    }

    const result = await this.sendMessage({
      to: phoneNumber,
      message,
    });

    return result.success;
  }

  /**
   * Send prescription reminder via WhatsApp
   */
  async sendPrescriptionReminder(
    phoneNumber: string,
    prescriptionDetails: {
      patientName: string;
      medicineName: string;
      refillDate: string;
    }
  ): Promise<boolean> {
    const message = `
Dear ${prescriptionDetails.patientName},

This is a reminder to refill your prescription for ${prescriptionDetails.medicineName}.

Refill Date: ${prescriptionDetails.refillDate}

Please visit us or order online.

Stay healthy!
    `.trim();

    const result = await this.sendMessage({
      to: phoneNumber,
      message,
    });

    return result.success;
  }

  /**
   * Send promotional message via WhatsApp
   */
  async sendPromotion(
    phoneNumber: string,
    promotionDetails: {
      customerName: string;
      offerTitle: string;
      offerDescription: string;
      validUntil: string;
      couponCode?: string;
    }
  ): Promise<boolean> {
    let message = `
Hello ${promotionDetails.customerName}! 🎉

${promotionDetails.offerTitle}

${promotionDetails.offerDescription}

Valid until: ${promotionDetails.validUntil}
    `.trim();

    if (promotionDetails.couponCode) {
      message += `\n\nUse code: ${promotionDetails.couponCode}`;
    }

    const result = await this.sendMessage({
      to: phoneNumber,
      message,
    });

    return result.success;
  }

  /**
   * Check if WhatsApp service is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WhatsAppConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const whatsappService = new WhatsApp({
  enabled: process.env.NEXT_PUBLIC_WHATSAPP_ENABLED === 'true',
});

export default WhatsApp;
