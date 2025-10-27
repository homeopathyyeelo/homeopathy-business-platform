import useSWR from 'swr';
import apiClient from '@/lib/api-client';

// Types
export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  level: number;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  module: string;
  action: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface Menu {
  id: string;
  name: string;
  code: string;
  parent_id?: string;
  path: string;
  icon: string;
  sort_order: number;
  permission_code: string;
  is_active: boolean;
  created_at: string;
}

export interface MenuTree extends Menu {
  children?: MenuTree[];
}

// Fetcher function
const fetcher = (url: string) => apiClient.get(url).then(res => res.data);

// ============================================================================
// ROLES HOOKS
// ============================================================================

export function useRoles() {
  const { data, error, mutate } = useSWR<{ data: Role[] }>('/api/v1/rbac/roles', fetcher);

  return {
    roles: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useRole(id: string | null) {
  const { data, error, mutate } = useSWR<{ data: RoleWithPermissions }>(
    id ? `/api/v1/rbac/roles/${id}` : null,
    fetcher
  );

  return {
    role: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export async function createRole(data: {
  name: string;
  code: string;
  description?: string;
  level?: number;
}) {
  const response = await apiClient.post('/api/v1/rbac/roles', data);
  return response.data;
}

export async function updateRole(id: string, data: {
  name: string;
  description?: string;
  level?: number;
  is_active: boolean;
}) {
  const response = await apiClient.put(`/api/v1/rbac/roles/${id}`, data);
  return response.data;
}

export async function deleteRole(id: string) {
  const response = await apiClient.delete(`/api/v1/rbac/roles/${id}`);
  return response.data;
}

// ============================================================================
// PERMISSIONS HOOKS
// ============================================================================

export function usePermissions() {
  const { data, error, mutate } = useSWR<{ data: Permission[] }>('/api/v1/rbac/permissions', fetcher);

  return {
    permissions: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function usePermission(id: string | null) {
  const { data, error, mutate } = useSWR<{ data: Permission }>(
    id ? `/api/v1/rbac/permissions/${id}` : null,
    fetcher
  );

  return {
    permission: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export async function createPermission(data: {
  name: string;
  code: string;
  module: string;
  action: string;
  description?: string;
}) {
  const response = await apiClient.post('/api/v1/rbac/permissions', data);
  return response.data;
}

export async function updatePermission(id: string, data: {
  name: string;
  description?: string;
  is_active: boolean;
}) {
  const response = await apiClient.put(`/api/v1/rbac/permissions/${id}`, data);
  return response.data;
}

export async function deletePermission(id: string) {
  const response = await apiClient.delete(`/api/v1/rbac/permissions/${id}`);
  return response.data;
}

// ============================================================================
// ROLE PERMISSIONS HOOKS
// ============================================================================

export function useRolePermissions(roleId: string | null) {
  const { data, error, mutate } = useSWR<{ data: Permission[] }>(
    roleId ? `/api/v1/rbac/roles/${roleId}/permissions` : null,
    fetcher
  );

  return {
    permissions: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export async function assignPermissionsToRole(roleId: string, permissionIds: string[]) {
  const response = await apiClient.post(`/api/v1/rbac/roles/${roleId}/permissions`, {
    permission_ids: permissionIds,
  });
  return response.data;
}

export async function removePermissionFromRole(roleId: string, permissionId: string) {
  const response = await apiClient.delete(`/api/v1/rbac/roles/${roleId}/permissions/${permissionId}`);
  return response.data;
}

// ============================================================================
// USER ROLES HOOKS
// ============================================================================

export function useUserRoles(userId: string | null) {
  const { data, error, mutate } = useSWR<{ data: Role[] }>(
    userId ? `/api/v1/rbac/users/${userId}/roles` : null,
    fetcher
  );

  return {
    roles: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useUserPermissions(userId: string | null) {
  const { data, error, mutate } = useSWR<{ data: string[] }>(
    userId ? `/api/v1/rbac/users/${userId}/permissions` : null,
    fetcher
  );

  return {
    permissions: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export async function assignRoleToUser(userId: string, roleId: string, branchId?: string) {
  const response = await apiClient.post(`/api/v1/rbac/users/${userId}/roles`, {
    role_id: roleId,
    branch_id: branchId,
  });
  return response.data;
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  const response = await apiClient.delete(`/api/v1/rbac/users/${userId}/roles/${roleId}`);
  return response.data;
}

// ============================================================================
// MENUS HOOKS
// ============================================================================

export function useMenus() {
  const { data, error, mutate } = useSWR<{ data: Menu[] }>('/api/v1/rbac/menus', fetcher);

  return {
    menus: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useMenuTree() {
  const { data, error, mutate } = useSWR<{ data: MenuTree[] }>('/api/v1/rbac/menus/tree', fetcher);

  return {
    menuTree: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useUserMenus(userId: string | null) {
  const { data, error, mutate } = useSWR<{ data: MenuTree[] }>(
    userId ? `/api/v1/rbac/menus/user/${userId}` : null,
    fetcher
  );

  return {
    menuTree: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export async function createMenu(data: {
  name: string;
  code: string;
  parent_id?: string;
  path: string;
  icon?: string;
  sort_order?: number;
  permission_code?: string;
}) {
  const response = await apiClient.post('/api/v1/rbac/menus', data);
  return response.data;
}

export async function updateMenu(id: string, data: {
  name: string;
  parent_id?: string;
  path: string;
  icon?: string;
  sort_order?: number;
  permission_code?: string;
  is_active: boolean;
}) {
  const response = await apiClient.put(`/api/v1/rbac/menus/${id}`, data);
  return response.data;
}

export async function deleteMenu(id: string) {
  const response = await apiClient.delete(`/api/v1/rbac/menus/${id}`);
  return response.data;
}

// ============================================================================
// PERMISSION CHECKER HOOK
// ============================================================================

export function useHasPermission(permissionCode: string) {
  // Get current user ID from auth context
  // This is a placeholder - implement based on your auth system
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  
  const { permissions, isLoading } = useUserPermissions(userId);

  return {
    hasPermission: permissions.includes(permissionCode),
    isLoading,
  };
}

// ============================================================================
// GROUPED PERMISSIONS HELPER
// ============================================================================

export function groupPermissionsByModule(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
}
