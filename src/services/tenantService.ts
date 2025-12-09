import { mockTenants, Tenant } from '@/data/mockData';

// Local state for mock data
let tenants = [...mockTenants];

export const tenantService = {
  async getAll(): Promise<Tenant[]> {
    return [...tenants].sort((a, b) => a.business_name.localeCompare(b.business_name));
  },

  async getById(id: string): Promise<Tenant | null> {
    return tenants.find(t => t.id === id) || null;
  },

  async getActive(): Promise<Tenant[]> {
    return tenants
      .filter(t => t.status === 'active')
      .sort((a, b) => a.business_name.localeCompare(b.business_name));
  },

  async getPublicInfo(): Promise<Pick<Tenant, 'id' | 'business_name' | 'stall_number' | 'status'>[]> {
    return tenants
      .filter(t => t.status === 'active')
      .map(t => ({
        id: t.id,
        business_name: t.business_name,
        stall_number: t.stall_number,
        status: t.status,
      }))
      .sort((a, b) => a.business_name.localeCompare(b.business_name));
  },

  async create(data: Partial<Tenant>): Promise<Tenant> {
    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      business_name: data.business_name || '',
      contact_person: data.contact_person || '',
      email: data.email,
      phone: data.phone,
      stall_number: data.stall_number,
      status: data.status || 'active',
      monthly_rent: data.monthly_rent,
      lease_start_date: data.lease_start_date,
      lease_end_date: data.lease_end_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    tenants.push(newTenant);
    return newTenant;
  },

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const index = tenants.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tenant not found');
    
    tenants[index] = {
      ...tenants[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return tenants[index];
  },

  async delete(id: string): Promise<void> {
    tenants = tenants.filter(t => t.id !== id);
  },

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<Tenant> {
    return this.update(id, { status });
  },
};

export default tenantService;
