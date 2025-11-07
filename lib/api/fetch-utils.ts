/**
 * Utility functions for authenticated fetch requests
 * All API calls should use these to ensure proper authentication
 */

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Get authentication token
export function getAuthToken(): string | null {
  // Primary: Get from cookie (server-side set, HttpOnly)
  const cookieToken = getCookie('auth-token');
  if (cookieToken) return cookieToken;
  
  // Fallback: Get from localStorage (legacy)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  
  return null;
}

// Create authenticated fetch headers
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
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
