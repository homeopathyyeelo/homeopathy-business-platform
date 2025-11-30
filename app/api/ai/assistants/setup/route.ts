/**
 * Setup OpenAI Assistants for ERP
 * POST /api/ai/assistants/setup
 */

import { NextRequest, NextResponse } from 'next/server';
import { setupAllAssistants } from '@/lib/ai/assistants-setup';

export async function POST(req: NextRequest) {
  try {
    const assistantIds = await setupAllAssistants();

    return NextResponse.json({
      success: true,
      message: 'All AI assistants created successfully',
      data: assistantIds,
    });
  } catch (error: any) {
    console.error('Assistant setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to setup assistants',
      },
      { status: 500 }
    );
  }
}
