/**
 * Utility functions for authenticated fetch requests
 * All API calls should use these to ensure proper authentication
 */

// Get authentication token (for non-HttpOnly cookies only)
export function getAuthToken(): string | null {
  // Note: HttpOnly cookies are automatically sent with credentials: 'include'
  // Only check localStorage for legacy tokens
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  
  return null;
}

// Create authenticated fetch headers
export function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Only add Authorization header if we have a localStorage token (legacy)
  // HttpOnly cookies are sent automatically via credentials: 'include'
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Authenticated fetch wrapper
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  });
  
  // Handle 401 errors
  if (response.status === 401) {
    // Clear auth and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Don't redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
    }
  }
  
  return response;
}

// Authenticated fetch with JSON parsing
export async function authFetchJSON<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await authFetch(url, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

// SWR fetcher with authentication
export const authSWRFetcher = async (url: string) => {
  const response = await authFetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  
  return response.json();
};
