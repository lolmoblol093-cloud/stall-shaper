import { createDirectus, rest, staticToken, authentication } from '@directus/sdk';

export interface Stall {
  id: string;
  stall_code: string;
  floor: string;
  monthly_rent: number;
  occupancy_status: 'vacant' | 'occupied';
  electricity_reader?: string;
  floor_size?: string;
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
  status: 'active' | 'inactive';
  monthly_rent?: number;
  lease_start_date?: string;
  lease_end_date?: string;
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
  type: 'info' | 'warning' | 'error' | 'inquiry';
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
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantUser {
  id: string;
  user_id: string;
  tenant_id: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'tenant' | 'guest';
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

export interface DirectusUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export interface Schema {
  stalls: Stall[];
  tenants: Tenant[];
  payments: Payment[];
  inquiries: Inquiry[];
  notifications: Notification[];
  app_settings: AppSetting[];
  profiles: Profile[];
  tenant_users: TenantUser[];
  user_roles: UserRole[];
  login_attempts: LoginAttempt[];
  directus_users: DirectusUser[];
}

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || '';
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || '';

// Admin client with static token for backend operations
export const directus = createDirectus<Schema>(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

// Auth client for user authentication
export const directusAuth = createDirectus<Schema>(DIRECTUS_URL)
  .with(authentication('json'))
  .with(rest());

export default directus;
