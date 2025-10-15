// Customer Service Metrics API Route
import { NextRequest, NextResponse } from 'next/server'
import { GET_CUSTOMER_SERVICE_METRICS, POST_CUSTOMER_SERVICE_METRICS } from '@/app/api/workflows/route'

export async function GET(request: NextRequest) {
  return GET_CUSTOMER_SERVICE_METRICS(request)
}

export async function POST(request: NextRequest) {
  return POST_CUSTOMER_SERVICE_METRICS(request)
}
