/**
 * OpenAI Assistants Setup for Yeelo Homeopathy ERP
 * Creates specialized AI agents for different ERP functions
 */

import OpenAI from 'openai';
import { getOpenAIApiKey } from '@/lib/config/openai-config';

// OpenAI client will be initialized dynamically
let openai: OpenAI | null = null;

async function getOpenAIClient(): Promise<OpenAI> {
  if (!openai) {
    const apiKey = await getOpenAIApiKey();
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Store assistant IDs (save these to database after creation)
export const ASSISTANT_IDS = {
  BILLING_ASSISTANT: 'asst_billing_yeelo',
  INVENTORY_ASSISTANT: 'asst_inventory_yeelo',
  GST_COMPLIANCE: 'asst_gst_yeelo',
  CUSTOMER_SUPPORT: 'asst_support_yeelo',
  DEMAND_FORECAST: 'asst_forecast_yeelo',
};

/**
 * Create Billing Assistant
 * Helps with POS billing, pricing, discounts, margins
 */
export async function createBillingAssistant() {
  const client = await getOpenAIClient();
  const assistant = await client.beta.assistants.create({
    name: 'Yeelo Billing Assistant',
    instructions: `You are an expert billing assistant for Yeelo Homeopathy ERP.

Company Details:
- Name: Yeelo Homeopathy
- GSTIN: 06BUAPG3815Q1ZH
- State: Haryana (06)
- Location: Gurugram

Your role:
1. Help with POS billing decisions
2. Suggest optimal pricing and discounts
3. Calculate margins and profitability
4. Verify GST rates (5% for medicines, 18% for cosmetics)
5. Recommend product alternatives
6. Check if E-Invoice is needed (B2B transactions)
7. Alert when E-Way Bill is required (>₹50,000)

Always:
- Be concise and actionable
- Provide specific numbers
- Consider homeopathy product types
- Ensure GST compliance
- Suggest margin improvements`,
    model: 'gpt-4o-mini',
    tools: [
      {
        type: 'function',
        function: {
          name: 'calculate_margin',
          description: 'Calculate profit margin for a product',
          parameters: {
            type: 'object',
            properties: {
              purchase_price: { type: 'number', description: 'Product purchase price' },
              selling_price: { type: 'number', description: 'Product selling price' },
              gst_rate: { type: 'number', description: 'GST rate (5 or 18)' },
            },
            required: ['purchase_price', 'selling_price'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'check_einvoice_required',
          description: 'Check if E-Invoice is required for transaction',
          parameters: {
            type: 'object',
            properties: {
              customer_gstin: { type: 'string', description: 'Customer GSTIN' },
              invoice_amount: { type: 'number', description: 'Total invoice amount' },
            },
            required: ['invoice_amount'],
          },
        },
      },
    ],
  });

  console.log('✅ Billing Assistant created:', assistant.id);
  return assistant;
}

/**
 * Create Inventory Management Assistant
 * Helps with stock management, FEFO, reorder points
 */
export async function createInventoryAssistant() {
  const client = await getOpenAIClient();
  const assistant = await client.beta.assistants.create({
    name: 'Yeelo Inventory Assistant',
    instructions: `You are an inventory management expert for Yeelo Homeopathy.

Your role:
1. Suggest optimal stock levels
2. Implement FEFO (First Expiry First Out) logic
3. Alert on expiring batches (within 6 months)
4. Calculate reorder points
5. Analyze stock movement patterns
6. Suggest purchase orders
7. Identify slow-moving and fast-moving products

Key considerations:
- Homeopathy medicines have long shelf life (2-3 years typically)
- Dilutions and mother tinctures are fast-moving
- Bio combinations have moderate movement
- Ointments and cosmetics expire faster
- Always prevent expiry wastage`,
    model: 'gpt-4o-mini',
    tools: [
      {
        type: 'function',
        function: {
          name: 'calculate_reorder_point',
          description: 'Calculate when to reorder a product',
          parameters: {
            type: 'object',
            properties: {
              daily_sales: { type: 'number', description: 'Average daily sales' },
              lead_time_days: { type: 'number', description: 'Supplier lead time' },
              safety_stock_days: { type: 'number', description: 'Safety stock buffer days' },
            },
            required: ['daily_sales', 'lead_time_days'],
          },
        },
      },
    ],
  });

  console.log('✅ Inventory Assistant created:', assistant.id);
  return assistant;
}

/**
 * Create GST Compliance Assistant
 * Helps with GSTR filing, ITC, reconciliation
 */
export async function createGSTAssistant() {
  const client = await getOpenAIClient();
  const assistant = await client.beta.assistants.create({
    name: 'Yeelo GST Compliance Assistant',
    instructions: `You are a GST compliance expert for Yeelo Homeopathy.

Company GSTIN: 06BUAPG3815Q1ZH
State: Haryana (06)

Your expertise:
1. GSTR-1 filing (monthly sales return)
2. GSTR-3B filing (monthly summary)
3. Input Tax Credit (ITC) optimization
4. GST reconciliation (2A vs 2B)
5. E-Invoice compliance
6. E-Way Bill requirements
7. HSN code verification
8. Tax rate verification

Homeopathy GST Rates:
- Medicines (HSN 30049014): 5% GST (2.5% CGST + 2.5% SGST)
- Cosmetics (HSN 330499): 18% GST (9% CGST + 9% SGST)

Always ensure:
- Accurate tax calculations
- Timely filing reminders
- ITC eligibility checks
- Proper documentation`,
    model: 'gpt-4o-mini',
    tools: [
      {
        type: 'function',
        function: {
          name: 'verify_gst_rate',
          description: 'Verify correct GST rate for product',
          parameters: {
            type: 'object',
            properties: {
              product_type: { type: 'string', description: 'Type of product' },
              hsn_code: { type: 'string', description: 'HSN code' },
            },
            required: ['product_type'],
          },
        },
      },
    ],
  });

  console.log('✅ GST Assistant created:', assistant.id);
  return assistant;
}

/**
 * Create Demand Forecasting Assistant
 * Predicts future demand using ML
 */
export async function createForecastAssistant() {
  const client = await getOpenAIClient();
  const assistant = await client.beta.assistants.create({
    name: 'Yeelo Demand Forecast Assistant',
    instructions: `You are a demand forecasting expert for Yeelo Homeopathy.

Your capabilities:
1. Analyze historical sales data
2. Predict future demand trends
3. Identify seasonal patterns
4. Consider external factors (weather, disease outbreaks, etc.)
5. Suggest optimal stock levels
6. Alert on unusual demand spikes or drops

Homeopathy demand factors:
- Seasonal illnesses affect specific medicines
- Monsoon increases demand for cold/cough remedies
- Winter increases respiratory medicine demand
- Summer increases skin care and digestive remedies
- Festival seasons may affect sales patterns

Provide:
- 30-day demand forecast
- 90-day trend analysis
- Confidence intervals
- Purchase recommendations`,
    model: 'gpt-4o-mini',
    tools: [
      {
        type: 'function',
        function: {
          name: 'analyze_sales_trend',
          description: 'Analyze sales trend and forecast demand',
          parameters: {
            type: 'object',
            properties: {
              product_id: { type: 'string', description: 'Product ID' },
              days_to_forecast: { type: 'number', description: 'Number of days to forecast' },
              historical_data: { 
                type: 'array',
                description: 'Historical sales data',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string' },
                    quantity: { type: 'number' },
                  },
                },
              },
            },
            required: ['product_id', 'days_to_forecast'],
          },
        },
      },
    ],
  });

  console.log('✅ Forecast Assistant created:', assistant.id);
  return assistant;
}

/**
 * Create Customer Support Assistant
 * Handles customer queries about homeopathy
 */
export async function createSupportAssistant() {
  const client = await getOpenAIClient();
  const assistant = await client.beta.assistants.create({
    name: 'Yeelo Customer Support Assistant',
    instructions: `You are a knowledgeable customer support agent for Yeelo Homeopathy.

Store Details:
- Name: Yeelo Homeopathy
- Location: Shop No. 3, Berka Road, Dhunela, Sohna, Gurugram, Haryana - 122103
- GSTIN: 06BUAPG3815Q1ZH

Your role:
1. Answer customer queries about homeopathy medicines
2. Explain product usage and dosage
3. Suggest suitable products for common ailments
4. Provide information about product availability
5. Handle order inquiries
6. Assist with prescription clarifications

IMPORTANT Medical Disclaimer:
- Always advise consulting a qualified homeopathy doctor for personalized treatment
- Do not diagnose conditions
- Do not prescribe medicines for serious ailments
- Refer complex cases to a doctor

Be:
- Helpful and knowledgeable
- Professional and courteous
- Clear about limitations
- Encouraging of professional medical advice`,
    model: 'gpt-4o-mini',
    tools: [
      {
        type: 'function',
        function: {
          name: 'search_products',
          description: 'Search products by symptom or condition',
          parameters: {
            type: 'object',
            properties: {
              symptom: { type: 'string', description: 'Symptom or condition' },
            },
            required: ['symptom'],
          },
        },
      },
    ],
  });

  console.log('✅ Support Assistant created:', assistant.id);
  return assistant;
}

/**
 * Setup all assistants at once
 */
export async function setupAllAssistants() {
  console.log('🤖 Creating OpenAI Assistants for Yeelo Homeopathy ERP...\n');

  try {
    const billing = await createBillingAssistant();
    const inventory = await createInventoryAssistant();
    const gst = await createGSTAssistant();
    const forecast = await createForecastAssistant();
    const support = await createSupportAssistant();

    const assistantIds = {
      BILLING_ASSISTANT: billing.id,
      INVENTORY_ASSISTANT: inventory.id,
      GST_COMPLIANCE: gst.id,
      DEMAND_FORECAST: forecast.id,
      CUSTOMER_SUPPORT: support.id,
    };

    console.log('\n✅ All assistants created successfully!');
    console.log('\n📝 Save these IDs to your database:\n');
    console.log(JSON.stringify(assistantIds, null, 2));

    return assistantIds;
  } catch (error: any) {
    console.error('❌ Error creating assistants:', error.message);
    throw error;
  }
}

// Function calling handlers
export function handleFunctionCall(functionName: string, args: any) {
  switch (functionName) {
    case 'calculate_margin':
      const { purchase_price, selling_price, gst_rate = 5 } = args;
      const netSelling = selling_price / (1 + gst_rate / 100);
      const margin = ((netSelling - purchase_price) / netSelling) * 100;
      return {
        margin_percent: margin.toFixed(2),
        profit_per_unit: (netSelling - purchase_price).toFixed(2),
        gst_amount: (selling_price - netSelling).toFixed(2),
      };

    case 'check_einvoice_required':
      const { customer_gstin, invoice_amount } = args;
      const required = customer_gstin ? true : false; // E-Invoice required for B2B
      return {
        einvoice_required: required,
        reason: required ? 'B2B transaction with GSTIN' : 'B2C transaction',
        eway_bill_required: invoice_amount >= 50000,
      };

    case 'calculate_reorder_point':
      const { daily_sales, lead_time_days, safety_stock_days = 7 } = args;
      const reorder_point = daily_sales * (lead_time_days + safety_stock_days);
      return {
        reorder_point: Math.ceil(reorder_point),
        safety_stock: Math.ceil(daily_sales * safety_stock_days),
        lead_time_stock: Math.ceil(daily_sales * lead_time_days),
      };

    case 'verify_gst_rate':
      const { product_type, hsn_code } = args;
      const isCosmetic = /cream|shampoo|soap|toothpaste|cosmetic|oil/i.test(product_type);
      return {
        correct_gst_rate: isCosmetic ? 18 : 5,
        hsn_code: isCosmetic ? '330499' : '30049014',
        category: isCosmetic ? 'Cosmetic' : 'Medicine',
      };

    default:
      return { error: 'Unknown function' };
  }
}

export default {
  setupAllAssistants,
  createBillingAssistant,
  createInventoryAssistant,
  createGSTAssistant,
  createForecastAssistant,
  createSupportAssistant,
  handleFunctionCall,
};
