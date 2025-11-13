"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, UserRole } from '@/lib/auth'
import { apiFetch } from '@/lib/utils/api-fetch'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await apiFetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        return true
      } else {
        const error = await response.json()
        console.error('Login failed:', error.error)
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false
    
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.SUPER_ADMIN]: 10,
      [UserRole.ADMIN]: 7,
      [UserRole.MANAGER]: 6,
      [UserRole.DOCTOR]: 5,
      [UserRole.PHARMACIST]: 4,
      [UserRole.MARKETER]: 3,
      [UserRole.STAFF]: 2,
      [UserRole.CASHIER]: 1,
      [UserRole.CUSTOMER]: 0
    }
    
    return (roleHierarchy[user.role] || 0) >= (roleHierarchy[role] || 0)
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role))
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    hasRole,
    hasAnyRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for role-based access control
export function withRole<T extends object>(
  Component: React.ComponentType<T>,
  requiredRole: UserRole
) {
  return function RoleProtectedComponent(props: T) {
    const { user, hasRole } = useAuth()
    
    if (!user || !hasRole(requiredRole)) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}

// Component for conditional rendering based on roles
interface RoleGuardProps {
  children: ReactNode
  requiredRole?: UserRole
  requiredRoles?: UserRole[]
  fallback?: ReactNode
}

export function RoleGuard({ 
  children, 
  requiredRole, 
  requiredRoles, 
  fallback = null 
}: RoleGuardProps) {
  const { user, hasRole, hasAnyRole } = useAuth()
  
  if (!user) return <>{fallback}</>
  
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>
  }
  
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}
