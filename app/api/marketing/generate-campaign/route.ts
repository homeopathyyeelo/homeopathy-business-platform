/**
 * AI Campaign Generator API (OpenAI)
 * Generates marketing campaign content using your OpenAI API key
 * Works locally - NO Docker needed
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      campaign_type, // whatsapp, sms, email
      target_audience, // wholesale dealers, retail customers, doctors
      products, // array of product names
      occasion, // festival, new product launch, seasonal
      tone // professional, friendly, urgent
    } = body;

    if (!campaign_type || !target_audience) {
      return NextResponse.json(
        { success: false, error: 'campaign_type and target_audience are required' },
        { status: 400 }
      );
    }

    // Create AI prompt based on inputs
    const prompt = `You are a marketing expert for a homeopathy business. Generate a ${campaign_type} campaign.

Target Audience: ${target_audience}
${products?.length ? `Products: ${products.join(', ')}` : ''}
${occasion ? `Occasion: ${occasion}` : ''}
Tone: ${tone || 'professional'}

Generate the following:
1. Campaign Title (catchy and relevant)
2. ${campaign_type === 'email' ? 'Subject Line' : 'Message'}
3. ${campaign_type === 'email' ? 'Email Body (keep it concise, max 150 words)' : 'Message Body (max 160 characters for SMS, max 300 characters for WhatsApp)'}
${campaign_type !== 'sms' ? '4. Call-to-Action (clear and actionable)' : ''}
5. Best Time to Send (suggest optimal time)

Make it compelling, trustworthy, and action-oriented for homeopathy products.
Format the response as JSON with keys: title, ${campaign_type === 'email' ? 'subject' : 'message'}, body, cta, best_time`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing copywriter for homeopathy and natural health products. You create compelling, trustworthy, and compliant marketing content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 800,
    });

    const generatedContent = JSON.parse(response.choices[0].message.content || '{}');

    return NextResponse.json({
      success: true,
      campaign: generatedContent,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens,
      }
    });

  } catch (error: any) {
    console.error('Campaign generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate campaign' 
      },
      { status: 500 }
    );
  }
}
