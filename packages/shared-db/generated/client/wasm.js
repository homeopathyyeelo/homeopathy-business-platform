
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  phone: 'phone',
  name: 'name',
  role: 'role',
  shopId: 'shopId',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ShopScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address: 'address',
  phone: 'phone',
  email: 'email',
  isActive: 'isActive',
  workingHours: 'workingHours',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  price: 'price',
  imageUrl: 'imageUrl',
  category: 'category',
  isActive: 'isActive',
  shopId: 'shopId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  shopId: 'shopId',
  quantity: 'quantity',
  batchNo: 'batchNo',
  expiryDate: 'expiryDate',
  reorderLevel: 'reorderLevel',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomerScalarFieldEnum = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  email: 'email',
  address: 'address',
  dateOfBirth: 'dateOfBirth',
  gender: 'gender',
  marketingConsent: 'marketingConsent',
  loyaltyPoints: 'loyaltyPoints',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  customerId: 'customerId',
  shopId: 'shopId',
  userId: 'userId',
  totalAmount: 'totalAmount',
  status: 'status',
  orderType: 'orderType',
  paymentStatus: 'paymentStatus',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  productId: 'productId',
  quantity: 'quantity',
  price: 'price',
  createdAt: 'createdAt'
};

exports.Prisma.AppointmentScalarFieldEnum = {
  id: 'id',
  customerId: 'customerId',
  doctorId: 'doctorId',
  shopId: 'shopId',
  scheduledAt: 'scheduledAt',
  duration: 'duration',
  type: 'type',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PrescriptionScalarFieldEnum = {
  id: 'id',
  appointmentId: 'appointmentId',
  doctorId: 'doctorId',
  notes: 'notes',
  medicines: 'medicines',
  instructions: 'instructions',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CampaignScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  content: 'content',
  templateId: 'templateId',
  scheduledAt: 'scheduledAt',
  status: 'status',
  targetAudience: 'targetAudience',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  content: 'content',
  variables: 'variables',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AiPromptScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  promptText: 'promptText',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CouponScalarFieldEnum = {
  id: 'id',
  code: 'code',
  type: 'type',
  value: 'value',
  minAmount: 'minAmount',
  maxDiscount: 'maxDiscount',
  usageLimit: 'usageLimit',
  usedCount: 'usedCount',
  validFrom: 'validFrom',
  validUntil: 'validUntil',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReferralScalarFieldEnum = {
  id: 'id',
  referrerId: 'referrerId',
  refereeId: 'refereeId',
  code: 'code',
  status: 'status',
  reward: 'reward',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OutboxScalarFieldEnum = {
  id: 'id',
  eventType: 'eventType',
  aggregateId: 'aggregateId',
  payload: 'payload',
  status: 'status',
  retryCount: 'retryCount',
  createdAt: 'createdAt',
  processedAt: 'processedAt'
};

exports.Prisma.OutboxDlqScalarFieldEnum = {
  id: 'id',
  eventType: 'eventType',
  aggregateId: 'aggregateId',
  payload: 'payload',
  error: 'error',
  retryCount: 'retryCount',
  createdAt: 'createdAt'
};

exports.Prisma.EventScalarFieldEnum = {
  id: 'id',
  type: 'type',
  entityType: 'entityType',
  entityId: 'entityId',
  userId: 'userId',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.WebhookScalarFieldEnum = {
  id: 'id',
  url: 'url',
  events: 'events',
  secret: 'secret',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  oldValues: 'oldValues',
  newValues: 'newValues',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.VendorScalarFieldEnum = {
  id: 'id',
  name: 'name',
  contactPerson: 'contactPerson',
  phone: 'phone',
  email: 'email',
  address: 'address',
  gstNumber: 'gstNumber',
  creditLimit: 'creditLimit',
  paymentTerms: 'paymentTerms',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PurchaseOrderScalarFieldEnum = {
  id: 'id',
  vendorId: 'vendorId',
  shopId: 'shopId',
  poNumber: 'poNumber',
  status: 'status',
  totalAmount: 'totalAmount',
  notes: 'notes',
  expectedDeliveryDate: 'expectedDeliveryDate',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PurchaseOrderItemScalarFieldEnum = {
  id: 'id',
  purchaseOrderId: 'purchaseOrderId',
  productId: 'productId',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  batchNo: 'batchNo',
  expiryDate: 'expiryDate',
  createdAt: 'createdAt'
};

exports.Prisma.GoodsReceiptNoteScalarFieldEnum = {
  id: 'id',
  purchaseOrderId: 'purchaseOrderId',
  grnNumber: 'grnNumber',
  status: 'status',
  receivedBy: 'receivedBy',
  receivedAt: 'receivedAt',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.GrnItemScalarFieldEnum = {
  id: 'id',
  grnId: 'grnId',
  purchaseOrderItemId: 'purchaseOrderItemId',
  receivedQuantity: 'receivedQuantity',
  condition: 'condition',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.VendorPerformanceScalarFieldEnum = {
  id: 'id',
  vendorId: 'vendorId',
  metricName: 'metricName',
  metricValue: 'metricValue',
  measurementDate: 'measurementDate',
  context: 'context'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  invoiceNumber: 'invoiceNumber',
  customerId: 'customerId',
  shopId: 'shopId',
  orderId: 'orderId',
  type: 'type',
  status: 'status',
  subtotal: 'subtotal',
  taxAmount: 'taxAmount',
  totalAmount: 'totalAmount',
  notes: 'notes',
  paymentTerms: 'paymentTerms',
  dueDate: 'dueDate',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvoiceItemScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  productId: 'productId',
  description: 'description',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  taxRate: 'taxRate',
  totalAmount: 'totalAmount',
  createdAt: 'createdAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  amount: 'amount',
  paymentMethod: 'paymentMethod',
  reference: 'reference',
  status: 'status',
  processedBy: 'processedBy',
  processedAt: 'processedAt',
  createdAt: 'createdAt'
};

exports.Prisma.ChartOfAccountScalarFieldEnum = {
  id: 'id',
  accountCode: 'accountCode',
  accountName: 'accountName',
  accountType: 'accountType',
  parentAccountId: 'parentAccountId',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.JournalEntryScalarFieldEnum = {
  id: 'id',
  entryNumber: 'entryNumber',
  description: 'description',
  entryDate: 'entryDate',
  totalDebit: 'totalDebit',
  totalCredit: 'totalCredit',
  createdBy: 'createdBy',
  createdAt: 'createdAt'
};

exports.Prisma.JournalEntryLineScalarFieldEnum = {
  id: 'id',
  journalEntryId: 'journalEntryId',
  accountId: 'accountId',
  debitAmount: 'debitAmount',
  creditAmount: 'creditAmount',
  description: 'description',
  createdAt: 'createdAt'
};

exports.Prisma.CurrencyRateScalarFieldEnum = {
  id: 'id',
  fromCurrency: 'fromCurrency',
  toCurrency: 'toCurrency',
  exchangeRate: 'exchangeRate',
  effectiveDate: 'effectiveDate',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  STAFF: 'STAFF',
  PATIENT: 'PATIENT'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

exports.OrderType = exports.$Enums.OrderType = {
  WALK_IN: 'WALK_IN',
  ONLINE: 'ONLINE',
  DELIVERY: 'DELIVERY',
  PICKUP: 'PICKUP'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

exports.AppointmentType = exports.$Enums.AppointmentType = {
  IN_PERSON: 'IN_PERSON',
  VIDEO: 'VIDEO',
  PHONE: 'PHONE'
};

exports.AppointmentStatus = exports.$Enums.AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
};

exports.CampaignType = exports.$Enums.CampaignType = {
  WHATSAPP: 'WHATSAPP',
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  INSTAGRAM: 'INSTAGRAM',
  GOOGLE_BUSINESS: 'GOOGLE_BUSINESS'
};

exports.CampaignStatus = exports.$Enums.CampaignStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  FAILED: 'FAILED'
};

exports.CouponType = exports.$Enums.CouponType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT'
};

exports.ReferralStatus = exports.$Enums.ReferralStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED'
};

exports.OutboxStatus = exports.$Enums.OutboxStatus = {
  PENDING: 'PENDING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED'
};

exports.WebhookStatus = exports.$Enums.WebhookStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  FAILED: 'FAILED'
};

exports.PurchaseOrderStatus = exports.$Enums.PurchaseOrderStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  ORDERED: 'ORDERED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED'
};

exports.GrnStatus = exports.$Enums.GrnStatus = {
  RECEIVED: 'RECEIVED',
  PARTIAL: 'PARTIAL',
  DAMAGED: 'DAMAGED'
};

exports.GrnItemCondition = exports.$Enums.GrnItemCondition = {
  GOOD: 'GOOD',
  DAMAGED: 'DAMAGED',
  EXPIRED: 'EXPIRED'
};

exports.InvoiceType = exports.$Enums.InvoiceType = {
  SALE: 'SALE',
  PURCHASE: 'PURCHASE',
  SERVICE: 'SERVICE',
  REFUND: 'REFUND'
};

exports.InvoiceStatus = exports.$Enums.InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  UPI: 'UPI',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE'
};

exports.PaymentState = exports.$Enums.PaymentState = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

exports.AccountType = exports.$Enums.AccountType = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE'
};

exports.Prisma.ModelName = {
  User: 'User',
  Shop: 'Shop',
  Product: 'Product',
  Inventory: 'Inventory',
  Customer: 'Customer',
  Order: 'Order',
  OrderItem: 'OrderItem',
  Appointment: 'Appointment',
  Prescription: 'Prescription',
  Campaign: 'Campaign',
  Template: 'Template',
  AiPrompt: 'AiPrompt',
  Coupon: 'Coupon',
  Referral: 'Referral',
  Outbox: 'Outbox',
  OutboxDlq: 'OutboxDlq',
  Event: 'Event',
  Webhook: 'Webhook',
  AuditLog: 'AuditLog',
  Vendor: 'Vendor',
  PurchaseOrder: 'PurchaseOrder',
  PurchaseOrderItem: 'PurchaseOrderItem',
  GoodsReceiptNote: 'GoodsReceiptNote',
  GrnItem: 'GrnItem',
  VendorPerformance: 'VendorPerformance',
  Invoice: 'Invoice',
  InvoiceItem: 'InvoiceItem',
  Payment: 'Payment',
  ChartOfAccount: 'ChartOfAccount',
  JournalEntry: 'JournalEntry',
  JournalEntryLine: 'JournalEntryLine',
  CurrencyRate: 'CurrencyRate'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
