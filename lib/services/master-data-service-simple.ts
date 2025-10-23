// Simplified Master Data Service - No external dependencies
import { NextResponse } from 'next/server'

// Simple in-memory store (replace with database later)
const mockData: Record<string, any[]> = {
  branches: [],
  categories: [],
  brands: [],
  products: [],
  customers: [],
  vendors: [],
}

export const masterDataAPI = {
  async GET(request: Request, { params }: { params: { masterType: string } }) {
    const { masterType } = params
    const data = mockData[masterType] || []
    return NextResponse.json({ success: true, data, count: data.length })
  },

  async POST(request: Request, { params }: { params: { masterType: string } }) {
    try {
      const { masterType } = params
      const body = await request.json()
      
      if (!mockData[masterType]) {
        mockData[masterType] = []
      }
      
      const newItem = {
        id: String(mockData[masterType].length + 1),
        ...body,
        created_at: new Date().toISOString(),
      }
      
      mockData[masterType].push(newItem)
      
      return NextResponse.json({ 
        success: true, 
        data: newItem, 
        message: `${masterType} created successfully` 
      }, { status: 201 })
    } catch (error: any) {
      return NextResponse.json({ 
        success: false, 
        error: error?.message || 'Failed to create' 
      }, { status: 500 })
    }
  },

  async PUT(request: Request, { params }: { params: { masterType: string; id: string } }) {
    try {
      const { masterType, id } = params
      const body = await request.json()
      
      if (!mockData[masterType]) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
      }
      
      const index = mockData[masterType].findIndex((item: any) => item.id === id)
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
      }
      
      mockData[masterType][index] = {
        ...mockData[masterType][index],
        ...body,
        updated_at: new Date().toISOString(),
      }
      
      return NextResponse.json({ 
        success: true, 
        data: mockData[masterType][index],
        message: `${masterType} updated successfully` 
      })
    } catch (error: any) {
      return NextResponse.json({ 
        success: false, 
        error: error?.message || 'Failed to update' 
      }, { status: 500 })
    }
  },

  async DELETE(request: Request, { params }: { params: { masterType: string; id: string } }) {
    try {
      const { masterType, id } = params
      
      if (!mockData[masterType]) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
      }
      
      const index = mockData[masterType].findIndex((item: any) => item.id === id)
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
      }
      
      mockData[masterType].splice(index, 1)
      
      return NextResponse.json({ 
        success: true, 
        message: `${masterType} deleted successfully` 
      })
    } catch (error: any) {
      return NextResponse.json({ 
        success: false, 
        error: error?.message || 'Failed to delete' 
      }, { status: 500 })
    }
  },

  async POST_AI_SUGGESTIONS(request: Request) {
    return NextResponse.json({ 
      success: true, 
      suggestions: [],
      message: 'AI suggestions require OpenAI API key' 
    })
  }
}
