/**
 * OpenAI Agent Builder API
 * Create custom AI agents for your ERP workflows
 * Works locally - NO Docker needed
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Agent templates for different business functions
const agentTemplates = {
  'inventory-manager': {
    name: 'Inventory Management Agent',
    role: 'Inventory Specialist',
    goal: 'Optimize inventory levels, prevent stockouts, and manage reorder points',
    backstory: 'You are an experienced inventory manager specializing in homeopathy products. You understand seasonal demand patterns, expiry management, and optimal stock levels for different remedy categories.',
    tools: [
      'get_stock_levels',
      'get_expiry_alerts',
      'calculate_reorder_points',
      'analyze_consumption_patterns'
    ],
    model: 'gpt-4o-mini'
  },
  'customer-service': {
    name: 'Customer Service Agent',
    role: 'Customer Support Specialist',
    goal: 'Provide excellent customer service and resolve inquiries quickly',
    backstory: 'You are a friendly and knowledgeable customer service representative for a homeopathy business. You understand remedies, dosages, and can help customers with their orders and health questions.',
    tools: [
      'get_customer_orders',
      'search_products',
      'check_order_status',
      'provide_remedy_info'
    ],
    model: 'gpt-4o-mini'
  },
  'sales-analyst': {
    name: 'Sales Analysis Agent',
    role: 'Business Analyst',
    goal: 'Analyze sales data and provide actionable business insights',
    backstory: 'You are a data-driven business analyst specializing in homeopathy retail. You identify trends, forecast sales, and recommend strategies to increase revenue.',
    tools: [
      'analyze_sales_trends',
      'generate_sales_report',
      'identify_top_products',
      'forecast_demand'
    ],
    model: 'gpt-4o-mini'
  },
  'purchase-advisor': {
    name: 'Purchase Advisory Agent',
    role: 'Procurement Specialist',
    goal: 'Optimize purchasing decisions and supplier relationships',
    backstory: 'You are an expert in pharmaceutical procurement with deep knowledge of homeopathy suppliers, bulk purchasing strategies, and quality assurance.',
    tools: [
      'analyze_purchase_history',
      'recommend_suppliers',
      'calculate_optimal_quantities',
      'track_supplier_performance'
    ],
    model: 'gpt-4o-mini'
  },
  'quality-control': {
    name: 'Quality Control Agent',
    role: 'Quality Assurance Specialist',
    goal: 'Ensure product quality and compliance with regulations',
    backstory: 'You are a quality control expert for homeopathy products, ensuring all items meet regulatory standards and customer expectations.',
    tools: [
      'check_batch_quality',
      'track_expiry_dates',
      'monitor_compliance',
      'generate_quality_reports'
    ],
    model: 'gpt-4o-mini'
  }
};

// Store created agents (in production, use database)
const agents = new Map<string, any>();

// GET - List available agent templates and created agents
export async function GET() {
  const templates = Object.entries(agentTemplates).map(([key, template]) => ({
    id: key,
    name: template.name,
    role: template.role,
    goal: template.goal,
    model: template.model,
    tools: template.tools
  }));

  const createdAgents = Array.from(agents.entries()).map(([key, agent]) => ({
    id: key,
    name: agent.name,
    role: agent.role,
    status: agent.status,
    created_at: agent.created_at
  }));

  return NextResponse.json({
    success: true,
    templates,
    agents: createdAgents
  });
}

// POST - Create or interact with an agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agent_type, custom_config, message, agent_id } = body;

    if (action === 'create') {
      // Create a new agent
      const config = agent_type ? agentTemplates[agent_type as keyof typeof agentTemplates] : custom_config;
      
      if (!config) {
        return NextResponse.json(
          { success: false, error: 'Invalid agent type or configuration' },
          { status: 400 }
        );
      }

      const agent = {
        id: agent_type || `custom_${Date.now()}`,
        ...config,
        status: 'active',
        created_at: new Date().toISOString(),
        instructions: `You are ${config.role}. ${config.goal}. ${config.backstory}

Available tools: ${config.tools.join(', ')}

Always be helpful, professional, and provide actionable insights.`
      };

      agents.set(agent.id, agent);

      return NextResponse.json({
        success: true,
        agent,
        message: `Agent "${agent.name}" created successfully`
      });
    }

    if (action === 'chat') {
      // Chat with an existing agent
      if (!agent_id || !message) {
        return NextResponse.json(
          { success: false, error: 'agent_id and message are required' },
          { status: 400 }
        );
      }

      const agent = agents.get(agent_id);
      if (!agent) {
        return NextResponse.json(
          { success: false, error: 'Agent not found' },
          { status: 404 }
        );
      }

      // Create a temporary assistant for this interaction
      const assistant = await openai.beta.assistants.create({
        name: agent.name,
        instructions: agent.instructions,
        model: agent.model,
        tools: [{ type: 'code_interpreter' }]
      });

      // Create thread and run
      const thread = await openai.beta.threads.create();
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: message
      });

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
        const messages = await openai.beta.threads.messages.list(thread.id);
        const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
        const response = assistantMessage?.content[0]?.type === 'text' 
          ? assistantMessage.content[0].text.value 
          : 'Unable to process response';

        // Clean up the temporary assistant
        await openai.beta.assistants.del(assistant.id);

        return NextResponse.json({
          success: true,
          response,
          agent_name: agent.name,
          thread_id: thread.id
        });
      } else {
        return NextResponse.json(
          { success: false, error: `Agent run failed: ${runStatus.status}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an agent
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agent_id = searchParams.get('agent_id');

    if (!agent_id) {
      return NextResponse.json(
        { success: false, error: 'agent_id is required' },
        { status: 400 }
      );
    }

    const deleted = agents.delete(agent_id);
    
    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Agent deleted successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
