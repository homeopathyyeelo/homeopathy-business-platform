import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';

// Types
export interface Company {
  id: string;
  name: string;
  code: string;
  legal_name?: string;
  pan?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  code: string;
  branch_type: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Fetcher function
const fetcher = (url: string) => apiClient.get(url).then(res => res.data);

// ============================================================================
// COMPANIES HOOKS
// ============================================================================

export function useCompanies() {
  const { data, error, mutate } = useSWR<{ data: Company[] }>('/api/v1/companies', fetcher);

  return {
    companies: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useCompany(id: string | null) {
  const { data, error, mutate } = useSWR<{ data: Company }>(
    id ? `/api/v1/companies/${id}` : null,
    fetcher
  );

  return {
    company: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export async function createCompany(data: {
  name: string;
  code: string;
  legal_name?: string;
  pan?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
}) {
  const response = await apiClient.post('/api/v1/companies', data);
  return response.data;
}

export async function updateCompany(id: string, data: Partial<Company>) {
  const response = await apiClient.put(`/api/v1/companies/${id}`, data);
  return response.data;
}

export async function deleteCompany(id: string) {
  const response = await apiClient.delete(`/api/v1/companies/${id}`);
  return response.data;
}

// ============================================================================
// BRANCHES HOOKS
// ============================================================================

export function useBranches(companyId?: string | null) {
  const url = companyId 
    ? `/api/v1/branches?company_id=${companyId}`
    : '/api/v1/branches';
    
  const { data, error, mutate } = useSWR<{ data: Branch[] }>(url, fetcher);

  return {
    branches: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useBranch(id: string | null) {
  const { data, error, mutate } = useSWR<{ data: Branch }>(
    id ? `/api/v1/branches/${id}` : null,
    fetcher
  );

  return {
    branch: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export async function createBranch(data: {
  company_id: string;
  name: string;
  code: string;
  branch_type?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  timezone?: string;
}) {
  const response = await apiClient.post('/api/v1/branches', data);
  return response.data;
}

export async function updateBranch(id: string, data: Partial<Branch>) {
  const response = await apiClient.put(`/api/v1/branches/${id}`, data);
  return response.data;
}

export async function deleteBranch(id: string) {
  const response = await apiClient.delete(`/api/v1/branches/${id}`);
  return response.data;
}

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

export function getSelectedCompany(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('selected_company_id');
}

export function setSelectedCompany(companyId: string | null) {
  if (typeof window === 'undefined') return;
  if (companyId) {
    localStorage.setItem('selected_company_id', companyId);
  } else {
    localStorage.removeItem('selected_company_id');
  }
}

export function getSelectedBranch(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('selected_branch_id');
}

export function setSelectedBranch(branchId: string | null) {
  if (typeof window === 'undefined') return;
  if (branchId) {
    localStorage.setItem('selected_branch_id', branchId);
  } else {
    localStorage.removeItem('selected_branch_id');
  }
}
