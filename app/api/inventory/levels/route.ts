// Inventory Levels API Route
import { NextRequest, NextResponse } from 'next/server'
import { GET_INVENTORY_LEVELS, POST_INVENTORY_LEVELS } from '@/app/api/workflows/route'

export async function GET(request: NextRequest) {
  return GET_INVENTORY_LEVELS(request)
}

export async function POST(request: NextRequest) {
  return POST_INVENTORY_LEVELS(request)
}
