/**
 * AI Chat Assistant API (OpenAI)
 * Conversational AI for ERP queries
 * Works locally - NO Docker needed
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store conversation threads in memory (in production, use Redis or database)
const conversationThreads = new Map<string, any[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message,
      thread_id,
      context // optional: current page context, user data, etc.
    } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get or create conversation thread
    const threadKey = thread_id || `thread_${Date.now()}`;
    let messages = conversationThreads.get(threadKey) || [];

    // System message for ERP context
    if (messages.length === 0) {
      messages.push({
        role: 'system',
        content: `You are Yeelo AI Assistant, an intelligent helper for a Homeopathy ERP system.

You can help with:
- Product queries (stock levels, prices, details)
- Sales analytics and insights
- Purchase order suggestions
- Inventory management
- Customer information
- Business recommendations
- Report generation
- System guidance

Current context: ${JSON.stringify(context || {})}

Be helpful, concise, and professional. If asked about specific data, explain what information you need or suggest where to find it in the system.`
      });
    }

    // Add user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = response.choices[0].message.content;

    // Add assistant response to thread
    messages.push({
      role: 'assistant',
      content: assistantMessage
    });

    // Save thread (limit to last 20 messages)
    if (messages.length > 21) { // 1 system + 20 conversation messages
      messages = [messages[0], ...messages.slice(-20)];
    }
    conversationThreads.set(threadKey, messages);

    return NextResponse.json({
      success: true,
      response: assistantMessage,
      thread_id: threadKey,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens,
      }
    });

  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process chat' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve conversation history
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const thread_id = searchParams.get('thread_id');

  if (!thread_id) {
    return NextResponse.json(
      { success: false, error: 'thread_id is required' },
      { status: 400 }
    );
  }

  const messages = conversationThreads.get(thread_id) || [];

  return NextResponse.json({
    success: true,
    messages: messages.filter(m => m.role !== 'system'), // Don't expose system message
    total: messages.length - 1
  });
}
