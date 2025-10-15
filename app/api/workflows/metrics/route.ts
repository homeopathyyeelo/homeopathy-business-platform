// Workflow Metrics API Route
import { NextRequest, NextResponse } from 'next/server'
import { GET_METRICS } from '@/app/api/workflows/route'

export async function GET(request: NextRequest) {
  return GET_METRICS(request)
}
