/**
 * OpenAI Assistants API Integration
 * Advanced AI capabilities for Yeelo Homeopathy ERP
 * 
 * Features:
 * - Multi-turn conversations with context
 * - Function calling for ERP operations
 * - Code interpreter for data analysis
 * - File search for documents
 * - Custom instructions for homeopathy domain
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

// Assistant IDs (create once, reuse)
let assistantIds = {
  erpAssistant: null as string | null,
  forecastAssistant: null as string | null,
  prescriptionAssistant: null as string | null,
  marketingAssistant: null as string | null,
};

/**
 * Create ERP General Assistant
 * Handles: Product queries, inventory checks, sales data, general ERP questions
 */
export async function createERPAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: "Yeelo ERP Assistant",
    instructions: `You are an expert ERP assistant for a Homeopathy retail and wholesale business.
    
Your capabilities:
- Answer questions about products, inventory, sales, purchases
- Provide business insights and analytics
- Help with ERP operations and workflows
- Understand homeopathic medicine nomenclature
- Generate reports and summaries

Business Context:
- Company: Yeelo Homeopathy (retail + wholesale)
- Products: Homeopathic medicines (dilutions, mother tinctures, biochemics, patents, creams)
- Brands: SBL, Schwabe, Bakson, Bjain, Dr. Reckeweg, etc.
- Operations: Multi-branch, multi-user, GST compliance

When users ask about:
- Products: Search by name, brand, potency, category, HSN code
- Inventory: Check stock levels, expiry dates, low stock alerts
- Sales: View orders, invoices, customer history, revenue analytics
- Purchases: PO status, vendor performance, price trends
- Finance: GST reports, profit margins, cashflow

Always provide accurate, concise, and actionable responses.`,
    model: "gpt-4o",
    tools: [
      { type: "code_interpreter" },
      { type: "file_search" },
      {
        type: "function",
        function: {
          name: "search_products",
          description: "Search for products in the inventory by name, SKU, brand, or category",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              filters: {
                type: "object",
                properties: {
                  brand: { type: "string" },
                  category: { type: "string" },
                  potency: { type: "string" },
                },
              },
            },
            required: ["query"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_stock_level",
          description: "Get current stock level and details for a product",
          parameters: {
            type: "object",
            properties: {
              product_id: { type: "string", description: "Product ID or SKU" },
            },
            required: ["product_id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_sales_analytics",
          description: "Get sales analytics for a date range",
          parameters: {
            type: "object",
            properties: {
              start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
              end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
              group_by: { type: "string", enum: ["day", "week", "month"] },
            },
            required: ["start_date", "end_date"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "generate_purchase_order",
          description: "Generate AI-powered purchase order based on low stock and demand forecast",
          parameters: {
            type: "object",
            properties: {
              vendor_id: { type: "string", description: "Vendor ID" },
              auto_suggest: { type: "boolean", description: "Auto-suggest quantities" },
            },
          },
        },
      },
    ],
  });

  assistantIds.erpAssistant = assistant.id;
  console.log('✅ ERP Assistant created:', assistant.id);
  return assistant;
}

/**
 * Create Demand Forecast Assistant
 * Handles: Sales forecasting, reorder predictions, seasonal trends
 */
export async function createForecastAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: "Yeelo Demand Forecast AI",
    instructions: `You are a demand forecasting expert for a homeopathy business.

Your role:
- Analyze historical sales data
- Predict future demand for products
- Identify seasonal trends
- Recommend reorder quantities
- Optimize inventory levels

Use code interpreter to:
- Load CSV/Excel sales data
- Calculate moving averages, trends
- Apply forecasting models (ARIMA, exponential smoothing)
- Generate visualizations
- Provide confidence intervals

Output format:
- Product name and SKU
- Predicted demand (next 7, 30, 90 days)
- Recommended reorder quantity
- Confidence level (%)
- Seasonal factors`,
    model: "gpt-4o",
    tools: [{ type: "code_interpreter" }],
  });

  assistantIds.forecastAssistant = assistant.id;
  console.log('✅ Forecast Assistant created:', assistant.id);
  return assistant;
}

/**
 * Create Prescription Assistant
 * Handles: Homeopathic remedy suggestions, patient case analysis
 */
export async function createPrescriptionAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: "Homeopathy Prescription AI",
    instructions: `You are a homeopathic materia medica expert and remedy suggestion assistant.

Your capabilities:
- Suggest remedies based on symptoms
- Explain remedy characteristics
- Compare similar remedies
- Recommend potencies
- Provide repertory references

Important disclaimers:
- Always state you're an AI assistant, not a licensed practitioner
- Recommend consulting a qualified homeopathic doctor
- Provide educational information only

Knowledge base:
- Boericke's Materia Medica
- Kent's Repertory
- Common remedies: Sulphur, Arsenicum, Lycopodium, Pulsatilla, Nux Vomica, etc.
- Potency guidelines: 30C for acute, 200C for chronic, 1M for constitutional

Output format:
1. Primary remedy suggestions (with rationale)
2. Potency recommendation
3. Dosage guidelines
4. Similar remedies to consider
5. Cautions/contraindications`,
    model: "gpt-4o",
    tools: [{ type: "file_search" }],
  });

  assistantIds.prescriptionAssistant = assistant.id;
  console.log('✅ Prescription Assistant created:', assistant.id);
  return assistant;
}

/**
 * Create Marketing Campaign Assistant
 * Handles: Campaign generation, content writing, social media posts
 */
export async function createMarketingAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: "Yeelo Marketing AI",
    instructions: `You are a marketing content creator for a homeopathy business.

Your expertise:
- WhatsApp/SMS campaign content
- Email marketing copy
- Social media posts (Instagram, Facebook)
- Festival/seasonal promotions
- Product descriptions
- Blog articles

Brand voice:
- Professional yet approachable
- Educational and trustworthy
- Focus on natural healing
- Highlight product benefits
- Include call-to-action

Campaign types:
- New product launches
- Seasonal offers (Diwali, New Year, monsoon)
- Health awareness (immunity, cold/flu season)
- Customer loyalty programs
- Doctor collaboration announcements

Output format:
- Campaign title
- Target audience
- Message variants (short/long)
- Visual suggestions
- Hashtags and keywords
- Timing recommendations`,
    model: "gpt-4o",
    tools: [{ type: "code_interpreter" }],
  });

  assistantIds.marketingAssistant = assistant.id;
  console.log('✅ Marketing Assistant created:', assistant.id);
  return assistant;
}

/**
 * Initialize all assistants
 */
export async function initializeAssistants() {
  console.log('🤖 Initializing OpenAI Assistants...');
  
  try {
    await Promise.all([
      createERPAssistant(),
      createForecastAssistant(),
      createPrescriptionAssistant(),
      createMarketingAssistant(),
    ]);
    
    console.log('✅ All assistants initialized successfully');
    console.log('Assistant IDs:', assistantIds);
    
    // Save IDs to environment or database
    return assistantIds;
  } catch (error) {
    console.error('❌ Failed to initialize assistants:', error);
    throw error;
  }
}

/**
 * Create a thread for conversation
 */
export async function createThread() {
  const thread = await openai.beta.threads.create();
  return thread.id;
}

/**
 * Send message to assistant and get response
 */
export async function chatWithAssistant(
  assistantType: 'erp' | 'forecast' | 'prescription' | 'marketing',
  threadId: string,
  message: string,
  functionHandlers?: Record<string, Function>
) {
  const assistantId = assistantIds[`${assistantType}Assistant`];
  
  if (!assistantId) {
    throw new Error(`Assistant not initialized: ${assistantType}`);
  }

  // Add message to thread
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });

  // Run the assistant
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });

  // Poll for completion
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
  
  while (runStatus.status !== 'completed') {
    if (runStatus.status === 'requires_action') {
      // Handle function calls
      const toolCalls = runStatus.required_action?.submit_tool_outputs?.tool_calls || [];
      const toolOutputs = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        if (functionHandlers && functionHandlers[functionName]) {
          const result = await functionHandlers[functionName](functionArgs);
          toolOutputs.push({
            tool_call_id: toolCall.id,
            output: JSON.stringify(result),
          });
        }
      }

      if (toolOutputs.length > 0) {
        await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
          tool_outputs: toolOutputs,
        });
      }
    }

    if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
      throw new Error(`Run ${runStatus.status}: ${runStatus.last_error?.message}`);
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
  }

  // Get messages
  const messages = await openai.beta.threads.messages.list(threadId);
  const lastMessage = messages.data[0];
  
  if (lastMessage.role === 'assistant') {
    const content = lastMessage.content[0];
    if (content.type === 'text') {
      return content.text.value;
    }
  }

  return null;
}

/**
 * Example: Use ERP Assistant
 */
export async function askERPAssistant(question: string) {
  const threadId = await createThread();
  
  const response = await chatWithAssistant('erp', threadId, question, {
    search_products: async (args: any) => {
      // Call your actual API
      const response = await fetch(`/api/erp/products?q=${args.query}`);
      return response.json();
    },
    get_stock_level: async (args: any) => {
      const response = await fetch(`/api/erp/inventory/stock/${args.product_id}`);
      return response.json();
    },
    get_sales_analytics: async (args: any) => {
      const response = await fetch(
        `/api/erp/reports/sales?start=${args.start_date}&end=${args.end_date}`
      );
      return response.json();
    },
  });

  return response;
}
