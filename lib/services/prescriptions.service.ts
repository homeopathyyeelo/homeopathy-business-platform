// Prescriptions & Doctor Module API Service
import { api, PaginatedResponse } from '../api-client';

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  chiefComplaints: string;
  symptoms: string[];
  diagnosis?: string;
  medicines: PrescriptionMedicine[];
  advice?: string;
  followUpDate?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionMedicine {
  id: string;
  productId: string;
  productName: string;
  potency: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
}

export interface Patient {
  id: string;
  code: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalHistory?: string;
  lastVisit?: string;
  totalVisits: number;
  isActive: boolean;
  createdAt: string;
}

export interface PrescriptionTemplate {
  id: string;
  name: string;
  category: string;
  chiefComplaints: string;
  commonSymptoms: string[];
  medicines: PrescriptionMedicine[];
  advice: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

export interface RemedySuggestion {
  remedyName: string;
  potency: string;
  confidence: number;
  reasoning: string;
  matchedSymptoms: string[];
  dosage?: string;
  duration?: string;
}

export const prescriptionsService = {
  // Prescriptions
  getPrescriptions: async (params?: {
    page?: number;
    limit?: number;
    patientId?: string;
    doctorId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Prescription>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<Prescription>>(`/prescriptions?${queryParams}`);
  },

  getPrescription: async (id: string): Promise<Prescription> => {
    return api.get<Prescription>(`/prescriptions/${id}`);
  },

  createPrescription: async (data: Partial<Prescription>): Promise<Prescription> => {
    return api.post<Prescription>('/prescriptions', data);
  },

  updatePrescription: async (id: string, data: Partial<Prescription>): Promise<Prescription> => {
    return api.put<Prescription>(`/prescriptions/${id}`, data);
  },

  deletePrescription: async (id: string): Promise<void> => {
    return api.delete(`/prescriptions/${id}`);
  },

  printPrescription: async (id: string): Promise<void> => {
    return api.download(`/prescriptions/${id}/print`, `prescription-${id}.pdf`);
  },

  // Patients
  getPatients: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Patient>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<Patient>>(`/prescriptions/patients?${queryParams}`);
  },

  getPatient: async (id: string): Promise<Patient> => {
    return api.get<Patient>(`/prescriptions/patients/${id}`);
  },

  createPatient: async (data: Partial<Patient>): Promise<Patient> => {
    return api.post<Patient>('/prescriptions/patients', data);
  },

  updatePatient: async (id: string, data: Partial<Patient>): Promise<Patient> => {
    return api.put<Patient>(`/prescriptions/patients/${id}`, data);
  },

  getPatientHistory: async (patientId: string): Promise<Prescription[]> => {
    return api.get<Prescription[]>(`/prescriptions/patients/${patientId}/history`);
  },

  // Prescription Templates
  getTemplates: async (category?: string): Promise<PrescriptionTemplate[]> => {
    const params = category ? `?category=${category}` : '';
    return api.get<PrescriptionTemplate[]>(`/prescriptions/templates${params}`);
  },

  getTemplate: async (id: string): Promise<PrescriptionTemplate> => {
    return api.get<PrescriptionTemplate>(`/prescriptions/templates/${id}`);
  },

  createTemplate: async (data: Partial<PrescriptionTemplate>): Promise<PrescriptionTemplate> => {
    return api.post<PrescriptionTemplate>('/prescriptions/templates', data);
  },

  updateTemplate: async (id: string, data: Partial<PrescriptionTemplate>): Promise<PrescriptionTemplate> => {
    return api.put<PrescriptionTemplate>(`/prescriptions/templates/${id}`, data);
  },

  deleteTemplate: async (id: string): Promise<void> => {
    return api.delete(`/prescriptions/templates/${id}`);
  },

  // AI Remedy Suggestions
  getRemedySuggestions: async (data: {
    symptoms: string[];
    chiefComplaints: string;
    patientAge?: number;
    patientGender?: string;
  }): Promise<RemedySuggestion[]> => {
    return api.post<RemedySuggestion[]>('/prescriptions/ai/suggest-remedies', data);
  },

  getRemedyDetails: async (remedyName: string): Promise<any> => {
    return api.get(`/prescriptions/remedies/${remedyName}`);
  },

  searchRemedies: async (query: string): Promise<any[]> => {
    return api.get(`/prescriptions/remedies/search?q=${query}`);
  },

  // Medicine Mapping
  getMedicineMappings: async (): Promise<any[]> => {
    return api.get('/prescriptions/medicine-mappings');
  },

  createMedicineMapping: async (data: {
    remedyName: string;
    productId: string;
    potency: string;
  }): Promise<any> => {
    return api.post('/prescriptions/medicine-mappings', data);
  },

  // Doctor Dashboard
  getDoctorDashboard: async (doctorId: string): Promise<any> => {
    return api.get(`/prescriptions/doctors/${doctorId}/dashboard`);
  },

  getDoctorAppointments: async (doctorId: string, date?: string): Promise<any[]> => {
    const params = date ? `?date=${date}` : '';
    return api.get(`/prescriptions/doctors/${doctorId}/appointments${params}`);
  },

  // Reports
  getPrescriptionReport: async (params: {
    startDate: string;
    endDate: string;
    doctorId?: string;
  }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/prescriptions/reports?${queryParams}`);
  },
};
