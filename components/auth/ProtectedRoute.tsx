"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, PermissionCode, hasPermission, hasAnyPermission, UserRole } from '@/lib/auth';
import { getCurrentUser } from '@/lib/api/auth-utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: PermissionCode;
  requiredPermissions?: PermissionCode[];
  requireAll?: boolean;
  requiredRole?: UserRole;
  fallbackUrl?: string;
}

/**
 * Protected Route Component
 * Wraps pages/components to require authentication and specific permissions
 */
export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
  requiredRole,
  fallbackUrl = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser();

      // Check if user is authenticated
      if (!user) {
        router.push(`${fallbackUrl}?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      // Check role if required
      if (requiredRole) {
        if (user.role !== requiredRole && !user.isSuperAdmin) {
          router.push('/unauthorized');
          return;
        }
      }

      // Check single permission if required
      if (requiredPermission) {
        if (!hasPermission(user, requiredPermission)) {
          router.push('/unauthorized');
          return;
        }
      }

      // Check multiple permissions if required
      if (requiredPermissions.length > 0) {
        const hasAccess = requireAll
          ? requiredPermissions.every(perm => hasPermission(user, perm))
          : hasAnyPermission(user, requiredPermissions);

        if (!hasAccess) {
          router.push('/unauthorized');
          return;
        }
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, requiredPermission, requiredPermissions, requireAll, requiredRole, fallbackUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Higher-order component to protect pages
 */
export function withProtectedRoute(
  Component: React.ComponentType<any>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
