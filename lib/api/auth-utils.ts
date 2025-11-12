import { User, hasPermission, PermissionCode } from '@/lib/auth';

/**
 * API utility to check user permissions
 */
export function checkPermission(user: User | null, permission: PermissionCode): boolean {
  if (!user) return false;
  return hasPermission(user, permission);
}

/**
 * Get user from localStorage (client-side only)
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

/**
 * Clear user from localStorage
 */
export function clearCurrentUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
  localStorage.removeItem('auth_token');
}

/**
 * Set user in localStorage
 */
export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const user = getCurrentUser();
  const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='));
  
  return !!(user && token);
}
