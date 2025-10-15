// Financial Metrics API Route
import { NextRequest, NextResponse } from 'next/server'
import { GET_FINANCIAL_METRICS, POST_FINANCIAL_METRICS } from '@/app/api/workflows/route'

export async function GET(request: NextRequest) {
  return GET_FINANCIAL_METRICS(request)
}

export async function POST(request: NextRequest) {
  return POST_FINANCIAL_METRICS(request)
}
