import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Prepare context for AI
    const cartSummary = context.cart?.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.unit_price,
      total: item.total,
      gstRate: item.tax_percent,
    })) || [];

    const systemPrompt = `You are an intelligent billing assistant for a homeopathy pharmacy ERP system. 
You help with:
- GST calculations and compliance
- Discount recommendations
- Pricing strategies
- Product alternatives
- E-Invoice/E-Way Bill requirements
- Margin analysis
- Customer credit checks

Provide concise, accurate, and actionable advice.`;

    const userPrompt = `${query}

Current Context:
- Cart Items: ${JSON.stringify(cartSummary, null, 2)}
- Customer: ${context.customer?.name || 'Walk-in'}
- Total Amount: ₹${context.total || 0}

Please provide specific, actionable advice for this billing scenario.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || 'No response from AI';

    return NextResponse.json({ success: true, response });

  } catch (error: any) {
    console.error('AI Billing Assistant Error:', error);
    
    return NextResponse.json(
      {
        error: 'AI Assistant Error',
        message: error.message || 'Failed to get AI response',
      },
      { status: 500 }
    );
  }
}
