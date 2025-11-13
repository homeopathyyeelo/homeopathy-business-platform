/**
 * Centralized Auth Token Refresh with BroadcastChannel
 * Ensures only ONE tab refreshes tokens at a time
 */

const AUTH_CHANNEL = 'yeelo-auth';
const bc = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel(AUTH_CHANNEL) 
  : null;

let refreshing = false;

async function getStoredToken(): Promise<string | null> {
  return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
}

async function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
  
  bc?.postMessage({ type: 'token-updated', token });
}

/**
 * Refresh token with cross-tab coordination
 * Only one tab executes refresh; others wait for broadcast
 */
export async function refreshTokenOnce(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  if (refreshing) {
    // Wait for broadcast from the tab doing the refresh
    return new Promise((resolve) => {
      const listener = (ev: MessageEvent) => {
        if (ev.data?.type === 'token-updated') {
          bc?.removeEventListener('message', listener);
          resolve(ev.data.token ?? null);
        }
      };
      bc?.addEventListener('message', listener);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        bc?.removeEventListener('message', listener);
        resolve(null);
      }, 5000);
    });
  }
  
  refreshing = true;
  
  try {
    const response = await fetch('http://localhost:3005/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      await setStoredToken(null);
      refreshing = false;
      return null;
    }
    
    const { token } = await response.json();
    await setStoredToken(token);
    refreshing = false;
    return token;
  } catch (err) {
    console.error('Token refresh failed:', err);
    refreshing = false;
    await setStoredToken(null);
    return null;
  }
}

/**
 * Enhanced fetch with automatic token refresh
 */
export async function authFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  let token = await getStoredToken();
  const headers = new Headers(init?.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  let response = await fetch(input, { ...init, headers, credentials: 'include' });
  
  // If 401, try refreshing token
  if (response.status === 401) {
    const newToken = await refreshTokenOnce();
    if (!newToken) {
      // Redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return response;
    }
    
    // Retry with new token
    headers.set('Authorization', `Bearer ${newToken}`);
    response = await fetch(input, { ...init, headers, credentials: 'include' });
  }
  
  return response;
}

// Listen for token updates from other tabs
if (bc) {
  bc.onmessage = (ev) => {
    if (ev.data?.type === 'token-updated') {
      // Token updated by another tab - could trigger UI refresh if needed
      console.log('🔄 Token updated from another tab');
    }
  };
}
