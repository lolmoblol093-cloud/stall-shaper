import { createDirectus, rest, staticToken } from '@directus/sdk';

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

export interface Schema {
  stalls: Stall[];
  tenants: Tenant[];
  payments: Payment[];
  inquiries: Inquiry[];
  notifications: Notification[];
  app_settings: AppSetting[];
}

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || '';
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || '';

export const directus = createDirectus<Schema>(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

export default directus;
