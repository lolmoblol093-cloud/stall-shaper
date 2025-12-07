// Directus collection types matching current database schema

export interface Stall {
  id: string;
  stall_code: string;
  floor: string;
  monthly_rent: number;
  electricity_reader?: string;
  floor_size?: string;
  occupancy_status: 'vacant' | 'occupied';
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  business_name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  stall_number?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  monthly_rent?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  stall_id?: string;
  stall_code: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  status: 'pending' | 'contacted' | 'resolved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'tenant' | 'guest';
  created_at: string;
}

export interface TenantUser {
  id: string;
  user_id: string;
  tenant_id: string;
  created_at: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  failure_reason?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// Directus schema definition
export interface DirectusSchema {
  stalls: Stall[];
  tenants: Tenant[];
  payments: Payment[];
  inquiries: Inquiry[];
  notifications: Notification[];
  app_settings: AppSetting[];
  user_roles: UserRole[];
  tenant_users: TenantUser[];
  login_attempts: LoginAttempt[];
  profiles: Profile[];
}
