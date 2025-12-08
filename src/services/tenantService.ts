import { directus, Tenant } from '@/integrations/directus/client';
import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';

export const tenantService = {
  async getAll(): Promise<Tenant[]> {
    const tenants = await directus.request(
      readItems('tenants', {
        sort: ['business_name'],
      })
    );
    return tenants as Tenant[];
  },

  async getById(id: string): Promise<Tenant | null> {
    try {
      const tenant = await directus.request(readItem('tenants', id));
      return tenant as Tenant;
    } catch {
      return null;
    }
  },

  async getActive(): Promise<Tenant[]> {
    const tenants = await directus.request(
      readItems('tenants', {
        filter: { status: { _eq: 'active' } },
        sort: ['business_name'],
      })
    );
    return tenants as Tenant[];
  },

  async getPublicInfo(): Promise<Pick<Tenant, 'id' | 'business_name' | 'stall_number' | 'status'>[]> {
    const tenants = await directus.request(
      readItems('tenants', {
        filter: { status: { _eq: 'active' } },
        fields: ['id', 'business_name', 'stall_number', 'status'],
        sort: ['business_name'],
      })
    );
    return tenants as Pick<Tenant, 'id' | 'business_name' | 'stall_number' | 'status'>[];
  },

  async create(data: Partial<Tenant>): Promise<Tenant> {
    const tenant = await directus.request(
      createItem('tenants', {
        ...data,
        status: data.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    );
    return tenant as Tenant;
  },

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const tenant = await directus.request(
      updateItem('tenants', id, {
        ...data,
        updated_at: new Date().toISOString(),
      })
    );
    return tenant as Tenant;
  },

  async delete(id: string): Promise<void> {
    await directus.request(deleteItem('tenants', id));
  },

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<Tenant> {
    return this.update(id, { status });
  },
};

export default tenantService;
