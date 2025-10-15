import { NextRequest, NextResponse } from 'next/server'
import { masterDataAPI } from '@/lib/services/master-data-service'

// Generic master data API route
export async function GET(
  request: NextRequest,
  { params }: { params: { masterType: string } }
) {
  try {
    return await masterDataAPI.GET(request, { params })
  } catch (error) {
    console.error(`GET /api/masters/${params.masterType}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { masterType: string } }
) {
  try {
    return await masterDataAPI.POST(request, { params })
  } catch (error) {
    console.error(`POST /api/masters/${params.masterType}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { masterType: string; id: string } }
) {
  try {
    return await masterDataAPI.PUT(request, { params })
  } catch (error) {
    console.error(`PUT /api/masters/${params.masterType}/${params.id}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { masterType: string; id: string } }
) {
  try {
    return await masterDataAPI.DELETE(request, { params })
  } catch (error) {
    console.error(`DELETE /api/masters/${params.masterType}/${params.id}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
