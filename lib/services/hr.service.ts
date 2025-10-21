// HR & Staff Management API Service
import { api, PaginatedResponse } from '../api-client';

export interface Employee {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  dateOfBirth: string;
  address: string;
  salary: number;
  roleId: string;
  branchId: string;
  isActive: boolean;
  createdAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  workHours?: number;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  remarks?: string;
}

export interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'casual' | 'sick' | 'earned' | 'unpaid';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  createdAt: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paidDate?: string;
  createdAt: string;
}

export const hrService = {
  // Employees
  getEmployees: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    branchId?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Employee>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<Employee>>(`/hr/employees?${queryParams}`);
  },

  getEmployee: async (id: string): Promise<Employee> => {
    return api.get<Employee>(`/hr/employees/${id}`);
  },

  createEmployee: async (data: Partial<Employee>): Promise<Employee> => {
    return api.post<Employee>('/hr/employees', data);
  },

  updateEmployee: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    return api.put<Employee>(`/hr/employees/${id}`, data);
  },

  deleteEmployee: async (id: string): Promise<void> => {
    return api.delete(`/hr/employees/${id}`);
  },

  // Attendance
  getAttendance: async (params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Attendance[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<Attendance[]>(`/hr/attendance?${queryParams}`);
  },

  checkIn: async (employeeId: string): Promise<Attendance> => {
    return api.post<Attendance>('/hr/attendance/check-in', { employeeId });
  },

  checkOut: async (attendanceId: string): Promise<Attendance> => {
    return api.post<Attendance>(`/hr/attendance/${attendanceId}/check-out`);
  },

  markAttendance: async (data: Partial<Attendance>): Promise<Attendance> => {
    return api.post<Attendance>('/hr/attendance', data);
  },

  // Leave Management
  getLeaves: async (params?: {
    employeeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Leave[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<Leave[]>(`/hr/leaves?${queryParams}`);
  },

  applyLeave: async (data: Partial<Leave>): Promise<Leave> => {
    return api.post<Leave>('/hr/leaves', data);
  },

  approveLeave: async (id: string): Promise<Leave> => {
    return api.post<Leave>(`/hr/leaves/${id}/approve`);
  },

  rejectLeave: async (id: string, reason: string): Promise<Leave> => {
    return api.post<Leave>(`/hr/leaves/${id}/reject`, { reason });
  },

  // Payroll
  getPayroll: async (params?: {
    employeeId?: string;
    month?: string;
    status?: string;
  }): Promise<Payroll[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<Payroll[]>(`/hr/payroll?${queryParams}`);
  },

  generatePayroll: async (month: string): Promise<any> => {
    return api.post('/hr/payroll/generate', { month });
  },

  processPayroll: async (id: string): Promise<Payroll> => {
    return api.post<Payroll>(`/hr/payroll/${id}/process`);
  },

  downloadPayslip: async (id: string): Promise<void> => {
    return api.download(`/hr/payroll/${id}/payslip`, `payslip-${id}.pdf`);
  },
};
