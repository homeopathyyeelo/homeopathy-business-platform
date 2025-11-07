import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3005/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true, // Important for cookies/sessions
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from cookie (primary) or localStorage (fallback)
    const token = getCookie('auth-token') || 
                  (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
