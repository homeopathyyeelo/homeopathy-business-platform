import { NextRequest, NextResponse } from 'next/server'
import { masterDataAPI } from '@/lib/services/master-data-service'

export async function POST(request: NextRequest) {
  try {
    return await masterDataAPI.POST_AI_SUGGESTIONS(request)
  } catch (error) {
    console.error('POST /api/masters/ai-suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
