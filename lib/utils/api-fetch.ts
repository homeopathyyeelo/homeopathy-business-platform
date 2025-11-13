/**
 * Universal API fetch wrapper that routes requests to correct backend
 * Replaces native fetch() calls to ensure proper port routing
 */

const API_ROUTES = {
  // Golang backend (port 3005)
  golang: [
    '/api/auth/',
    '/api/erp/',
    '/api/v1/',
  ],
  // NestJS backend (port 3001)
  nestjs: [
    '/api/nest/',
  ],
  // Fastify backend (port 3002)
  fastify: [
    '/api/fast/',
    '/api/campaigns/',
    '/api/templates/',
    '/api/coupons/',
  ],
  // Express backend (port 3003)
  express: [
    '/api/express/',
  ],
  // Python AI backend (port 8001)
  python: [
    '/api/ai/',
    '/api/ml/',
  ],
};

const BACKEND_PORTS = {
  golang: process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005',
  nestjs: process.env.NEXT_PUBLIC_NESTJS_API_URL || 'http://localhost:3001',
  fastify: process.env.NEXT_PUBLIC_FASTIFY_API_URL || 'http://localhost:3002',
  express: process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:3003',
  python: process.env.NEXT_PUBLIC_PYTHON_AI_URL || 'http://localhost:8001',
};

/**
 * Determines which backend to route the request to based on URL pattern
 */
function getBackendUrl(path: string): string {
  // Check each backend's route patterns
  for (const [backend, patterns] of Object.entries(API_ROUTES)) {
    if (patterns.some(pattern => path.startsWith(pattern))) {
      return BACKEND_PORTS[backend as keyof typeof BACKEND_PORTS];
    }
  }
  
  // Default to Golang backend for /api/ routes
  if (path.startsWith('/api/')) {
    return BACKEND_PORTS.golang;
  }
  
  // For non-API routes, keep as relative (Next.js API routes)
  return '';
}

/**
 * Enhanced fetch that automatically routes to correct backend
 * Drop-in replacement for native fetch()
 */
export async function apiFetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  let url: string;
  let requestInit = init || {};

  // Handle different input types
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else {
    url = input.url;
    // Merge request init if input is Request object
    requestInit = { ...input, ...init };
  }

  // Only process relative URLs starting with /api/
  if (url.startsWith('/api/')) {
    const backendBaseUrl = getBackendUrl(url);
    if (backendBaseUrl) {
      url = backendBaseUrl + url;
    }
  }

  // Add authentication token from localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      requestInit.headers = {
        ...requestInit.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  // Add Content-Type if not set and body exists
  if (requestInit.body && !requestInit.headers?.hasOwnProperty('Content-Type')) {
    requestInit.headers = {
      ...requestInit.headers,
      'Content-Type': 'application/json',
    };
  }

  return fetch(url, requestInit);
}

/**
 * Convenience methods for common HTTP verbs
 */
export const apiClient = {
  get: (url: string, options?: RequestInit) => 
    apiFetch(url, { ...options, method: 'GET' }),
  
  post: (url: string, data?: any, options?: RequestInit) => 
    apiFetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  put: (url: string, data?: any, options?: RequestInit) => 
    apiFetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  patch: (url: string, data?: any, options?: RequestInit) => 
    apiFetch(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: (url: string, options?: RequestInit) => 
    apiFetch(url, { ...options, method: 'DELETE' }),
};

export default apiFetch;
