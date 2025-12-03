import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// API Proxy: Forward all /api/erp/* requests to Go backend at localhost:3005
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return forwardToBackend(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return forwardToBackend(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return forwardToBackend(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return forwardToBackend(request, params.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return forwardToBackend(request, params.path, 'PATCH');
}

async function forwardToBackend(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Reconstruct the path
    const path = pathSegments.join('/');
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    
    // Build backend URL
    const backendUrl = `http://localhost:3005/api/erp/${path}${queryString}`;
    
    // Get auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization if token exists
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
    };
    
    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await request.text();
        if (body) {
          options.body = body;
        }
      } catch (error) {
        // Body might be empty, that's okay
      }
    }
    
    // Forward request to Go backend
    const response = await fetch(backendUrl, options);
    
    // Get response data
    const data = await response.text();
    
    // Return response with same status
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to forward request to backend' 
      },
      { status: 500 }
    );
  }
}
