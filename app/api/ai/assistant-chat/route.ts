/**
 * Unified AI Assistant Chat
 * POST /api/ai/assistant-chat
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { handleFunctionCall } from '@/lib/ai/assistants-setup';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store assistant IDs (these will be created via /api/ai/assistants/setup)
const ASSISTANTS = {
  billing: process.env.BILLING_ASSISTANT_ID || 'asst_default',
  inventory: process.env.INVENTORY_ASSISTANT_ID || 'asst_default',
  gst: process.env.GST_ASSISTANT_ID || 'asst_default',
  forecast: process.env.FORECAST_ASSISTANT_ID || 'asst_default',
  support: process.env.SUPPORT_ASSISTANT_ID || 'asst_default',
};

export async function POST(req: NextRequest) {
  try {
    const { 
      assistantType = 'billing', 
      message, 
      threadId,
      context = {} 
    } = await req.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get or create thread
    let thread;
    if (threadId) {
      thread = await openai.beta.threads.retrieve(threadId);
    } else {
      thread = await openai.beta.threads.create();
    }

    // Add context to message if provided
    let fullMessage = message;
    if (Object.keys(context).length > 0) {
      fullMessage = `Context: ${JSON.stringify(context)}\n\nQuery: ${message}`;
    }

    // Add user message
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: fullMessage,
    });

    // Use appropriate assistant
    const assistantId = ASSISTANTS[assistantType as keyof typeof ASSISTANTS] || 'gpt-4o-mini';

    // Run assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
        throw new Error(`Run ${runStatus.status}`);
      }

      // Handle function calls
      if (runStatus.status === 'requires_action') {
        const toolCalls = runStatus.required_action?.submit_tool_outputs?.tool_calls || [];
        
        const toolOutputs = toolCalls.map((toolCall: any) => {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          const output = handleFunctionCall(functionName, args);
          
          return {
            tool_call_id: toolCall.id,
            output: JSON.stringify(output),
          };
        });

        // Submit tool outputs
        await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
          tool_outputs: toolOutputs,
        });
      }

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Get messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];
    const response = lastMessage.content[0];

    return NextResponse.json({
      success: true,
      data: {
        response: response.type === 'text' ? response.text.value : '',
        threadId: thread.id,
        assistantType,
      },
    });

  } catch (error: any) {
    console.error('Assistant chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Assistant chat failed',
      },
      { status: 500 }
    );
  }
}
