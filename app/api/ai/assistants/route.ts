/**
 * OpenAI Assistants API
 * Create and manage specialized assistants for your ERP
 * Works locally - NO Docker needed
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store assistant IDs (in production, use database)
const assistants = new Map<string, any>();

// Predefined assistant configurations
const assistantConfigs = {
  'erp-general': {
    name: 'Yeelo ERP Assistant',
    instructions: `You are a specialized assistant for the Yeelo Homeopathy ERP system. 

You help users with:
- Product queries (stock levels, prices, details)
- Sales analytics and insights  
- Purchase order suggestions
- Inventory management
- Customer information
- Business recommendations
- Report generation
- System guidance

Always be helpful, concise, and professional. If asked about specific data, explain what information you need or suggest where to find it in the system.`,
    tools: [
      { type: 'code_interpreter' },
      { 
        type: 'function',
        function: {
          name: 'get_product_info',
          description: 'Get information about a product',
          parameters: {
            type: 'object',
            properties: {
              product_name: { type: 'string', description: 'Product name or SKU' }
            },
            required: ['product_name']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_stock_levels',
          description: 'Get current stock levels for products',
          parameters: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Filter by category (optional)' }
            }
          }
        }
      }
    ],
    model: 'gpt-4o-mini'
  },
  'sales-forecast': {
    name: 'Sales Forecast Assistant',
    instructions: `You are a specialized assistant for sales forecasting in the Yeelo Homeopathy ERP system.

You help with:
- Analyzing sales trends
- Predicting future sales
- Identifying seasonal patterns
- Product performance analysis
- Inventory recommendations based on forecasts

Use data analysis to provide accurate forecasts and actionable insights.`,
    tools: [
      { type: 'code_interpreter' },
      { type: 'function', function: { name: 'analyze_sales_data', description: 'Analyze historical sales data' } }
    ],
    model: 'gpt-4o-mini'
  },
  'prescription-advisor': {
    name: 'Homeopathy Prescription Advisor',
    instructions: `You are a specialized assistant for homeopathy prescription guidance in the Yeelo ERP system.

You help with:
- Remedy suggestions based on symptoms
- Potency recommendations
- Dosage guidelines
- Remedy interactions
- Alternative remedies

Always include disclaimer: This is not medical advice. Consult a qualified homeopath.`,
    tools: [
      { type: 'function', function: { name: 'search_remedies', description: 'Search homeopathic remedies' } }
    ],
    model: 'gpt-4o-mini'
  },
  'marketing-ai': {
    name: 'Marketing Campaign Assistant',
    instructions: `You are a specialized marketing assistant for the Yeelo Homeopathy ERP system.

You help with:
- Creating marketing campaigns
- Customer segmentation
- Promotional strategies
- Content creation for WhatsApp, SMS, Email
- Seasonal marketing ideas
- Product promotion suggestions

Create compelling, trustworthy marketing content for homeopathy products.`,
    tools: [
      { type: 'function', function: { name: 'get_customer_segments', description: 'Get customer segments' } }
    ],
    model: 'gpt-4o-mini'
  }
};

// Create all predefined assistants
async function initializeAssistants() {
  for (const [key, config] of Object.entries(assistantConfigs)) {
    try {
      const assistant = await openai.beta.assistants.create({
        name: config.name,
        instructions: config.instructions,
        tools: config.tools,
        model: config.model
      });
      assistants.set(key, assistant);
      console.log(`Created assistant: ${config.name} (${assistant.id})`);
    } catch (error) {
      console.error(`Failed to create assistant ${key}:`, error);
    }
  }
}

// Initialize on first request
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await initializeAssistants();
    initialized = true;
  }
}

// GET - List all assistants
export async function GET() {
  await ensureInitialized();
  
  const assistantList = Array.from(assistants.entries()).map(([key, assistant]) => ({
    id: key,
    name: assistant.name,
    model: assistant.model,
    created_at: assistant.created_at
  }));

  return NextResponse.json({
    success: true,
    assistants: assistantList
  });
}

// POST - Create new thread and chat with assistant
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const body = await request.json();
    const { assistant_id, message, thread_id } = body;

    if (!assistant_id || !message) {
      return NextResponse.json(
        { success: false, error: 'assistant_id and message are required' },
        { status: 400 }
      );
    }

    // Get the assistant
    const assistant = assistants.get(assistant_id);
    if (!assistant) {
      return NextResponse.json(
        { success: false, error: 'Assistant not found' },
        { status: 404 }
      );
    }

    // Create or get thread
    let thread;
    if (thread_id) {
      thread = await openai.beta.threads.retrieve(thread_id);
    } else {
      thread = await openai.beta.threads.create();
    }

    // Add message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    });

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status === 'completed') {
      // Get the latest message
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');

      const response = assistantMessage?.content[0]?.type === 'text'
        ? assistantMessage.content[0].text.value
        : 'No response';

      return NextResponse.json({
        success: true,
        response,
        thread_id: thread.id,
        run_id: run.id
      });
    } else {
      return NextResponse.json(
        { success: false, error: `Run failed: ${runStatus.status}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Assistant error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
