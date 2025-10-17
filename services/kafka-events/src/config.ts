// Kafka Configuration for Event-Driven Architecture

export const kafkaConfig = {
  clientId: 'yeelo-homeopathy-erp',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  connectionTimeout: 10000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
}

export const consumerConfig = {
  groupId: 'yeelo-erp-consumers',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
}

// Event Topics - Organized by Domain
export const topics = {
  // Product Events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  PRODUCT_STOCK_UPDATED: 'product.stock.updated',
  
  // Inventory Events
  INVENTORY_ADJUSTED: 'inventory.adjusted',
  INVENTORY_TRANSFERRED: 'inventory.transferred',
  INVENTORY_LOW_STOCK: 'inventory.low-stock',
  INVENTORY_EXPIRING: 'inventory.expiring',
  
  // Sales Events
  SALE_CREATED: 'sale.created',
  SALE_COMPLETED: 'sale.completed',
  SALE_CANCELLED: 'sale.cancelled',
  SALE_RETURNED: 'sale.returned',
  
  // Customer Events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_LOYALTY_POINTS_ADDED: 'customer.loyalty.points.added',
  CUSTOMER_LOYALTY_POINTS_REDEEMED: 'customer.loyalty.points.redeemed',
  
  // Purchase Events
  PURCHASE_ORDER_CREATED: 'purchase.order.created',
  PURCHASE_ORDER_APPROVED: 'purchase.order.approved',
  PURCHASE_GRN_CREATED: 'purchase.grn.created',
  
  // Finance Events
  INVOICE_CREATED: 'finance.invoice.created',
  PAYMENT_RECEIVED: 'finance.payment.received',
  EXPENSE_RECORDED: 'finance.expense.recorded',
  
  // Marketing Events
  CAMPAIGN_CREATED: 'marketing.campaign.created',
  CAMPAIGN_LAUNCHED: 'marketing.campaign.launched',
  CAMPAIGN_COMPLETED: 'marketing.campaign.completed',
  
  // HR Events
  EMPLOYEE_CREATED: 'hr.employee.created',
  ATTENDANCE_MARKED: 'hr.attendance.marked',
  LEAVE_APPLIED: 'hr.leave.applied',
  
  // Workflow Events
  WORKFLOW_STARTED: 'workflow.started',
  WORKFLOW_COMPLETED: 'workflow.completed',
  WORKFLOW_FAILED: 'workflow.failed',
  
  // System Events
  SYSTEM_BACKUP_COMPLETED: 'system.backup.completed',
  SYSTEM_ERROR: 'system.error',
  SYSTEM_ALERT: 'system.alert',
}

// Event Schemas
export interface BaseEvent {
  eventId: string
  eventType: string
  timestamp: string
  source: string
  version: string
  data: any
  metadata?: {
    userId?: string
    correlationId?: string
    causationId?: string
  }
}

export interface ProductEvent extends BaseEvent {
  data: {
    productId: string
    name: string
    sku: string
    price?: number
    stock?: number
    [key: string]: any
  }
}

export interface SaleEvent extends BaseEvent {
  data: {
    saleId: string
    customerId: string
    totalAmount: number
    items: Array<{
      productId: string
      quantity: number
      price: number
    }>
    [key: string]: any
  }
}

export interface InventoryEvent extends BaseEvent {
  data: {
    productId: string
    warehouseId?: string
    previousStock: number
    newStock: number
    adjustmentType: string
    [key: string]: any
  }
}
