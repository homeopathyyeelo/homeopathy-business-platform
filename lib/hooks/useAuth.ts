'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, User, LoginCredentials } from '@/lib/api/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = authApi.getCurrentUser();
      if (currentUser) {
        // Use cached user data instead of making API call
        // This prevents infinite reload loops
        setUser(currentUser);
      }
    } catch (error) {
      // Token invalid or expired
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local data and redirect
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Clear any session cookies if they exist
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      router.push('/login');
    }
  };

  const hasPermission = (permission: string): boolean => {
    return authApi.hasPermission(user, permission);
  };

  const hasRole = (role: string): boolean => {
    return authApi.hasRole(user, role);
  };

  return {
    user,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    isAuthenticated: \!\!user,
  };
}
