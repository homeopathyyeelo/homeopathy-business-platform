// HR SWR Hooks
import useSWR from 'swr';
import { hrService } from '../services/hr.service';

export function useEmployees(params?: {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  branchId?: string;
  isActive?: boolean;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/hr/employees`, params],
    () => hrService.getEmployees(params)
  );

  return {
    employees: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useEmployee(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/hr/employees/${id}` : null,
    () => hrService.getEmployee(id)
  );

  return {
    employee: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAttendance(params?: {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/hr/attendance`, params],
    () => hrService.getAttendance(params)
  );

  return {
    attendance: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useLeaves(params?: {
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/hr/leaves`, params],
    () => hrService.getLeaves(params)
  );

  return {
    leaves: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function usePayroll(params?: {
  employeeId?: string;
  month?: string;
  status?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/hr/payroll`, params],
    () => hrService.getPayroll(params)
  );

  return {
    payroll: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
