
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'employee' | 'manager';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}
