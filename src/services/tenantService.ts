import { supabase } from '@/integrations/supabase/client';

export interface Tenant {
  id: string;
  business_name: string;
  contact_person: string;
  email: string | null;
  phone: string | null;
  stall_number: string | null;
  monthly_rent: number | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantPublic {
  id: string | null;
  business_name: string | null;
  stall_number: string | null;
  status: string | null;
}

export const tenantService = {
  async getAll(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('business_name');
    
    if (error) throw error;
    return data as Tenant[];
  },

  async getById(id: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Tenant;
  },

  async getActive(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('status', 'active')
      .order('business_name');
    
    if (error) throw error;
    return data as Tenant[];
  },

  async getPublicInfo(): Promise<TenantPublic[]> {
    const { data, error } = await supabase
      .from('tenants_public')
      .select('*');
    
    if (error) throw error;
    return data as TenantPublic[];
  },

  async create(tenantData: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .insert({
        business_name: tenantData.business_name!,
        contact_person: tenantData.contact_person!,
        email: tenantData.email || null,
        phone: tenantData.phone || null,
        stall_number: tenantData.stall_number || null,
        monthly_rent: tenantData.monthly_rent || null,
        lease_start_date: tenantData.lease_start_date || null,
        lease_end_date: tenantData.lease_end_date || null,
        status: tenantData.status || 'active',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Tenant;
  },

  async update(id: string, tenantData: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .update({ ...tenantData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Tenant;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<Tenant> {
    return this.update(id, { status });
  },
};

export default tenantService;
