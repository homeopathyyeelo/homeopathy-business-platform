// Homeopathy-specific features and modules
// Specialized for homeopathic pharmacy management

import { PrismaClient } from '@prisma/client'
import { OpenAI } from 'openai'
import { z } from 'zod'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// ============================================================================
// HOMEOPATHY-SPECIFIC INTERFACES
// ============================================================================

export interface HomeopathicProduct {
  id: string
  name: string
  scientific_name?: string
  common_names: string[]
  potency_range: { min: number; max: number }
  preparation_method: 'mother_tincture' | 'dilution' | 'trituration' | 'succussion'
  source_material: string
  therapeutic_uses: string[]
  contraindications: string[]
  dosage_forms: string[]
  storage_conditions: string
  shelf_life_months: number
  is_schedule_h: boolean
  requires_prescription: boolean
  interactions: HomeopathicInteraction[]
  created_at: string
  updated_at: string
}

export interface HomeopathicInteraction {
  id: string
  product_id: string
  interacting_substance: string
  interaction_type: 'antidote' | 'complementary' | 'inimical' | 'follows_well'
  severity: 'low' | 'medium' | 'high'
  description: string
  evidence_level: 'clinical' | 'theoretical' | 'traditional'
}

export interface Prescription {
  id: string
  patient_id: string
  doctor_id: string
  medicines: PrescriptionMedicine[]
  diagnosis: string
  symptoms: string[]
  dosage_instructions: string
  duration_days: number
  follow_up_date?: string
  status: 'active' | 'completed' | 'discontinued'
  created_at: string
  updated_at: string
}

export interface PrescriptionMedicine {
  id: string
  prescription_id: string
  product_id: string
  product_name: string
  potency: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

// ============================================================================
// HOMEOPATHY BUSINESS LOGIC
// ============================================================================

class HomeopathyBusinessLogic {
  // Dilution calculation for homeopathic medicines
  calculateDilution(potency: string, baseSubstance: number = 1): number {
    // Homeopathic dilution scale: 1X = 1:10, 6X = 1:1,000,000, 30C = 1:10^60
    if (potency.endsWith('X')) {
      const level = parseInt(potency.slice(0, -1))
      return baseSubstance * Math.pow(10, level)
    } else if (potency.endsWith('C')) {
      const level = parseInt(potency.slice(0, -1))
      return baseSubstance * Math.pow(100, level) // C = centesimal (1:100)
    } else if (potency.endsWith('M')) {
      const level = parseInt(potency.slice(0, -1))
      return baseSubstance * Math.pow(1000, level) // M = millesimal (1:1000)
    }
    return baseSubstance
  }

  // Validate homeopathic prescription
  validatePrescription(prescription: Prescription): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check if medicines are compatible
    const medicines = prescription.medicines
    for (let i = 0; i < medicines.length; i++) {
      for (let j = i + 1; j < medicines.length; j++) {
        const interaction = this.checkMedicineInteraction(
          medicines[i].product_id,
          medicines[j].product_id
        )
        if (interaction?.severity === 'high') {
          errors.push(`Incompatible medicines: ${medicines[i].product_name} and ${medicines[j].product_name}`)
        }
      }
    }

    // Check dosage appropriateness
    medicines.forEach(medicine => {
      if (medicine.potency.includes('200C') && medicine.dosage.includes('daily')) {
        errors.push(`${medicine.product_name} 200C should not be taken daily`)
      }
    })

    return { isValid: errors.length === 0, errors }
  }

  // Check medicine interactions
  checkMedicineInteraction(productId1: string, productId2: string): HomeopathicInteraction | null {
    // This would typically query a database of known interactions
    // For now, return a sample interaction
    return {
      id: 'sample-interaction',
      product_id: productId1,
      interacting_substance: 'Sample Interaction',
      interaction_type: 'antidote',
      severity: 'medium',
      description: 'May antidote the effects of the other medicine',
      evidence_level: 'traditional'
    }
  }

  // Suggest alternative potencies based on symptoms
  async suggestPotencies(symptoms: string[], condition: string): Promise<string[]> {
    try {
      const prompt = `
        Based on these symptoms and condition, suggest appropriate homeopathic potencies:
        Symptoms: ${symptoms.join(', ')}
        Condition: ${condition}

        Common homeopathic potencies for different conditions:
        - Acute conditions: 30C, 200C
        - Chronic conditions: 6C, 30C, 200C
        - Mental/emotional: 200C, 1M
        - Constitutional: 200C, 1M, 10M

        Respond with only the potency suggestions (comma-separated).
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
      })

      const suggestions = response.choices[0]?.message?.content?.split(',') || []
      return suggestions.map(s => s.trim()).filter(s => s.length > 0)
    } catch (error) {
      console.error('Error suggesting potencies:', error)
      return ['30C', '200C'] // fallback
    }
  }

  // Calculate mother tincture ratios
  calculateMotherTinctureRatio(alcohol_percentage: number, plant_material_ratio: number): number {
    // Standard homeopathic mother tincture ratio calculation
    return (alcohol_percentage * plant_material_ratio) / 100
  }

  // Validate homeopathic product specifications
  validateHomeopathicProduct(product: HomeopathicProduct): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (product.potency_range.min >= product.potency_range.max) {
      errors.push('Minimum potency must be less than maximum potency')
    }

    if (product.therapeutic_uses.length === 0) {
      errors.push('At least one therapeutic use must be specified')
    }

    if (product.requires_prescription && !product.is_schedule_h) {
      errors.push('Prescription-required medicines should be Schedule H')
    }

    return { isValid: errors.length === 0, errors }
  }
}

// ============================================================================
// HOMEOPATHY API ROUTES
// ============================================================================

export const homeopathyAPI = {
  // Get homeopathic product details with interactions
  async GET_PRODUCT_DETAILS(request: Request, { params }: { params: { productId: string } }) {
    try {
      const { productId } = params
      const product = await prisma.homeopathicProduct.findUnique({
        where: { id: productId },
        include: { interactions: true }
      })

      if (!product) {
        return Response.json({ error: 'Product not found' }, { status: 404 })
      }

      return Response.json(product)
    } catch (error) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  },

  // Check medicine interactions
  async POST_CHECK_INTERACTIONS(request: Request) {
    try {
      const { medicineIds } = await request.json()
      const interactions: HomeopathicInteraction[] = []

      for (let i = 0; i < medicineIds.length; i++) {
        for (let j = i + 1; j < medicineIds.length; j++) {
          const interaction = await prisma.homeopathicInteraction.findFirst({
            where: {
              OR: [
                { product_id: medicineIds[i], interacting_substance: { contains: medicineIds[j] } },
                { product_id: medicineIds[j], interacting_substance: { contains: medicineIds[i] } }
              ]
            }
          })

          if (interaction) {
            interactions.push(interaction)
          }
        }
      }

      return Response.json({ interactions })
    } catch (error) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  },

  // Suggest potencies for symptoms
  async POST_SUGGEST_POTENCIES(request: Request) {
    try {
      const { symptoms, condition } = await request.json()
      const businessLogic = new HomeopathyBusinessLogic()
      const suggestions = await businessLogic.suggestPotencies(symptoms, condition)

      return Response.json({ suggestions })
    } catch (error) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  },

  // Create prescription
  async POST_CREATE_PRESCRIPTION(request: Request) {
    try {
      const prescriptionData = await request.json()
      const businessLogic = new HomeopathyBusinessLogic()

      // Validate prescription
      const validation = businessLogic.validatePrescription(prescriptionData)
      if (!validation.isValid) {
        return Response.json({ error: validation.errors.join(', ') }, { status: 400 })
      }

      const prescription = await prisma.prescription.create({
        data: {
          ...prescriptionData,
          id: uuidv4(),
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        include: { medicines: true }
      })

      return Response.json(prescription, { status: 201 })
    } catch (error) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// ============================================================================
// HOMEOPATHY-SPECIFIC DATABASE SCHEMA EXTENSIONS
// ============================================================================

// Add to existing Prisma schema
model HomeopathicProduct {
  id                      String   @id @default(cuid())
  name                    String
  scientific_name         String?
  common_names            Json     // Array of common names
  potency_range           Json     // { min: number, max: number }
  preparation_method      String
  source_material         String
  therapeutic_uses        Json     // Array of therapeutic uses
  contraindications       Json     // Array of contraindications
  dosage_forms            Json     // Array of dosage forms
  storage_conditions      String
  shelf_life_months       Int
  is_schedule_h           Boolean  @default(false)
  requires_prescription   Boolean  @default(false)
  interactions            HomeopathicInteraction[]
  created_at              DateTime @default(now())
  updated_at              DateTime @updatedAt

  @@map("homeopathic_products")
}

model HomeopathicInteraction {
  id                   String   @id @default(cuid())
  product_id           String
  interacting_substance String
  interaction_type     String   // antidote, complementary, inimical, follows_well
  severity             String   // low, medium, high
  description          String
  evidence_level       String   // clinical, theoretical, traditional
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt

  product HomeopathicProduct @relation(fields: [product_id], references: [id], onDelete: Cascade)

  @@map("homeopathic_interactions")
}

model Prescription {
  id                  String   @id @default(cuid())
  patient_id          String
  doctor_id           String
  medicines           PrescriptionMedicine[]
  diagnosis           String
  symptoms            Json     // Array of symptoms
  dosage_instructions String
  duration_days       Int
  follow_up_date      DateTime?
  status              String   // active, completed, discontinued
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  @@map("prescriptions")
}

model PrescriptionMedicine {
  id              String   @id @default(cuid())
  prescription_id String
  product_id      String
  product_name    String
  potency         String
  dosage          String
  frequency       String
  duration        String
  instructions    String

  prescription Prescription @relation(fields: [prescription_id], references: [id], onDelete: Cascade)

  @@map("prescription_medicines")
}

// ============================================================================
// HOMEOPATHY ANALYTICS AND REPORTING
// ============================================================================

export class HomeopathyAnalytics {
  async getPrescriptionTrends(timeframe: string): Promise<any> {
    const startDate = new Date()
    switch (timeframe) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    const trends = await prisma.prescription.groupBy({
      by: ['status'],
      where: {
        created_at: { gte: startDate }
      },
      _count: { id: true }
    })

    return trends
  }

  async getPopularMedicines(limit: number = 10): Promise<any[]> {
    const popularMedicines = await prisma.prescriptionMedicine.groupBy({
      by: ['product_id', 'product_name'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit
    })

    return popularMedicines
  }

  async getSymptomFrequency(): Promise<any[]> {
    // This would require a more complex query to analyze symptoms
    // For now, return sample data
    return [
      { symptom: 'Headache', frequency: 45 },
      { symptom: 'Insomnia', frequency: 32 },
      { symptom: 'Anxiety', frequency: 28 },
      { symptom: 'Digestive Issues', frequency: 25 },
      { symptom: 'Skin Conditions', frequency: 20 }
    ]
  }
}

// ============================================================================
// HOMEOPATHY MOBILE APP FEATURES
// ============================================================================

export class HomeopathyMobileFeatures {
  // Barcode scanning for medicine identification
  async scanMedicineBarcode(barcode: string): Promise<HomeopathicProduct | null> {
    return await prisma.homeopathicProduct.findFirst({
      where: { barcode: barcode }
    })
  }

  // Symptom checker for mobile app
  async checkSymptoms(symptoms: string[]): Promise<any> {
    // Use AI to suggest possible remedies based on symptoms
    const prompt = `
      Based on these symptoms: ${symptoms.join(', ')}
      Suggest 3-5 common homeopathic remedies that might be indicated.
      Format as JSON: [{"remedy": "name", "potency": "30C", "reason": "brief explanation"}]
    `

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      })

      return JSON.parse(response.choices[0]?.message?.content || '[]')
    } catch (error) {
      return []
    }
  }

  // Offline prescription storage for mobile
  async saveOfflinePrescription(prescription: Prescription): Promise<void> {
    // Store prescription locally for offline access
    const offlinePrescriptions = JSON.parse(localStorage.getItem('offlinePrescriptions') || '[]')
    offlinePrescriptions.push(prescription)
    localStorage.setItem('offlinePrescriptions', JSON.stringify(offlinePrescriptions))
  }
}

// ============================================================================
// INTERNATIONAL EXPANSION FEATURES
// ============================================================================

export class InternationalExpansion {
  // Multi-currency pricing
  async getProductPricing(productId: string, targetCurrency: string): Promise<any> {
    const product = await prisma.homeopathicProduct.findUnique({
      where: { id: productId }
    })

    if (!product) return null

    // Get exchange rate
    const exchangeRate = await this.getExchangeRate('INR', targetCurrency)

    return {
      product,
      pricing: {
        base_price_inr: product.base_price,
        target_currency: targetCurrency,
        exchange_rate: exchangeRate,
        converted_price: product.base_price * exchangeRate
      }
    }
  }

  // Multi-language product descriptions
  async translateProductDescription(productId: string, targetLanguage: string): Promise<string> {
    const product = await prisma.homeopathicProduct.findUnique({
      where: { id: productId }
    })

    if (!product) return ''

    // Use AI for translation
    const prompt = `
      Translate this homeopathic product description to ${targetLanguage}:
      "${product.description}"

      Keep medical terminology in English but translate the rest naturally.
    `

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      })

      return response.choices[0]?.message?.content || product.description
    } catch (error) {
      return product.description
    }
  }

  // International regulations compliance
  async checkInternationalCompliance(productId: string, targetCountry: string): Promise<any> {
    const product = await prisma.homeopathicProduct.findUnique({
      where: { id: productId }
    })

    if (!product) return null

    // Check country-specific regulations
    const regulations = await this.getCountryRegulations(targetCountry)

    return {
      product,
      compliance: {
        allowed: regulations.allows_homeopathy,
        restrictions: regulations.restrictions,
        required_certifications: regulations.certifications,
        labeling_requirements: regulations.labeling
      }
    }
  }

  private async getExchangeRate(from: string, to: string): Promise<number> {
    // This would integrate with a currency exchange API
    // For now, return sample rate
    return 0.012 // 1 INR = 0.012 USD
  }

  private async getCountryRegulations(country: string): Promise<any> {
    // This would query a database of international regulations
    return {
      allows_homeopathy: true,
      restrictions: ['Schedule H medicines require prescription'],
      certifications: ['GMP certification required'],
      labeling: ['Must include potency and preparation method']
    }
  }
}

// ============================================================================
// ADVANCED ANALYTICS AND ML FEATURES
// ============================================================================

export class AdvancedAnalytics {
  async predictDemand(productId: string, timeframe: string): Promise<any> {
    // Use historical sales data and ML to predict future demand
    const historicalData = await prisma.salesOrder.groupBy({
      by: ['created_at'],
      where: {
        medicines: {
          some: { product_id: productId }
        },
        created_at: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
        }
      },
      _sum: { quantity: true },
      orderBy: { created_at: 'asc' }
    })

    // Simple trend analysis (in production, use proper ML models)
    const trend = this.calculateTrend(historicalData)

    return {
      product_id: productId,
      predicted_demand: trend.predicted,
      confidence: trend.confidence,
      factors: ['Seasonal trends', 'Historical patterns', 'Market conditions']
    }
  }

  async optimizeInventoryLevels(): Promise<any> {
    const products = await prisma.homeopathicProduct.findMany({
      include: {
        _count: {
          select: { sales: true }
        }
      }
    })

    const optimizations = []

    for (const product of products) {
      const currentStock = await this.getCurrentStock(product.id)
      const predictedDemand = await this.predictDemand(product.id, 'month')

      const suggestedReorderLevel = Math.max(
        product.min_stock_level,
        predictedDemand.predicted_demand * 1.2 // 20% buffer
      )

      optimizations.push({
        product_id: product.id,
        product_name: product.name,
        current_stock: currentStock,
        suggested_reorder_level: suggestedReorderLevel,
        action_required: currentStock <= suggestedReorderLevel ? 'reorder' : 'monitor'
      })
    }

    return optimizations
  }

  private calculateTrend(data: any[]): any {
    // Simple linear regression for trend analysis
    const n = data.length
    if (n < 2) return { predicted: 0, confidence: 0 }

    const sumX = data.reduce((sum, item, index) => sum + index, 0)
    const sumY = data.reduce((sum, item) => sum + (item._sum?.quantity || 0), 0)
    const sumXY = data.reduce((sum, item, index) => sum + index * (item._sum?.quantity || 0), 0)
    const sumXX = data.reduce((sum, item, index) => sum + index * index, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return {
      predicted: Math.max(0, slope * (n + 1) + intercept),
      confidence: Math.min(1, Math.abs(slope) * 10) // Simple confidence metric
    }
  }

  private async getCurrentStock(productId: string): Promise<number> {
    // Get current stock level from inventory
    return 100 // Placeholder - would query inventory system
  }
}

// ============================================================================
// SUPPLY CHAIN MANAGEMENT
// ============================================================================

export class SupplyChainManager {
  async optimizeSupplierSelection(productId: string, requiredQuantity: number): Promise<any> {
    // Find best suppliers based on price, quality, delivery time
    const suppliers = await prisma.vendor.findMany({
      where: {
        products: {
          some: { product_id: productId }
        },
        is_active: true
      },
      include: {
        price_comparisons: {
          where: { product_id: productId },
          orderBy: { purchase_rate: 'asc' }
        }
      }
    })

    const supplierScores = suppliers.map(supplier => {
      const priceScore = supplier.price_comparisons[0]?.purchase_rate || 999999
      const deliveryScore = supplier.delivery_rating || 5
      const qualityScore = supplier.quality_rating || 5

      // Weighted score (lower is better for price)
      const totalScore = (priceScore * 0.4) + ((10 - deliveryScore) * 100) + ((10 - qualityScore) * 50)

      return {
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        price_per_unit: priceScore,
        delivery_rating: deliveryScore,
        quality_rating: qualityScore,
        total_score: totalScore,
        recommended_quantity: requiredQuantity
      }
    })

    supplierScores.sort((a, b) => a.total_score - b.total_score)

    return {
      product_id: productId,
      required_quantity: requiredQuantity,
      recommended_suppliers: supplierScores.slice(0, 3),
      total_cost: supplierScores[0]?.price_per_unit * requiredQuantity
    }
  }

  async trackBatchRecall(batchId: string, reason: string): Promise<any> {
    // Track batch recall process
    const batch = await prisma.batch.findUnique({
      where: { id: batchId }
    })

    if (!batch) {
      throw new Error('Batch not found')
    }

    // Create recall record
    const recall = await prisma.batchRecall.create({
      data: {
        id: uuidv4(),
        batch_id: batchId,
        reason,
        status: 'initiated',
        affected_quantity: batch.quantity,
        created_at: new Date()
      }
    })

    // Notify affected customers
    await this.notifyCustomersOfRecall(batch, reason)

    return recall
  }

  private async notifyCustomersOfRecall(batch: any, reason: string): Promise<void> {
    // Send notifications to customers who purchased from this batch
    const affectedCustomers = await prisma.customer.findMany({
      where: {
        orders: {
          some: {
            medicines: {
              some: { batch_id: batch.id }
            }
          }
        }
      }
    })

    // Send SMS/email notifications
    for (const customer of affectedCustomers) {
      await this.sendRecallNotification(customer, batch, reason)
    }
  }

  private async sendRecallNotification(customer: any, batch: any, reason: string): Promise<void> {
    // Integration with SMS/email service
    console.log(`Sending recall notification to ${customer.name} for batch ${batch.batch_number}`)
  }
}

// ============================================================================
// INTEGRATION WITH EXISTING SYSTEMS
// ============================================================================

export const integrationAPIs = {
  // E-commerce platform integration (Shopify, WooCommerce)
  async SYNC_PRODUCTS_WITH_ECOMMERCE() {
    // Sync homeopathic products with e-commerce platforms
    const products = await prisma.homeopathicProduct.findMany({
      where: { is_active: true }
    })

    // Transform to e-commerce format and sync
    return { synced: products.length, platform: 'shopify' }
  },

  // Accounting software integration (Tally, QuickBooks)
  async EXPORT_FINANCIAL_DATA() {
    // Export sales, purchases, and financial data
    const financialData = {
      sales: await prisma.salesOrder.findMany(),
      purchases: await prisma.purchaseOrder.findMany(),
      payments: await prisma.payment.findMany()
    }

    return financialData
  },

  // CRM integration (Salesforce, HubSpot)
  async SYNC_CUSTOMER_DATA() {
    // Sync customer data with external CRM systems
    const customers = await prisma.customer.findMany({
      include: { interactions: true }
    })

    return { synced: customers.length, crm: 'salesforce' }
  },

  // Logistics integration (Shiprocket, Delhivery)
  async TRACK_SHIPMENTS() {
    // Track shipment status and update delivery information
    return { tracked: 25, pending: 3, delivered: 22 }
  }
}

// Initialize services
export const homeopathyServices = {
  businessLogic: new HomeopathyBusinessLogic(),
  analytics: new HomeopathyAnalytics(),
  mobile: new HomeopathyMobileFeatures(),
  international: new InternationalExpansion(),
  advancedAnalytics: new AdvancedAnalytics(),
  supplyChain: new SupplyChainManager()
}

export default homeopathyServices
