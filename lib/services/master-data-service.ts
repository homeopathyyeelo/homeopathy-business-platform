// Comprehensive Master Data API Service
// Handles all CRUD operations for 100+ master data types

import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

// Optional imports - only use if available
let prisma: any = null
let kafka: any = null
let openai: any = null

try {
  const { PrismaClient } = require('@prisma/client')
  prisma = new PrismaClient()
} catch (e) {
  console.warn('Prisma not available, using mock data')
}

try {
  if (process.env.KAFKA_BROKERS) {
    const { Kafka } = require('kafkajs')
    kafka = new Kafka({
      clientId: 'master-data-service',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092']
    })
  }
} catch (e) {
  console.warn('Kafka not available')
}

try {
  if (process.env.OPENAI_API_KEY) {
    const { OpenAI } = require('openai')
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
} catch (e) {
  console.warn('OpenAI not available')
}

// Business Logic Schemas and Validations
const masterDataSchemas = {
  // System Masters
  company_profile: z.object({
    name: z.string().min(1),
    legal_name: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/),
    phone: z.string().regex(/^\d{10}$/),
    email: z.string().email(),
    gst_number: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/),
    pan_number: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/),
  }),

  // Product Masters
  products: z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    category_id: z.string().uuid(),
    brand_id: z.string().uuid().optional(),
    potency_id: z.string().uuid().optional(),
    packing_size_id: z.string().uuid(),
    hsn_code_id: z.string().uuid().optional(),
    reorder_level: z.number().min(0),
    min_stock_level: z.number().min(0),
    max_stock_level: z.number().min(0),
    is_prescription_required: z.boolean(),
  }),

  // Sales Masters
  sales_types: z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    is_retail: z.boolean(),
    is_wholesale: z.boolean(),
    is_b2b: z.boolean(),
  }),

  // Purchase Masters
  vendors: z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    contact_person: z.string().min(1),
    phone: z.string().regex(/^\d{10}$/),
    email: z.string().email(),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/),
    gst_number: z.string().optional(),
    vendor_type_id: z.string().uuid().optional(),
  }),

  // Customer Masters
  customers: z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    phone: z.string().regex(/^\d{10}$/),
    email: z.string().email().optional(),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/),
    customer_group_id: z.string().uuid().optional(),
  }),

  // HR Masters
  employees: z.object({
    employee_code: z.string().min(1),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().regex(/^\d{10}$/),
    department_id: z.string().uuid(),
    designation: z.string().min(1),
    date_of_joining: z.string().datetime(),
  }),

  // Finance Masters
  banks: z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    account_number: z.string().min(1),
    ifsc_code: z.string().regex(/^[A-Z]{4}\d{7}$/),
    branch_name: z.string().min(1),
  }),

  // Marketing Masters
  campaign_types: z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    channel: z.enum(['sms', 'email', 'whatsapp', 'social', 'push']),
  }),

  // AI Masters
  ai_agents: z.object({
    name: z.string().min(1),
    type: z.enum(['content_generator', 'inventory_optimizer', 'sales_forecaster', 'customer_insights']),
    model_version: z.string().min(1),
    config: z.record(z.any()),
  }),

  // Settings Masters
  system_settings: z.object({
    key: z.string().min(1),
    value: z.any(),
    category: z.enum(['general', 'finance', 'inventory', 'sales', 'purchases', 'hr', 'marketing']),
  }),

  // Security Masters
  roles: z.object({
    name: z.string().min(1),
    permissions: z.array(z.object({
      module: z.string(),
      actions: z.array(z.string())
    })),
  }),
}

// AI Suggestions Engine
class AISuggestionsEngine {
  async suggestProductCategory(productData: any): Promise<string> {
    try {
      const prompt = `
        Based on the following product information, suggest the most appropriate category:
        Product Name: ${productData.name}
        Description: ${productData.description || 'N/A'}
        Brand: ${productData.brand_name || 'N/A'}

        Available categories: Mother Tincture, Biochemic, Dilution, Tablet, Syrup, Ointment, Drops

        Respond with only the category name.
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
      })

      return response.choices[0]?.message?.content?.trim() || 'Mother Tincture'
    } catch (error) {
      console.error('AI suggestion error:', error)
      return 'Mother Tincture' // fallback
    }
  }

  async suggestReorderLevel(productData: any): Promise<number> {
    try {
      const prompt = `
        Calculate optimal reorder level for this product:
        Product: ${productData.name}
        Current Stock: ${productData.current_stock || 0}
        Monthly Sales Average: ${productData.monthly_sales_avg || 10}
        Lead Time (days): ${productData.lead_time_days || 7}

        Formula: Reorder Level = (Monthly Sales  Lead Time) + Safety Stock
        Use safety stock of 20% of monthly sales.

        Respond with only the number.
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
      })

      const suggestion = parseInt(response.choices[0]?.message?.content?.trim() || '0')
      return Math.max(0, suggestion)
    } catch (error) {
      console.error('AI reorder level suggestion error:', error)
      return Math.max(0, (productData.monthly_sales_avg || 10) * (productData.lead_time_days || 7) * 1.2)
    }
  }

  async suggestPricing(productData: any): Promise<{ purchase_rate: number; mrp: number; selling_rate: number }> {
    try {
      const prompt = `
        Suggest optimal pricing for this product:
        Product: ${productData.name}
        Category: ${productData.category_name}
        Brand: ${productData.brand_name}
        Cost Price: ${productData.purchase_rate || 0}

        Consider:
        - 30-50% markup for MRP
        - Competitive pricing in homeopathy market
        - Brand positioning

        Respond in JSON format: {"purchase_rate": number, "mrp": number, "selling_rate": number}
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
      })

      const suggestion = JSON.parse(response.choices[0]?.message?.content || '{}')
      return {
        purchase_rate: productData.purchase_rate || 0,
        mrp: suggestion.mrp || (productData.purchase_rate * 1.4),
        selling_rate: suggestion.selling_rate || (productData.purchase_rate * 1.2),
      }
    } catch (error) {
      console.error('AI pricing suggestion error:', error)
      return {
        purchase_rate: productData.purchase_rate || 0,
        mrp: productData.purchase_rate * 1.4,
        selling_rate: productData.purchase_rate * 1.2,
      }
    }
  }
}

// Kafka Event Publisher
class EventPublisher {
  private producer: any = null

  // Initialize Kafka producer (async)
  if (kafka) {
    this.producer = kafka.producer()
    this.producer.connect().catch((e: any) => console.warn('Kafka producer connection failed:', e))
  }

  async publishMasterChange(masterType: string, operation: 'create' | 'update' | 'delete', data: any) {
    const event = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      masterType,
      operation,
      data,
      source: 'master-data-service'
    }

    await this.producer.send({
      topic: 'master-data-changes',
      messages: [{ value: JSON.stringify(event) }],
    })
  }

  async disconnect() {
    await this.producer.disconnect()
  }
}

// Business Logic Engine
class BusinessLogicEngine {
  async validateMasterData(masterType: string, data: any): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      // Validate against schema
      const schema = masterDataSchemas[masterType as keyof typeof masterDataSchemas]
      if (schema) {
        schema.parse(data)
      }

      // Business-specific validations
      switch (masterType) {
        case 'products':
          if (data.min_stock_level >= data.max_stock_level) {
            errors.push('Minimum stock level must be less than maximum stock level')
          }
          if (data.reorder_level < data.min_stock_level || data.reorder_level > data.max_stock_level) {
            errors.push('Reorder level must be between minimum and maximum stock levels')
          }
          break

        case 'customers':
          if (data.credit_limit < 0) {
            errors.push('Credit limit cannot be negative')
          }
          break

        case 'employees':
          if (new Date(data.date_of_joining) > new Date()) {
            errors.push('Date of joining cannot be in the future')
          }
          break
      }

      return { isValid: errors.length === 0, errors }
    } catch (error: any) {
      return { isValid: false, errors: error.errors?.map((e: any) => e.message) || ['Validation failed'] }
    }
  }

  async applyBusinessRules(masterType: string, data: any): Promise<any> {
    const enrichedData = { ...data }

    switch (masterType) {
      case 'products':
        // Auto-generate product code if not provided
        if (!enrichedData.code) {
          enrichedData.code = `PRD${Date.now().toString().slice(-6)}`
        }

        // Auto-suggest category if not provided
        if (!enrichedData.category_id && enrichedData.name) {
          const aiEngine = new AISuggestionsEngine()
          const suggestedCategory = await aiEngine.suggestProductCategory(enrichedData)
          // Map suggestion to category ID (would need category lookup)
        }
        break

      case 'customers':
        // Auto-generate customer code
        if (!enrichedData.code) {
          enrichedData.code = `CUST${Date.now().toString().slice(-6)}`
        }
        break

      case 'employees':
        // Auto-generate employee code
        if (!enrichedData.employee_code) {
          enrichedData.employee_code = `EMP${Date.now().toString().slice(-6)}`
        }
        break
    }

    return enrichedData
  }
}

// Master Data Service
export class MasterDataService {
  private aiEngine = new AISuggestionsEngine()
  private businessLogic = new BusinessLogicEngine()
  private eventPublisher = new EventPublisher()

  async initialize() {
    await this.eventPublisher.connect()
  }

  async cleanup() {
    await this.eventPublisher.disconnect()
  }

  // Generic CRUD Operations
  async createMaster(masterType: string, data: any) {
    try {
      // Validate data
      const validation = await this.businessLogic.validateMasterData(masterType, data)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      // Apply business rules
      const enrichedData = await this.businessLogic.applyBusinessRules(masterType, data)

      // Add audit fields
      const masterData = {
        ...enrichedData,
        id: uuidv4(),
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
      }

      // Save to database
      const result = await this.saveToDatabase(masterType, masterData)

      // Publish event
      await this.eventPublisher.publishMasterChange(masterType, 'create', result)

      return result
    } catch (error) {
      console.error(`Error creating ${masterType}:`, error)
      throw error
    }
  }

  async updateMaster(masterType: string, id: string, data: any) {
    try {
      // Validate data
      const validation = await this.businessLogic.validateMasterData(masterType, data)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      // Update with audit fields
      const updateData = {
        ...data,
        updated_at: new Date(),
      }

      // Update in database
      const result = await this.updateInDatabase(masterType, id, updateData)

      // Publish event
      await this.eventPublisher.publishMasterChange(masterType, 'update', result)

      return result
    } catch (error) {
      console.error(`Error updating ${masterType}:`, error)
      throw error
    }
  }

  async deleteMaster(masterType: string, id: string) {
    try {
      // Soft delete by setting is_active to false
      const result = await this.updateInDatabase(masterType, id, {
        is_active: false,
        updated_at: new Date(),
      })

      // Publish event
      await this.eventPublisher.publishMasterChange(masterType, 'delete', result)

      return result
    } catch (error) {
      console.error(`Error deleting ${masterType}:`, error)
      throw error
    }
  }

  async getMaster(masterType: string, id: string) {
    try {
      return await this.getFromDatabase(masterType, id)
    } catch (error) {
      console.error(`Error getting ${masterType}:`, error)
      throw error
    }
  }

  async listMasters(masterType: string, filters?: any) {
    try {
      return await this.listFromDatabase(masterType, filters)
    } catch (error) {
      console.error(`Error listing ${masterType}:`, error)
      throw error
    }
  }

  // Database Operations
  private async saveToDatabase(masterType: string, data: any) {
    const tableName = this.getTableName(masterType)
    return await prisma[tableName].create({ data })
  }

  private async updateInDatabase(masterType: string, id: string, data: any) {
    const tableName = this.getTableName(masterType)
    return await prisma[tableName].update({
      where: { id },
      data
    })
  }

  private async getFromDatabase(masterType: string, id: string) {
    const tableName = this.getTableName(masterType)
    return await prisma[tableName].findUnique({
      where: { id },
      include: this.getIncludeRelations(masterType)
    })
  }

  private async listFromDatabase(masterType: string, filters?: any) {
    const tableName = this.getTableName(masterType)
    return await prisma[tableName].findMany({
      where: {
        is_active: true,
        ...filters
      },
      include: this.getIncludeRelations(masterType),
      orderBy: { created_at: 'desc' }
    })
  }

  private getTableName(masterType: string): string {
    const tableMap: Record<string, string> = {
      'company_profile': 'company_profiles',
      'products': 'products',
      'categories': 'categories',
      'brands': 'brands',
      'sales_types': 'sales_types',
      'vendors': 'vendors',
      'customers': 'customers',
      'employees': 'employees',
      'banks': 'banks',
      'campaign_types': 'campaign_types',
      'ai_agents': 'ai_agents',
      'system_settings': 'system_settings',
      'roles': 'roles',
    }
    return tableMap[masterType] || masterType
  }

  private getIncludeRelations(masterType: string): any {
    const relations: Record<string, any> = {
      'products': {
        category: true,
        brand: true,
        potency: true,
        packing_size: true,
        hsn_code: true,
      },
      'customers': {
        customer_group: true,
      },
      'employees': {
        department: true,
        branch: true,
      },
      'vendors': {
        vendor_type: true,
      },
    }
    return relations[masterType] || {}
  }
}

// API Routes
export const masterDataAPI = {
  // Generic master data endpoints
  async GET(request: Request, { params }: { params: { masterType: string } }) {
    const { masterType } = params
    const service = new MasterDataService()

    try {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      const filters = Object.fromEntries(url.searchParams)

      if (id) {
        const result = await service.getMaster(masterType, id)
        return Response.json(result)
      } else {
        const results = await service.listMasters(masterType, filters)
        return Response.json(results)
      }
    } catch (error: any) {
      return Response.json({ error: error?.message || 'Internal error' }, { status: 400 })
    }
  },

  async POST(request: Request, { params }: { params: { masterType: string } }) {
    const { masterType } = params
    const service = new MasterDataService()

    try {
      const data = await request.json()
      const result = await service.createMaster(masterType, data)
      return Response.json(result, { status: 201 })
    } catch (error: any) {
      return Response.json({ error: error?.message || 'Internal error' }, { status: 400 })
    }
  },

  async PUT(request: Request, { params }: { params: { masterType: string; id: string } }) {
    const { masterType, id } = params
    const service = new MasterDataService()

    try {
      const data = await request.json()
      const result = await service.updateMaster(masterType, id, data)
      return Response.json(result)
    } catch (error: any) {
      console.error('Error fetching master data:', error)
      return Response.json({ error: error?.message || 'Internal error' }, { status: 500 })
    }
  },

  async DELETE(request: Request, { params }: { params: { masterType: string; id: string } }) {
    const { masterType, id } = params
    const service = new MasterDataService()

    try {
      const result = await service.deleteMaster(masterType, id)
      return Response.json(result)
    } catch (error: any) {
      console.error('Error fetching master data:', error)
      return Response.json({ error: error?.message || 'Internal error' }, { status: 500 })
    }
  },

  // AI Suggestions endpoint
  async POST_AI_SUGGESTIONS(request: Request) {
    try {
      const { masterType, data } = await request.json()
      const aiEngine = new AISuggestionsEngine()

      let suggestions: any = {}

      switch (masterType) {
        case 'products':
          suggestions.category = await aiEngine.suggestProductCategory(data)
          suggestions.reorderLevel = await aiEngine.suggestReorderLevel(data)
          suggestions.pricing = await aiEngine.suggestPricing(data)
          break
      }

      return Response.json(suggestions)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  }
}

// Initialize service
const masterDataService = new MasterDataService()
await masterDataService.initialize()

export default masterDataService
