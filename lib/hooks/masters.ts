import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { golangAPI, nestjsAPI } from '@/lib/api'

// ============================================================================
// 1. SYSTEM-WIDE MASTERS (CORE MASTERS)
// ============================================================================

// Company Profile Master
export interface CompanyProfile {
  id: string
  name: string
  legal_name: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  website?: string
  gst_number: string
  pan_number: string
  license_number?: string
  logo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Branch / Store Master
export interface Branch {
  id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  email?: string
  manager_id?: string
  manager_name?: string
  is_head_office: boolean
  is_active: boolean
  working_hours?: {
    monday: { open: string; close: string; is_closed: boolean }
    tuesday: { open: string; close: string; is_closed: boolean }
    wednesday: { open: string; close: string; is_closed: boolean }
    thursday: { open: string; close: string; is_closed: boolean }
    friday: { open: string; close: string; is_closed: boolean }
    saturday: { open: string; close: string; is_closed: boolean }
    sunday: { open: string; close: string; is_closed: boolean }
  }
  created_at: string
}

// Department Master
export interface Department {
  id: string
  name: string
  code: string
  description?: string
  head_id?: string
  head_name?: string
  is_active: boolean
  created_at: string
}

// Role & Permission Master
export interface Role {
  id: string
  name: string
  description?: string
  permissions: {
    module: string
    actions: string[] // ['create', 'read', 'update', 'delete']
  }[]
  is_system_role: boolean
  is_active: boolean
  created_at: string
}

// User / Staff Master
export interface User {
  id: string
  username: string
  email: string
  phone: string
  first_name: string
  last_name: string
  role_id: string
  role_name?: string
  department_id?: string
  department_name?: string
  branch_id?: string
  branch_name?: string
  employee_code?: string
  designation?: string
  date_of_joining?: string
  is_active: boolean
  last_login?: string
  profile_image?: string
  created_at: string
}

// Currency Master
export interface Currency {
  id: string
  code: string // INR, USD, EUR
  name: string
  symbol: string
  exchange_rate: number
  is_base_currency: boolean
  is_active: boolean
  created_at: string
}

// Tax/GST Master
export interface TaxSlab {
  id: string
  name: string
  rate: number // e.g., 5, 12, 18, 28
  description?: string
  hsn_code?: string
  is_active: boolean
  effective_from: string
  effective_to?: string
  created_at: string
}

// Units of Measure (UOM)
export interface UOM {
  id: string
  name: string
  code: string // ml, gm, bottle, strip, tablet
  category: 'weight' | 'volume' | 'count' | 'length' | 'area'
  conversion_factor: number // base unit conversion
  is_base_unit: boolean
  is_active: boolean
  created_at: string
}

// Payment Methods
export interface PaymentMethod {
  id: string
  name: string
  code: string // CASH, CARD, UPI, CREDIT
  type: 'cash' | 'digital' | 'credit'
  is_active: boolean
  processing_fee?: number
  min_amount?: number
  max_amount?: number
  created_at: string
}

// Notification Templates
export interface NotificationTemplate {
  id: string
  name: string
  type: 'sms' | 'email' | 'whatsapp' | 'push'
  subject?: string
  body: string
  variables: string[] // placeholders like {customer_name}, {invoice_number}
  is_active: boolean
  created_at: string
}

// ============================================================================
// 2. PRODUCT & INVENTORY MASTERS
// ============================================================================

// Category Master
export interface Category {
  id: string
  name: string
  code: string
  parent_id?: string
  parent_name?: string
  description?: string
  image_url?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

// Brand / Manufacturer Master
export interface Brand {
  id: string
  name: string
  code: string
  description?: string
  country?: string
  website?: string
  logo_url?: string
  is_active: boolean
  created_at: string
}

// Product Group / Segment
export interface ProductGroup {
  id: string
  name: string
  code: string
  description?: string
  category_ids: string[]
  is_active: boolean
  created_at: string
}

// Potency Master
export interface Potency {
  id: string
  name: string
  code: string // 30C, 200C, 1M, Q, etc.
  value: number // numeric representation
  is_active: boolean
  created_at: string
}

// Size / Packing Master
export interface PackingSize {
  id: string
  name: string
  code: string
  quantity: number
  unit_id: string
  unit_name?: string
  is_active: boolean
  created_at: string
}

// Rack / Shelf / Location Master
export interface RackLocation {
  id: string
  name: string
  code: string
  warehouse_id?: string
  warehouse_name?: string
  type: 'rack' | 'shelf' | 'bin' | 'cold_storage'
  capacity?: number
  temperature_controlled?: boolean
  is_active: boolean
  created_at: string
}

// Warehouse / Godown Master
export interface Warehouse {
  id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  pincode: string
  phone?: string
  manager_id?: string
  manager_name?: string
  is_active: boolean
  created_at: string
}

// HSN Code Master
export interface HSNCode {
  id: string
  code: string // 8-digit HSN code
  description: string
  gst_rate: number
  is_active: boolean
  effective_from: string
  created_at: string
}

// Price List / Rate Master
export interface PriceList {
  id: string
  name: string
  type: 'purchase' | 'sale' | 'mrp'
  effective_from: string
  effective_to?: string
  is_active: boolean
  created_at: string
}

// ============================================================================
// ADDITIONAL PRODUCT & INVENTORY MASTERS
// ============================================================================

// Product Master (Base Product Info)
export interface Product {
  id: string
  name: string
  code: string
  description?: string
  category_id: string
  category_name?: string
  brand_id: string
  brand_name?: string
  potency_id?: string
  potency_name?: string
  packing_size_id: string
  packing_size_name?: string
  hsn_code_id?: string
  hsn_code?: string
  barcode?: string
  reorder_level: number
  min_stock_level: number
  max_stock_level: number
  is_prescription_required: boolean
  is_active: boolean
  image_url?: string
  created_at: string
}

// SKU / Item Code Master
export interface SKUCode {
  id: string
  code: string
  product_id: string
  product_name?: string
  variant: string // e.g., "30ml Liquid", "10 Tablets"
  barcode?: string
  is_active: boolean
  created_at: string
}

// Subcategory Master
export interface Subcategory {
  id: string
  name: string
  code: string
  parent_category_id: string
  parent_category_name?: string
  description?: string
  image_url?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

// Variant Master (Form/Format)
export interface ProductVariant {
  id: string
  name: string
  code: string
  type: 'liquid' | 'tablet' | 'powder' | 'cream' | 'drops' | 'syrup'
  description?: string
  is_active: boolean
  created_at: string
}

// Batch Master
export interface Batch {
  id: string
  batch_number: string
  product_id: string
  product_name?: string
  sku_code?: string
  manufacturing_date: string
  expiry_date: string
  quantity: number
  purchase_rate: number
  selling_rate: number
  mrp: number
  vendor_id?: string
  vendor_name?: string
  is_active: boolean
  created_at: string
}

// Discount/Offer Master
export interface DiscountOffer {
  id: string
  name: string
  code: string
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y'
  value: number
  min_purchase_amount?: number
  max_discount_amount?: number
  valid_from: string
  valid_to: string
  applicable_products?: string[]
  applicable_categories?: string[]
  is_active: boolean
  created_at: string
}

// Reorder Level Master
export interface ReorderLevel {
  id: string
  product_id: string
  product_name?: string
  min_level: number
  max_level: number
  reorder_quantity: number
  lead_time_days: number
  is_active: boolean
  created_at: string
}

// ============================================================================
// ADDITIONAL SALES MASTERS
// ============================================================================

// Credit Limit Master
export interface CreditLimit {
  id: string
  customer_id: string
  customer_name?: string
  limit_amount: number
  used_amount: number
  available_amount: number
  valid_from: string
  valid_to?: string
  is_active: boolean
  created_at: string
}

// POS Settings Master
export interface POSSettings {
  id: string
  branch_id: string
  branch_name?: string
  default_payment_method: string
  enable_loyalty_points: boolean
  loyalty_points_rate: number
  enable_discounts: boolean
  max_discount_percentage: number
  enable_round_off: boolean
  round_off_method: 'nearest' | 'up' | 'down'
  print_receipt: boolean
  receipt_template_id?: string
  is_active: boolean
  created_at: string
}

// E-Invoice Template Master
export interface EInvoiceTemplate {
  id: string
  name: string
  template_type: 'pdf' | 'html' | 'json'
  content: string
  variables: string[] // placeholders like {invoice_number}, {customer_name}
  is_default: boolean
  is_active: boolean
  created_at: string
}

// Return Reason Master
export interface ReturnReason {
  id: string
  name: string
  code: string
  type: 'damaged' | 'expired' | 'wrong_item' | 'customer_request' | 'quality_issue'
  description?: string
  is_active: boolean
  created_at: string
}

// ============================================================================
// ADDITIONAL PURCHASE MASTERS
// ============================================================================

// Purchase Order Terms
export interface PurchaseOrderTerms {
  id: string
  name: string
  payment_terms: string
  delivery_terms: string
  warranty_terms?: string
  return_policy?: string
  is_default: boolean
  is_active: boolean
  created_at: string
}

// PO Status Master
export interface POStatus {
  id: string
  name: string
  code: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

// Freight/Charges Master
export interface FreightCharge {
  id: string
  name: string
  type: 'fixed' | 'percentage' | 'per_unit'
  value: number
  min_order_amount?: number
  max_charge?: number
  is_active: boolean
  created_at: string
}

// Purchase Return Reason Master
export interface PurchaseReturnReason {
  id: string
  name: string
  code: string
  type: 'defective' | 'wrong_item' | 'quantity_short' | 'expired' | 'damaged'
  description?: string
  is_active: boolean
  created_at: string
}

// Price Comparison Master
export interface PriceComparison {
  id: string
  product_id: string
  product_name?: string
  vendor_id: string
  vendor_name?: string
  purchase_rate: number
  mrp: number
  discount_percentage?: number
  valid_from: string
  valid_to?: string
  is_active: boolean
  created_at: string
}

// GRN Template Master
export interface GRNTemplate {
  id: string
  name: string
  template_type: 'pdf' | 'html' | 'json'
  content: string
  variables: string[]
  is_default: boolean
  is_active: boolean
  created_at: string
}

// Purchase Tax Master
export interface PurchaseTax {
  id: string
  name: string
  rate: number
  type: 'gst' | 'custom_duty' | 'excise' | 'other'
  is_active: boolean
  effective_from: string
  effective_to?: string
  created_at: string
}

// ============================================================================
// ADDITIONAL CUSTOMER / CRM MASTERS
// ============================================================================

// Contact Type Master
export interface ContactType {
  id: string
  name: string
  code: string
  type: 'phone' | 'email' | 'whatsapp' | 'address' | 'social'
  is_primary: boolean
  is_active: boolean
  created_at: string
}

// Address Book Master
export interface AddressBook {
  id: string
  customer_id: string
  customer_name?: string
  type: 'billing' | 'shipping' | 'office' | 'residence'
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  pincode: string
  country: string
  landmark?: string
  is_default: boolean
  is_active: boolean
  created_at: string
}

// Loyalty Program Master
export interface LoyaltyProgram {
  id: string
  name: string
  code: string
  points_per_purchase: number
  points_value: number // 1 point = X rupees
  min_points_for_redemption: number
  max_redemption_percentage: number
  validity_days: number
  is_active: boolean
  created_at: string
}

// Feedback Type Master
export interface FeedbackType {
  id: string
  name: string
  code: string
  type: 'complaint' | 'suggestion' | 'appreciation' | 'query'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sla_hours: number
  is_active: boolean
  created_at: string
}

// Lead Source Master
export interface LeadSource {
  id: string
  name: string
  code: string
  type: 'referral' | 'campaign' | 'walk_in' | 'online' | 'social_media' | 'advertisement'
  description?: string
  conversion_rate?: number
  is_active: boolean
  created_at: string
}

// Follow-up Status Master
export interface FollowupStatus {
  id: string
  name: string
  code: string
  color: string
  sort_order: number
  is_closed: boolean
  is_active: boolean
  created_at: string
}

// Ticket Category Master
export interface TicketCategory {
  id: string
  name: string
  code: string
  parent_id?: string
  parent_name?: string
  sla_hours: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_active: boolean
  created_at: string
}

// ============================================================================
// ADDITIONAL HR & STAFF MASTERS
// ============================================================================

// Shift Master
export interface Shift {
  id: string
  name: string
  code: string
  start_time: string
  end_time: string
  break_start?: string
  break_end?: string
  working_hours: number
  is_night_shift: boolean
  is_active: boolean
  created_at: string
}

// Attendance Rule Master
export interface AttendanceRule {
  id: string
  name: string
  code: string
  type: 'daily' | 'weekly' | 'monthly'
  min_hours: number
  max_late_arrivals: number
  grace_period_minutes: number
  is_active: boolean
  created_at: string
}

// Leave Type Master
export interface LeaveType {
  id: string
  name: string
  code: string
  type: 'casual' | 'sick' | 'earned' | 'maternity' | 'paternity' | 'emergency'
  max_days_per_year: number
  requires_approval: boolean
  carry_forward_allowed: boolean
  max_carry_forward: number
  is_active: boolean
  created_at: string
}

// Salary Structure Master
export interface SalaryStructure {
  id: string
  name: string
  code: string
  designation_id: string
  designation_name?: string
  basic_percentage: number
  hra_percentage: number
  da_percentage: number
  ta_percentage: number
  other_allowances_percentage: number
  pf_percentage: number
  esi_percentage: number
  professional_tax: number
  is_active: boolean
  created_at: string
}

// Commission Rule Master
export interface CommissionRule {
  id: string
  name: string
  code: string
  type: 'percentage' | 'fixed' | 'tiered'
  value: number
  min_sales_amount?: number
  max_commission?: number
  applicable_products?: string[]
  applicable_categories?: string[]
  is_active: boolean
  created_at: string
}

// Performance Metric Master
export interface PerformanceMetric {
  id: string
  name: string
  code: string
  category: 'sales' | 'customer_satisfaction' | 'productivity' | 'quality'
  unit: 'number' | 'percentage' | 'currency' | 'time'
  target_value: number
  weightage: number
  is_active: boolean
  created_at: string
}

// ============================================================================
// ADDITIONAL FINANCE & ACCOUNTING MASTERS
// ============================================================================

// Payment Voucher Type
export interface PaymentVoucherType {
  id: string
  name: string
  code: string
  type: 'cash' | 'bank' | 'upi' | 'cheque' | 'card'
  requires_approval: boolean
  max_amount?: number
  is_active: boolean
  created_at: string
}

// GST Return Period Master
export interface GSTReturnPeriod {
  id: string
  name: string
  code: string
  period: 'monthly' | 'quarterly' | 'annual'
  start_month: number
  end_month: number
  due_date: number // day of month
  is_active: boolean
  created_at: string
}

// Cheque Book Master
export interface ChequeBook {
  id: string
  bank_id: string
  bank_name?: string
  account_number: string
  cheque_series_start: string
  cheque_series_end: string
  total_cheques: number
  used_cheques: number
  issued_date: string
  is_active: boolean
  created_at: string
}

// Vendor/Customer Ledger Master
export interface VendorCustomerLedger {
  id: string
  party_id: string
  party_name?: string
  party_type: 'vendor' | 'customer'
  transaction_date: string
  transaction_type: 'invoice' | 'payment' | 'credit_note' | 'debit_note'
  reference_number?: string
  debit_amount: number
  credit_amount: number
  balance: number
  created_at: string
}

// ============================================================================
// ADDITIONAL MARKETING & CAMPAIGN MASTERS
// ============================================================================

// Template Master (Marketing)
export interface MarketingTemplate {
  id: string
  name: string
  type: 'sms' | 'email' | 'whatsapp' | 'push'
  subject?: string
  body: string
  variables: string[]
  category: 'promotional' | 'informational' | 'transactional'
  is_active: boolean
  created_at: string
}

// Offer/Coupon Master
export interface OfferCoupon {
  id: string
  name: string
  code: string
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping'
  value: number
  min_purchase_amount?: number
  max_discount_amount?: number
  usage_limit?: number
  used_count: number
  valid_from: string
  valid_to: string
  applicable_products?: string[]
  applicable_categories?: string[]
  is_active: boolean
  created_at: string
}

// Target Segment Master
export interface TargetSegment {
  id: string
  name: string
  code: string
  criteria: {
    customer_groups?: string[]
    purchase_history?: {
      min_amount?: number
      max_amount?: number
      min_frequency?: number
      date_range?: {
        start: string
        end: string
      }
    }
    demographics?: {
      age_range?: { min: number; max: number }
      gender?: string[]
      location?: string[]
    }
  }
  customer_count: number
  is_active: boolean
  created_at: string
}

// Channel Config Master
export interface ChannelConfig {
  id: string
  name: string
  type: 'sms' | 'email' | 'whatsapp' | 'push'
  provider: string
  api_key: string
  api_secret?: string
  sender_id?: string
  is_active: boolean
  rate_limit_per_hour: number
  created_at: string
}

// Post Scheduler Master
export interface PostScheduler {
  id: string
  name: string
  platforms: string[] // facebook, instagram, google_business
  post_type: 'text' | 'image' | 'video' | 'carousel'
  frequency: 'daily' | 'weekly' | 'monthly'
  time_slots: string[]
  content_categories: string[]
  hashtags: string[]
  is_active: boolean
  created_at: string
}

// AI Prompt Template Master
export interface AIPromptTemplate {
  id: string
  name: string
  type: 'content_generation' | 'customer_support' | 'product_description' | 'social_media'
  prompt_text: string
  variables: string[]
  output_format: 'text' | 'html' | 'json'
  max_tokens: number
  temperature: number
  is_active: boolean
  created_at: string
}

// Festival/Event Master
export interface FestivalEvent {
  id: string
  name: string
  code: string
  start_date: string
  end_date: string
  type: 'festival' | 'seasonal' | 'promotion' | 'holiday'
  discount_percentage?: number
  special_offers?: string[]
  is_active: boolean
  created_at: string
}

// ============================================================================
// 3. SALES MASTERS
// ============================================================================

// Sales Type Master
export interface SalesType {
  id: string
  name: string
  code: string
  description?: string
  is_retail: boolean
  is_wholesale: boolean
  is_b2b: boolean
  is_active: boolean
  created_at: string
}

// Invoice Series Master
export interface InvoiceSeries {
  id: string
  name: string
  prefix: string // INV, RET, WHO
  start_number: number
  current_number: number
  end_number: number
  branch_id?: string
  sales_type_id?: string
  is_active: boolean
  created_at: string
}

// Price Level Master
export interface PriceLevel {
  id: string
  name: string
  code: string
  description?: string
  discount_percentage?: number
  markup_percentage?: number
  is_default: boolean
  is_active: boolean
  created_at: string
}

// Salesperson / Agent Master
export interface Salesperson {
  id: string
  name: string
  code: string
  phone: string
  email?: string
  department_id?: string
  branch_id?: string
  commission_percentage?: number
  is_active: boolean
  created_at: string
}

// Payment Terms Master
export interface PaymentTerm {
  id: string
  name: string
  code: string
  days: number // 0 for immediate, 7, 15, 30, etc.
  description?: string
  is_default: boolean
  is_active: boolean
  created_at: string
}

// ============================================================================
// 4. PURCHASE MASTERS
// ============================================================================

// Vendor Master
export interface Vendor {
  id: string
  name: string
  code: string
  contact_person: string
  phone: string
  email?: string
  address: string
  city: string
  state: string
  pincode: string
  gst_number?: string
  pan_number?: string
  payment_terms_id?: string
  payment_terms_name?: string
  credit_limit?: number
  is_active: boolean
  created_at: string
}

// Vendor Type Master
export interface VendorType {
  id: string
  name: string
  code: string
  description?: string
  is_manufacturer: boolean
  is_distributor: boolean
  is_importer: boolean
  is_active: boolean
  created_at: string
}

// ============================================================================
// 5. CUSTOMER / CRM MASTERS
// ============================================================================

// Customer Master
export interface Customer {
  id: string
  name: string
  code: string
  phone: string
  email?: string
  address: string
  city: string
  state: string
  pincode: string
  gst_number?: string
  customer_group_id?: string
  customer_group_name?: string
  loyalty_points?: number
  credit_limit?: number
  payment_terms_id?: string
  is_active: boolean
  created_at: string
}

// Customer Group Master
export interface CustomerGroup {
  id: string
  name: string
  code: string
  description?: string
  discount_percentage?: number
  credit_limit?: number
  is_active: boolean
  created_at: string
}

// ============================================================================
// 6. HR & STAFF MASTERS
// ============================================================================

// Employee Master
export interface Employee {
  id: string
  employee_code: string
  first_name: string
  last_name: string
  email: string
  phone: string
  department_id: string
  department_name?: string
  designation: string
  branch_id?: string
  branch_name?: string
  date_of_joining: string
  salary?: number
  is_active: boolean
  created_at: string
}

// Designation Master
export interface Designation {
  id: string
  name: string
  code: string
  department_id: string
  department_name?: string
  grade?: string
  is_active: boolean
  created_at: string
}

// ============================================================================
// 7. FINANCE & ACCOUNTING MASTERS
// ============================================================================

// Ledger Master (Chart of Accounts)
export interface LedgerAccount {
  id: string
  account_code: string
  account_name: string
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  parent_account_id?: string
  parent_account_name?: string
  opening_balance: number
  current_balance: number
  is_active: boolean
  created_at: string
}

// Cost Center Master
export interface CostCenter {
  id: string
  name: string
  code: string
  description?: string
  branch_id?: string
  branch_name?: string
  is_active: boolean
  created_at: string
}

// Expense Category Master
export interface ExpenseCategory {
  id: string
  name: string
  code: string
  description?: string
  parent_id?: string
  parent_name?: string
  is_active: boolean
  created_at: string
}

// Bank Master
export interface Bank {
  id: string
  name: string
  code: string
  account_number: string
  ifsc_code: string
  branch_name: string
  is_active: boolean
  created_at: string
}

// ============================================================================
// 8. MARKETING & CAMPAIGN MASTERS
// ============================================================================

// Campaign Type Master
export interface CampaignType {
  id: string
  name: string
  code: string
  description?: string
  channel: 'sms' | 'email' | 'whatsapp' | 'social' | 'push'
  is_active: boolean
  created_at: string
}

// ============================================================================
// 9. AI & INSIGHTS MASTERS
// ============================================================================

// AI Agent Master
export interface AIAgent {
  id: string
  name: string
  type: 'content_generator' | 'inventory_optimizer' | 'sales_forecaster' | 'customer_insights'
  description?: string
  is_active: boolean
  model_version: string
  config: Record<string, any>
  created_at: string
}

// ============================================================================
// 10. SETTINGS MASTERS
// ============================================================================

// System Settings
export interface SystemSettings {
  id: string
  key: string
  value: any
  category: 'general' | 'finance' | 'inventory' | 'sales' | 'purchases' | 'hr' | 'marketing'
  description?: string
  is_system_setting: boolean
  created_at: string
}

// ============================================================================
// MASTER DATA HOOKS
// ============================================================================

// Company Profile Hooks
export function useCompanyProfile() {
  return useQuery({
    queryKey: ['masters', 'company'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/company')
      return res.data as CompanyProfile
    },
    staleTime: 300_000, // 5 minutes
  })
}

// Branch Hooks
export function useBranches() {
  return useQuery({
    queryKey: ['masters', 'branches'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/branches')
      return res.data as Branch[]
    },
    staleTime: 300_000,
  })
}

// Department Hooks
export function useDepartments() {
  return useQuery({
    queryKey: ['masters', 'departments'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/departments')
      return res.data as Department[]
    },
    staleTime: 300_000,
  })
}

// Role Hooks
export function useRoles() {
  return useQuery({
    queryKey: ['masters', 'roles'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/roles')
      return res.data as Role[]
    },
    staleTime: 300_000,
  })
}

// User Hooks
export function useUsers() {
  return useQuery({
    queryKey: ['masters', 'users'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/users')
      return res.data as User[]
    },
    staleTime: 60_000,
  })
}

// Currency Hooks
export function useCurrencies() {
  return useQuery({
    queryKey: ['masters', 'currencies'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/currencies')
      return res.data as Currency[]
    },
    staleTime: 300_000,
  })
}

// Tax Slab Hooks
export function useTaxSlabs() {
  return useQuery({
    queryKey: ['masters', 'tax-slabs'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/tax-slabs')
      return res.data as TaxSlab[]
    },
    staleTime: 300_000,
  })
}

// UOM Hooks
export function useUOMs() {
  return useQuery({
    queryKey: ['masters', 'uoms'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/uoms')
      return res.data as UOM[]
    },
    staleTime: 300_000,
  })
}

// Payment Methods Hooks
export function usePaymentMethods() {
  return useQuery({
    queryKey: ['masters', 'payment-methods'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/payment-methods')
      return res.data as PaymentMethod[]
    },
    staleTime: 300_000,
  })
}

// Categories Hooks
export function useCategories() {
  return useQuery({
    queryKey: ['masters', 'categories'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/categories')
      return res.data as Category[]
    },
    staleTime: 300_000,
  })
}

// Brands Hooks
export function useBrands() {
  return useQuery({
    queryKey: ['masters', 'brands'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/brands')
      return res.data as Brand[]
    },
    staleTime: 300_000,
  })
}

// Vendors Hooks
export function useVendors() {
  return useQuery({
    queryKey: ['masters', 'vendors'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/vendors')
      return res.data as Vendor[]
    },
    staleTime: 300_000,
  })
}

// Customers Hooks
export function useCustomers() {
  return useQuery({
    queryKey: ['masters', 'customers'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/customers')
      return res.data as Customer[]
    },
    staleTime: 60_000,
  })
}

// Employees Hooks
export function useEmployees() {
  return useQuery({
    queryKey: ['masters', 'employees'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/employees')
      return res.data as Employee[]
    },
    staleTime: 300_000,
  })
}

// Ledger Accounts Hooks
export function useLedgerAccounts() {
  return useQuery({
    queryKey: ['masters', 'ledger-accounts'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/ledger-accounts')
      return res.data as LedgerAccount[]
    },
    staleTime: 300_000,
  })
}

// ============================================================================
// SALES MASTERS HOOKS
// ============================================================================

// Sales Types Hooks
export function useSalesTypes() {
  return useQuery({
    queryKey: ['masters', 'sales-types'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/sales-types')
      return res.data as SalesType[]
    },
    staleTime: 300_000,
  })
}

// Invoice Series Hooks
export function useInvoiceSeries() {
  return useQuery({
    queryKey: ['masters', 'invoice-series'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/invoice-series')
      return res.data as InvoiceSeries[]
    },
    staleTime: 300_000,
  })
}

// Price Levels Hooks
export function usePriceLevels() {
  return useQuery({
    queryKey: ['masters', 'price-levels'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/price-levels')
      return res.data as PriceLevel[]
    },
    staleTime: 300_000,
  })
}

// Salespeople Hooks
export function useSalespeople() {
  return useQuery({
    queryKey: ['masters', 'salespeople'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/salespeople')
      return res.data as Salesperson[]
    },
    staleTime: 300_000,
  })
}

// Payment Terms Hooks
export function usePaymentTerms() {
  return useQuery({
    queryKey: ['masters', 'payment-terms'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/payment-terms')
      return res.data as PaymentTerm[]
    },
    staleTime: 300_000,
  })
}

// ============================================================================
// PURCHASE MASTERS HOOKS
// ============================================================================

// Vendor Types Hooks
export function useVendorTypes() {
  return useQuery({
    queryKey: ['masters', 'vendor-types'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/vendor-types')
      return res.data as VendorType[]
    },
    staleTime: 300_000,
  })
}

// ============================================================================
// CUSTOMER MASTERS HOOKS
// ============================================================================

// Customer Groups Hooks
export function useCustomerGroups() {
  return useQuery({
    queryKey: ['masters', 'customer-groups'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/customer-groups')
      return res.data as CustomerGroup[]
    },
    staleTime: 300_000,
  })
}

// ============================================================================
// FINANCE MASTERS HOOKS
// ============================================================================

// Banks Hooks
export function useBanks() {
  return useQuery({
    queryKey: ['masters', 'banks'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/banks')
      return res.data as Bank[]
    },
    staleTime: 300_000,
  })
}

// Cost Centers Hooks
export function useCostCenters() {
  return useQuery({
    queryKey: ['masters', 'cost-centers'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/cost-centers')
      return res.data as CostCenter[]
    },
    staleTime: 300_000,
  })
}

// Expense Categories Hooks
export function useExpenseCategories() {
  return useQuery({
    queryKey: ['masters', 'expense-categories'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/expense-categories')
      return res.data as ExpenseCategory[]
    },
    staleTime: 300_000,
  })
}

// ============================================================================
// PRODUCT & INVENTORY MASTERS HOOKS
// ============================================================================

// Products Hooks
export function useProducts() {
  return useQuery({
    queryKey: ['masters', 'products'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/products')
      return res.data as Product[]
    },
    staleTime: 300_000,
  })
}

// SKU Codes Hooks
export function useSKUCodes() {
  return useQuery({
    queryKey: ['masters', 'sku-codes'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/sku-codes')
      return res.data as SKUCode[]
    },
    staleTime: 300_000,
  })
}

// Subcategories Hooks
export function useSubcategories() {
  return useQuery({
    queryKey: ['masters', 'subcategories'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/subcategories')
      return res.data as Subcategory[]
    },
    staleTime: 300_000,
  })
}

// Product Variants Hooks
export function useProductVariants() {
  return useQuery({
    queryKey: ['masters', 'product-variants'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/product-variants')
      return res.data as ProductVariant[]
    },
    staleTime: 300_000,
  })
}

// Batches Hooks
export function useBatches() {
  return useQuery({
    queryKey: ['masters', 'batches'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/batches')
      return res.data as Batch[]
    },
    staleTime: 60_000, // More frequent updates for batches
  })
}

// Discount Offers Hooks
export function useDiscountOffers() {
  return useQuery({
    queryKey: ['masters', 'discount-offers'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/discount-offers')
      return res.data as DiscountOffer[]
    },
    staleTime: 300_000,
  })
}

// Reorder Levels Hooks
export function useReorderLevels() {
  return useQuery({
    queryKey: ['masters', 'reorder-levels'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/reorder-levels')
      return res.data as ReorderLevel[]
    },
    staleTime: 300_000,
  })
}

// ============================================================================
// ADDITIONAL SALES MASTERS HOOKS
// ============================================================================

// Credit Limits Hooks
export function useCreditLimits() {
  return useQuery({
    queryKey: ['masters', 'credit-limits'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/credit-limits')
      return res.data as CreditLimit[]
    },
    staleTime: 300_000,
  })
}

// POS Settings Hooks
export function usePOSSettings() {
  return useQuery({
    queryKey: ['masters', 'pos-settings'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/pos-settings')
      return res.data as POSSettings[]
    },
    staleTime: 300_000,
  })
}

// Return Reasons Hooks
export function useReturnReasons() {
  return useQuery({
    queryKey: ['masters', 'return-reasons'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/return-reasons')
      return res.data as ReturnReason[]
    },
    staleTime: 300_000,
  })
}

// ============================================================================
// ADDITIONAL PURCHASE MASTERS HOOKS
// ============================================================================

// Purchase Order Terms Hooks
export function usePurchaseOrderTerms() {
  return useQuery({
    queryKey: ['masters', 'purchase-order-terms'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/purchase-order-terms')
      return res.data as PurchaseOrderTerms[]
    },
    staleTime: 300_000,
  })
}

// PO Status Hooks
export function usePOStatuses() {
  return useQuery({
    queryKey: ['masters', 'po-statuses'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/po-statuses')
      return res.data as POStatus[]
    },
    staleTime: 300_000,
  })
}

// Freight Charges Hooks
export function useFreightCharges() {
  return useQuery({
    queryKey: ['masters', 'freight-charges'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/freight-charges')
      return res.data as FreightCharge[]
    },
    staleTime: 300_000,
  })
}

// Purchase Return Reasons Hooks
export function usePurchaseReturnReasons() {
  return useQuery({
    queryKey: ['masters', 'purchase-return-reasons'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/purchase-return-reasons')
      return res.data as PurchaseReturnReason[]
    },
    staleTime: 300_000,
  })
}

// Price Comparisons Hooks
export function usePriceComparisons() {
  return useQuery({
    queryKey: ['masters', 'price-comparisons'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/price-comparisons')
      return res.data as PriceComparison[]
    },
    staleTime: 300_000,
  })
}

// GRN Templates Hooks
export function useGRNTemplates() {
  return useQuery({
    queryKey: ['masters', 'grn-templates'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/grn-templates')
      return res.data as GRNTemplate[]
    },
    staleTime: 300_000,
  })
}

// Purchase Taxes Hooks
export function usePurchaseTaxes() {
  return useQuery({
    queryKey: ['masters', 'purchase-taxes'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/purchase-taxes')
      return res.data as PurchaseTax[]
    },
    staleTime: 300_000,
  })
}

// ============================================================================
// ADDITIONAL CUSTOMER/CRM MASTERS HOOKS
// ============================================================================

// Contact Types Hooks
export function useContactTypes() {
  return useQuery({
    queryKey: ['masters', 'contact-types'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/contact-types')
      return res.data as ContactType[]
    },
    staleTime: 300_000,
  })
}

// Address Books Hooks
export function useAddressBooks() {
  return useQuery({
    queryKey: ['masters', 'address-books'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/address-books')
      return res.data as AddressBook[]
    },
    staleTime: 300_000,
  })
}

// Loyalty Programs Hooks
export function useLoyaltyPrograms() {
  return useQuery({
    queryKey: ['masters', 'loyalty-programs'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/loyalty-programs')
      return res.data as LoyaltyProgram[]
    },
    staleTime: 300_000,
  })
}

// Feedback Types Hooks
export function useFeedbackTypes() {
  return useQuery({
    queryKey: ['masters', 'feedback-types'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/feedback-types')
      return res.data as FeedbackType[]
    },
    staleTime: 300_000,
  })
}

// Lead Sources Hooks
export function useLeadSources() {
  return useQuery({
    queryKey: ['masters', 'lead-sources'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/lead-sources')
      return res.data as LeadSource[]
    },
    staleTime: 300_000,
  })
}

// Followup Statuses Hooks
export function useFollowupStatuses() {
  return useQuery({
    queryKey: ['masters', 'followup-statuses'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/followup-statuses')
      return res.data as FollowupStatus[]
    },
    staleTime: 300_000,
  })
}

// Ticket Categories Hooks
export function useTicketCategories() {
  return useQuery({
    queryKey: ['masters', 'ticket-categories'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/ticket-categories')
      return res.data as TicketCategory[]
    },
    staleTime: 300_000,
  })
}

// ============================================================================
// ADDITIONAL HR & STAFF MASTERS HOOKS
// ============================================================================

// Shifts Hooks
export function useShifts() {
  return useQuery({
    queryKey: ['masters', 'shifts'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/shifts')
      return res.data as Shift[]
    },
    staleTime: 300_000,
  })
}

// Attendance Rules Hooks
export function useAttendanceRules() {
  return useQuery({
    queryKey: ['masters', 'attendance-rules'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/attendance-rules')
      return res.data as AttendanceRule[]
    },
    staleTime: 300_000,
  })
}

// Leave Types Hooks
export function useLeaveTypes() {
  return useQuery({
    queryKey: ['masters', 'leave-types'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/leave-types')
      return res.data as LeaveType[]
    },
    staleTime: 300_000,
  })
}

// Salary Structures Hooks
export function useSalaryStructures() {
  return useQuery({
    queryKey: ['masters', 'salary-structures'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/salary-structures')
      return res.data as SalaryStructure[]
    },
    staleTime: 300_000,
  })
}

// Commission Rules Hooks
export function useCommissionRules() {
  return useQuery({
    queryKey: ['masters', 'commission-rules'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/commission-rules')
      return res.data as CommissionRule[]
    },
    staleTime: 300_000,
  })
}

// Performance Metrics Hooks
export function usePerformanceMetrics() {
  return useQuery({
    queryKey: ['masters', 'performance-metrics'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/performance-metrics')
      return res.data as PerformanceMetric[]
    },
    staleTime: 300_000,
  })
}

// ============================================================================
// ADDITIONAL FINANCE & ACCOUNTING MASTERS HOOKS
// ============================================================================

// Payment Voucher Types Hooks
export function usePaymentVoucherTypes() {
  return useQuery({
    queryKey: ['masters', 'payment-voucher-types'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/payment-voucher-types')
      return res.data as PaymentVoucherType[]
    },
    staleTime: 300_000,
  })
}

// GST Return Periods Hooks
export function useGSTReturnPeriods() {
  return useQuery({
    queryKey: ['masters', 'gst-return-periods'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/gst-return-periods')
      return res.data as GSTReturnPeriod[]
    },
    staleTime: 300_000,
  })
}

// Cheque Books Hooks
export function useChequeBooks() {
  return useQuery({
    queryKey: ['masters', 'cheque-books'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/cheque-books')
      return res.data as ChequeBook[]
    },
    staleTime: 300_000,
  })
}

// Vendor Customer Ledgers Hooks
export function useVendorCustomerLedgers() {
  return useQuery({
    queryKey: ['masters', 'vendor-customer-ledgers'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/vendor-customer-ledgers')
      return res.data as VendorCustomerLedger[]
    },
    staleTime: 300_000,
  })
}

// ============================================================================
// ADDITIONAL MARKETING & CAMPAIGN MASTERS HOOKS
// ============================================================================

// Marketing Templates Hooks
export function useMarketingTemplates() {
  return useQuery({
    queryKey: ['masters', 'marketing-templates'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/marketing-templates')
      return res.data as MarketingTemplate[]
    },
    staleTime: 300_000,
  })
}

// Offer Coupons Hooks
export function useOfferCoupons() {
  return useQuery({
    queryKey: ['masters', 'offer-coupons'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/offer-coupons')
      return res.data as OfferCoupon[]
    },
    staleTime: 300_000,
  })
}

// Target Segments Hooks
export function useTargetSegments() {
  return useQuery({
    queryKey: ['masters', 'target-segments'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/target-segments')
      return res.data as TargetSegment[]
    },
    staleTime: 300_000,
  })
}

// Channel Configs Hooks
export function useChannelConfigs() {
  return useQuery({
    queryKey: ['masters', 'channel-configs'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/channel-configs')
      return res.data as ChannelConfig[]
    },
    staleTime: 300_000,
  })
}

// Post Schedulers Hooks
export function usePostSchedulers() {
  return useQuery({
    queryKey: ['masters', 'post-schedulers'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/post-schedulers')
      return res.data as PostScheduler[]
    },
    staleTime: 300_000,
  })
}

// AI Prompt Templates Hooks
export function useAIPromptTemplates() {
  return useQuery({
    queryKey: ['masters', 'ai-prompt-templates'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/ai-prompt-templates')
      return res.data as AIPromptTemplate[]
    },
    staleTime: 300_000,
  })
}

// Festival Events Hooks
export function useFestivalEvents() {
  return useQuery({
    queryKey: ['masters', 'festival-events'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/masters/festival-events')
      return res.data as FestivalEvent[]
    },
    staleTime: 300_000,
  })
}

// ============================================================================
// MASTER MUTATIONS
// ============================================================================

export function useMasterMutations() {
  const queryClient = useQueryClient()

  // Generic mutation for any master
  const createMaster = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      const res = await golangAPI.post(`/api/masters/${endpoint}`, data)
      return res.data
    },
    onSuccess: (_, { endpoint }) => {
      queryClient.invalidateQueries({ queryKey: ['masters', endpoint] })
    },
  })

  const updateMaster = useMutation({
    mutationFn: async ({ endpoint, id, data }: { endpoint: string; id: string; data: any }) => {
      const res = await golangAPI.put(`/api/masters/${endpoint}/${id}`, data)
      return res.data
    },
    onSuccess: (_, { endpoint }) => {
      queryClient.invalidateQueries({ queryKey: ['masters', endpoint] })
    },
  })

  const deleteMaster = useMutation({
    mutationFn: async ({ endpoint, id }: { endpoint: string; id: string }) => {
      await golangAPI.delete(`/api/masters/${endpoint}/${id}`)
    },
    onSuccess: (_, { endpoint }) => {
      queryClient.invalidateQueries({ queryKey: ['masters', endpoint] })
    },
  })

  return {
    create: createMaster,
    update: updateMaster,
    delete: deleteMaster,
  }
}
