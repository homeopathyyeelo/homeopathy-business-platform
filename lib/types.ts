/**
 * TypeScript type definitions for Yeelo Homeopathy Platform
 * Provides type safety across the entire application
 */

// User and Authentication Types
export interface User {
  id: number
  uuid: string
  full_name: string
  phone: string
  email?: string
  role: "admin" | "staff" | "customer" | "marketer"
  is_active: boolean
  last_login?: Date
  created_at: Date
  updated_at: Date
}

export interface AuthRequest {
  phone: string
  password: string
}

export interface AuthResponse {
  access_token: string
  expires_in: number
  user: User
}

// Shop and Location Types
export interface Shop {
  id: number
  uuid: string
  name: string
  address: string
  geo_lat?: number
  geo_lng?: number
  gmb_place_id?: string
  phone?: string
  timezone: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface LocalArea {
  id: number
  uuid: string
  name: string
  type: "village" | "sector" | "colony" | "city" | "area"
  parent_area_id?: number
  geo_center_lat?: number
  geo_center_lng?: number
  radius_km?: number
  population_estimate?: number
  notes?: string
  is_active: boolean
  created_at: Date
}

// Product and Inventory Types
export interface Product {
  id: number
  uuid: string
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
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface ProductWithInventory extends Product {
  stock_qty: number
  reorder_point: number
  shop_id: number
}

export interface Inventory {
  id: number
  product_id: number
  shop_id: number
  stock_qty: number
  reorder_point: number
  last_restocked?: Date
  created_at: Date
  updated_at: Date
}

export interface InventoryUpdate {
  sku: string
  change: number
  reason: string
  vendor?: string
}

// Customer Types
export interface Address {
  label: string
  line1: string
  line2?: string
  city: string
  state?: string
  pincode: string
}

export interface Customer {
  id: number
  uuid: string
  name: string
  phone: string
  email?: string
  addresses?: Address[]
  tags?: string[]
  consent_marketing: boolean
  consent_sms: boolean
  consent_whatsapp: boolean
  preferred_language: "en" | "hi" | "hinglish"
  created_at: Date
  updated_at: Date
}

// Order Types
export interface OrderItem {
  id?: number
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
  product?: Product // Populated in joins
}

export interface Order {
  id: number
  uuid: string
  customer_id?: number
  shop_id?: number
  order_number: string
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  source: "walkin" | "whatsapp" | "sms" | "online" | "phone"
  total_amount: number
  discount_amount: number
  delivery_address?: string
  delivery_type: "pickup" | "delivery"
  notes?: string
  created_at: Date
  updated_at: Date
  items?: OrderItem[]
  customer?: Customer
  shop?: Shop
}

export interface OrderRequest {
  customer_id: number
  shop_id: number
  items: Omit<OrderItem, "id" | "total_price">[]
  source?: string
  delivery_type?: "pickup" | "delivery"
  delivery_address?: string
  notes?: string
}

// Coupon and Referral Types
export interface Coupon {
  id: number
  uuid: string
  code: string
  name?: string
  discount_type: "percent" | "fixed"
  discount_value: number
  min_order_amount: number
  usage_limit?: number
  used_count: number
  expires_at?: Date
  is_active: boolean
  created_by?: number
  created_at: Date
}

export interface Referral {
  id: number
  uuid: string
  referrer_customer_id: number
  referee_customer_id?: number
  referral_code: string
  reward_amount?: number
  status: "pending" | "completed" | "expired"
  completed_at?: Date
  created_at: Date
}

// Campaign and Marketing Types
export interface Campaign {
  id: number
  uuid: string
  name: string
  channel: "sms" | "whatsapp" | "instagram" | "gmb" | "facebook" | "telegram"
  status: "draft" | "scheduled" | "running" | "completed" | "paused"
  schedule_type: "immediate" | "scheduled" | "recurring"
  scheduled_at?: Date
  cron_schedule?: string
  target_filter?: any // JSON object for targeting criteria
  template_id?: number
  created_by?: number
  created_at: Date
  updated_at: Date
}

export interface Template {
  id: number
  uuid: string
  name: string
  channel: string
  language: "en" | "hi" | "hinglish"
  content: string
  variables?: string[]
  is_ai_generated: boolean
  created_by?: number
  created_at: Date
  updated_at: Date
}

// AI and Content Generation Types
export interface AIPrompt {
  id: number
  uuid: string
  name: string
  category: "instagram" | "sms" | "gmb" | "reply" | "ads" | "description" | "outreach"
  prompt_template: string
  language: "en" | "hi" | "hinglish"
  use_case?: string
  created_by?: number
  created_at: Date
  updated_at: Date
}

export interface AIRequest {
  ai_prompt_id: number
  context: Record<string, any>
  max_tokens?: number
}

export interface AIResponse {
  text: string
  metadata?: Record<string, any>
}

export interface AIGeneration {
  id: number
  uuid: string
  prompt_id?: number
  input_context?: any
  generated_content: string
  tokens_used?: number
  generation_time_ms?: number
  created_by?: number
  created_at: Date
}

// Event and Analytics Types
export interface Event {
  id: number
  uuid: string
  event_type: string
  entity_type?: string
  entity_id?: number
  payload?: any
  user_id?: number
  created_at: Date
}

export interface CampaignAnalytics {
  campaign_id: number
  sent: number
  delivered: number
  opened?: number
  clicked?: number
  replied?: number
  conversions: number
  revenue: number
  date_range: {
    from: Date
    to: Date
  }
}

// Webhook Types
export interface Webhook {
  id: number
  uuid: string
  vendor: string
  event_type: string
  endpoint_url: string
  secret_key?: string
  is_active: boolean
  last_triggered?: Date
  created_at: Date
}

export interface WebhookLog {
  id: number
  webhook_id?: number
  request_payload?: any
  response_status?: number
  response_body?: string
  processing_time_ms?: number
  created_at: Date
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: "asc" | "desc"
}

// Filter and Search Types
export interface ProductFilter {
  category?: string
  brand?: string
  tags?: string[]
  price_min?: number
  price_max?: number
  in_stock?: boolean
}

export interface CustomerFilter {
  tags?: string[]
  areas?: number[]
  consent_marketing?: boolean
  consent_whatsapp?: boolean
  consent_sms?: boolean
  preferred_language?: string
}

export interface OrderFilter {
  status?: string
  source?: string
  customer_id?: number
  shop_id?: number
  date_from?: Date
  date_to?: Date
}

// Integration Types
export interface WhatsAppMessage {
  to: string
  type: "text" | "template"
  text?: {
    body: string
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: any[]
  }
}

export interface SMSMessage {
  to: string
  body: string
  from?: string
}

export interface InstagramPost {
  image_url?: string
  caption: string
  hashtags?: string[]
}

export interface GMBPost {
  summary: string
  call_to_action?: {
    action_type: string
    url?: string
  }
  media?: {
    media_format: string
    source_url: string
  }[]
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type CreateRequest<T> = Omit<T, "id" | "uuid" | "created_at" | "updated_at">
export type UpdateRequest<T> = Partial<Omit<T, "id" | "uuid" | "created_at" | "updated_at">>
