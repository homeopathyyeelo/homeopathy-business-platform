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
        // Verify token is still valid
        const userData = await authApi.me();
        setUser(userData);
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
    await authApi.logout();
    setUser(null);
    router.push('/login');
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
