import React from "react"
import {
  Building2, Users, Truck, Package, ShoppingCart, CreditCard, Calculator,
  Settings, UserCheck, TrendingUp, MessageSquare, Bot, Shield,
  Tags, Archive, FileText, Percent, RefreshCw, Target, Heart,
  Clock, Award, DollarSign, Receipt, CheckCircle, AlertTriangle,
  Phone, MapPin, Gift, Star, Headphones, Calendar, Trophy,
  Banknote, FileCheck, XCircle, Filter, Hash, Image, Workflow,
  Zap, Calendar as CalendarIcon, Medal, PiggyBank, CreditCard as CreditCardIcon
} from "lucide-react"

export interface MasterDataConfig {
  endpoint: string
  title: string
  description: string
  icon: React.ReactNode
  category: 'system' | 'product' | 'sales' | 'purchase' | 'customer' | 'hr' | 'finance' | 'marketing' | 'social' | 'ai' | 'settings' | 'security'
  tableColumns: { key: string; label: string; render?: (value: any, item: any) => React.ReactNode; sortable?: boolean }[]
  searchFields?: string[]
  formFields: Array<{
    key: string
    label: string
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'boolean' | 'number' | 'date'
    required?: boolean
    options?: { label: string; value: string }[]
    placeholder?: string
  }>
  actions?: {
    canEdit?: boolean
    canDelete?: boolean
    canView?: boolean
    customActions?: { label: string; action: (item: any) => void }[]
  }
}

// Master Data Configurations
export const masterDataConfigs: MasterDataConfig[] = [
  // System Masters
  {
    endpoint: 'company-profile',
    title: 'Company Profile',
    description: 'Configure your business information and settings',
    icon: <Building2 className="w-8 h-8 text-blue-600" />,
    category: 'system',
    tableColumns: [
      { key: 'name', label: 'Company Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'city', label: 'City' },
      { key: 'gst_number', label: 'GST Number' },
    ],
    formFields: [
      { key: 'name', label: 'Company Name', type: 'text', required: true },
      { key: 'legal_name', label: 'Legal Name', type: 'text', required: true },
      { key: 'address', label: 'Address', type: 'textarea', required: true },
      { key: 'city', label: 'City', type: 'text', required: true },
      { key: 'state', label: 'State', type: 'text', required: true },
      { key: 'pincode', label: 'Pincode', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'tel', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'website', label: 'Website', type: 'text' },
      { key: 'gst_number', label: 'GST Number', type: 'text', required: true },
      { key: 'pan_number', label: 'PAN Number', type: 'text', required: true },
      { key: 'license_number', label: 'License Number', type: 'text' },
      { key: 'logo_url', label: 'Logo URL', type: 'text' },
    ]
  },

  // Product Masters
  {
    endpoint: 'products',
    title: 'Products',
    description: 'Manage your homeopathy product catalog',
    icon: <Package className="w-8 h-8 text-green-600" />,
    category: 'product',
    tableColumns: [
      { key: 'name', label: 'Product Name', sortable: true },
      { key: 'code', label: 'Product Code', sortable: true },
      { key: 'category_name', label: 'Category' },
      { key: 'brand_name', label: 'Brand' },
      { key: 'potency_name', label: 'Potency' },
      { key: 'packing_size_name', label: 'Pack Size' },
      { key: 'is_prescription_required', label: 'Rx Required', render: (value) => value ? 'Yes' : 'No' },
      { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
    ],
    searchFields: ['name', 'code', 'category_name', 'brand_name'],
    formFields: [
      { key: 'name', label: 'Product Name', type: 'text', required: true },
      { key: 'code', label: 'Product Code', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'category_id', label: 'Category', type: 'select', required: true },
      { key: 'brand_id', label: 'Brand', type: 'select' },
      { key: 'potency_id', label: 'Potency', type: 'select' },
      { key: 'packing_size_id', label: 'Pack Size', type: 'select', required: true },
      { key: 'hsn_code_id', label: 'HSN Code', type: 'select' },
      { key: 'barcode', label: 'Barcode', type: 'text' },
      { key: 'reorder_level', label: 'Reorder Level', type: 'number' },
      { key: 'min_stock_level', label: 'Min Stock Level', type: 'number' },
      { key: 'max_stock_level', label: 'Max Stock Level', type: 'number' },
      { key: 'is_prescription_required', label: 'Prescription Required', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ]
  },

  {
    endpoint: 'categories',
    title: 'Categories',
    description: 'Organize products into hierarchical categories',
    icon: <Tags className="w-8 h-8 text-orange-600" />,
    category: 'product',
    tableColumns: [
      { key: 'name', label: 'Category Name', sortable: true },
      { key: 'code', label: 'Category Code', sortable: true },
      { key: 'parent_name', label: 'Parent Category' },
      { key: 'sort_order', label: 'Sort Order' },
      { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
    ],
    searchFields: ['name', 'code', 'parent_name'],
    formFields: [
      { key: 'name', label: 'Category Name', type: 'text', required: true },
      { key: 'code', label: 'Category Code', type: 'text', required: true },
      { key: 'parent_id', label: 'Parent Category', type: 'select' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image_url', label: 'Image URL', type: 'text' },
      { key: 'sort_order', label: 'Sort Order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ]
  },

  {
    endpoint: 'brands',
    title: 'Brands',
    description: 'Manage product brands and manufacturers',
    icon: <Archive className="w-8 h-8 text-purple-600" />,
    category: 'product',
    tableColumns: [
      { key: 'name', label: 'Brand Name', sortable: true },
      { key: 'code', label: 'Brand Code', sortable: true },
      { key: 'country', label: 'Country' },
      { key: 'website', label: 'Website' },
      { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
    ],
    searchFields: ['name', 'code', 'country'],
    formFields: [
      { key: 'name', label: 'Brand Name', type: 'text', required: true },
      { key: 'code', label: 'Brand Code', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'website', label: 'Website', type: 'text' },
      { key: 'logo_url', label: 'Logo URL', type: 'text' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ]
  },

  // Sales Masters
  {
    endpoint: 'sales-types',
    title: 'Sales Types',
    description: 'Define different types of sales (Retail, Wholesale, B2B)',
    icon: <ShoppingCart className="w-8 h-8 text-blue-600" />,
    category: 'sales',
    tableColumns: [
      { key: 'name', label: 'Sales Type', sortable: true },
      { key: 'code', label: 'Code', sortable: true },
      { key: 'description', label: 'Description' },
      { key: 'is_retail', label: 'Retail', render: (value) => value ? 'Yes' : 'No' },
      { key: 'is_wholesale', label: 'Wholesale', render: (value) => value ? 'Yes' : 'No' },
      { key: 'is_b2b', label: 'B2B', render: (value) => value ? 'Yes' : 'No' },
      { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
    ],
    searchFields: ['name', 'code'],
    formFields: [
      { key: 'name', label: 'Sales Type Name', type: 'text', required: true },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'is_retail', label: 'Retail', type: 'boolean' },
      { key: 'is_wholesale', label: 'Wholesale', type: 'boolean' },
      { key: 'is_b2b', label: 'B2B', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ]
  },

  {
    endpoint: 'payment-terms',
    title: 'Payment Terms',
    description: 'Configure payment terms and credit periods',
    icon: <CreditCard className="w-8 h-8 text-green-600" />,
    category: 'sales',
    tableColumns: [
      { key: 'name', label: 'Term Name', sortable: true },
      { key: 'code', label: 'Code', sortable: true },
      { key: 'days', label: 'Credit Days' },
      { key: 'description', label: 'Description' },
      { key: 'is_default', label: 'Default', render: (value) => value ? 'Yes' : 'No' },
      { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
    ],
    searchFields: ['name', 'code'],
    formFields: [
      { key: 'name', label: 'Term Name', type: 'text', required: true },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'days', label: 'Credit Days', type: 'number', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'is_default', label: 'Is Default', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ]
  },

  // Purchase Masters
  {
    endpoint: 'vendor-types',
    title: 'Vendor Types',
    description: 'Classify vendors by type (Manufacturer, Distributor, Importer)',
    icon: <Truck className="w-8 h-8 text-purple-600" />,
    category: 'purchase',
    tableColumns: [
      { key: 'name', label: 'Vendor Type', sortable: true },
      { key: 'code', label: 'Code', sortable: true },
      { key: 'description', label: 'Description' },
      { key: 'is_manufacturer', label: 'Manufacturer', render: (value) => value ? 'Yes' : 'No' },
      { key: 'is_distributor', label: 'Distributor', render: (value) => value ? 'Yes' : 'No' },
      { key: 'is_importer', label: 'Importer', render: (value) => value ? 'Yes' : 'No' },
      { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
    ],
    searchFields: ['name', 'code'],
    formFields: [
      { key: 'name', label: 'Vendor Type Name', type: 'text', required: true },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'is_manufacturer', label: 'Is Manufacturer', type: 'boolean' },
      { key: 'is_distributor', label: 'Is Distributor', type: 'boolean' },
      { key: 'is_importer', label: 'Is Importer', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ]
  },

  // Customer Masters
  {
    endpoint: 'customer-groups',
    title: 'Customer Groups',
    description: 'Organize customers into groups for targeted marketing and pricing',
    icon: <Users className="w-8 h-8 text-indigo-600" />,
    category: 'customer',
    tableColumns: [
      { key: 'name', label: 'Group Name', sortable: true },
      { key: 'code', label: 'Code', sortable: true },
      { key: 'description', label: 'Description' },
      { key: 'discount_percentage', label: 'Discount %', render: (value) => value ? `${value}%` : 'N/A' },
      { key: 'credit_limit', label: 'Credit Limit', render: (value) => value ? `₹${value}` : 'No Limit' },
      { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
    ],
    searchFields: ['name', 'code'],
    formFields: [
      { key: 'name', label: 'Group Name', type: 'text', required: true },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'discount_percentage', label: 'Discount Percentage', type: 'number' },
      { key: 'credit_limit', label: 'Credit Limit', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ]
  },

  // HR Masters
  {
    endpoint: 'employees',
    title: 'Employees',
    description: 'Manage employee information and profiles',
    icon: <UserCheck className="w-8 h-8 text-emerald-600" />,
    category: 'hr',
    tableColumns: [
      { key: 'employee_code', label: 'Employee Code', sortable: true },
      { key: 'first_name', label: 'First Name', sortable: true },
      { key: 'last_name', label: 'Last Name', sortable: true },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'department_name', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
    ],
    searchFields: ['employee_code', 'first_name', 'last_name', 'email', 'phone'],
    formFields: [
      { key: 'employee_code', label: 'Employee Code', type: 'text', required: true },
      { key: 'first_name', label: 'First Name', type: 'text', required: true },
      { key: 'last_name', label: 'Last Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone', type: 'tel', required: true },
      { key: 'department_id', label: 'Department', type: 'select', required: true },
      { key: 'designation', label: 'Designation', type: 'text', required: true },
      { key: 'branch_id', label: 'Branch', type: 'select' },
      { key: 'date_of_joining', label: 'Date of Joining', type: 'date', required: true },
      { key: 'salary', label: 'Salary', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ]
  },

  // Finance Masters
  {
    endpoint: 'banks',
    title: 'Banks',
    description: 'Manage bank accounts and banking information',
    icon: <PiggyBank className="w-8 h-8 text-amber-600" />,
    category: 'finance',
    tableColumns: [
      { key: 'name', label: 'Bank Name', sortable: true },
      { key: 'code', label: 'Bank Code', sortable: true },
      { key: 'account_number', label: 'Account Number' },
      { key: 'ifsc_code', label: 'IFSC Code' },
      { key: 'branch_name', label: 'Branch Name' },
      { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
    ],
    searchFields: ['name', 'code', 'account_number'],
    formFields: [
      { key: 'name', label: 'Bank Name', type: 'text', required: true },
      { key: 'code', label: 'Bank Code', type: 'text', required: true },
      { key: 'account_number', label: 'Account Number', type: 'text', required: true },
      { key: 'ifsc_code', label: 'IFSC Code', type: 'text', required: true },
      { key: 'branch_name', label: 'Branch Name', type: 'text', required: true },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ]
  },

  // Marketing Masters
  {
    endpoint: 'campaign-types',
    title: 'Campaign Types',
    description: 'Define different types of marketing campaigns',
    icon: <TrendingUp className="w-8 h-8 text-pink-600" />,
    category: 'marketing',
    tableColumns: [
      { key: 'name', label: 'Campaign Type', sortable: true },
      { key: 'code', label: 'Code', sortable: true },
      { key: 'channel', label: 'Channel' },
      { key: 'description', label: 'Description' },
      { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
    ],
    searchFields: ['name', 'code', 'channel'],
    formFields: [
      { key: 'name', label: 'Campaign Type Name', type: 'text', required: true },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'channel', label: 'Channel', type: 'select', required: true,
        options: [
          { label: 'SMS', value: 'sms' },
          { label: 'Email', value: 'email' },
          { label: 'WhatsApp', value: 'whatsapp' },
          { label: 'Social Media', value: 'social' },
          { label: 'Push Notification', value: 'push' },
        ]
      },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ]
  },

  // AI Masters
  {
    endpoint: 'ai-agents',
    title: 'AI Agents',
    description: 'Configure AI agents for various business functions',
    icon: <Bot className="w-8 h-8 text-cyan-600" />,
    category: 'ai',
    tableColumns: [
      { key: 'name', label: 'Agent Name', sortable: true },
      { key: 'type', label: 'Type' },
      { key: 'description', label: 'Description' },
      { key: 'model_version', label: 'Model Version' },
      { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
    ],
    searchFields: ['name', 'type'],
    formFields: [
      { key: 'name', label: 'Agent Name', type: 'text', required: true },
      { key: 'type', label: 'Agent Type', type: 'select', required: true,
        options: [
          { label: 'Content Generator', value: 'content_generator' },
          { label: 'Inventory Optimizer', value: 'inventory_optimizer' },
          { label: 'Sales Forecaster', value: 'sales_forecaster' },
          { label: 'Customer Insights', value: 'customer_insights' },
        ]
      },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'model_version', label: 'Model Version', type: 'text', required: true },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ]
  },

  // Settings Masters
  {
    endpoint: 'system-settings',
    title: 'System Settings',
    description: 'Configure global system settings and preferences',
    icon: <Settings className="w-8 h-8 text-gray-600" />,
    category: 'settings',
    tableColumns: [
      { key: 'key', label: 'Setting Key', sortable: true },
      { key: 'value', label: 'Value' },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'is_system_setting', label: 'System Setting', render: (value) => value ? 'Yes' : 'No' },
    ],
    searchFields: ['key', 'category', 'description'],
    formFields: [
      { key: 'key', label: 'Setting Key', type: 'text', required: true },
      { key: 'value', label: 'Setting Value', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', required: true,
        options: [
          { label: 'General', value: 'general' },
          { label: 'Finance', value: 'finance' },
          { label: 'Inventory', value: 'inventory' },
          { label: 'Sales', value: 'sales' },
          { label: 'Purchases', value: 'purchases' },
          { label: 'HR', value: 'hr' },
          { label: 'Marketing', value: 'marketing' },
        ]
      },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'is_system_setting', label: 'Is System Setting', type: 'boolean' },
    ]
  },

  // Security Masters
  {
    endpoint: 'roles',
    title: 'Roles & Permissions',
    description: 'Define user roles and access permissions',
    icon: <Shield className="w-8 h-8 text-red-600" />,
    category: 'security',
    tableColumns: [
      { key: 'name', label: 'Role Name', sortable: true },
      { key: 'description', label: 'Description' },
      { key: 'is_system_role', label: 'System Role', render: (value) => value ? 'Yes' : 'No' },
      { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
    ],
    searchFields: ['name'],
    formFields: [
      { key: 'name', label: 'Role Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'permissions', label: 'Permissions', type: 'textarea', placeholder: 'JSON format permissions' },
      { key: 'is_system_role', label: 'Is System Role', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ]
  },

  // Continue with more master configurations...
]
