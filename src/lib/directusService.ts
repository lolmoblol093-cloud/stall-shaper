import directus from './directus';
import { readItems, createItem, updateItem, deleteItem, readItem } from '@directus/sdk';

// Type definitions
export interface Stall {
  id: string;
  stall_code: string;
  floor: string;
  monthly_rent: number;
  electricity_reader: string | null;
  floor_size: string | null;
  occupancy_status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  business_name: string;
  contact_person: string;
  email: string | null;
  phone: string | null;
  stall_number: string | null;
  status: string | null;
  monthly_rent: number | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  status: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  tenants?: Tenant;
}

export interface Inquiry {
  id: string;
  stall_id: string | null;
  stall_code: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

// Stalls Service
export const stallsService = {
  async getAll(): Promise<Stall[]> {
    try {
      const result = await directus.request(readItems('stalls', { sort: ['stall_code'] }));
      return result as Stall[];
    } catch (error) {
      console.error('Error fetching stalls:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Stall | null> {
    try {
      const result = await directus.request(readItem('stalls', id));
      return result as Stall;
    } catch (error) {
      console.error('Error fetching stall:', error);
      return null;
    }
  },

  async getByCode(stallCode: string): Promise<Stall | null> {
    try {
      const result = await directus.request(readItems('stalls', {
        filter: { stall_code: { _eq: stallCode } },
        limit: 1
      }));
      return (result as Stall[])[0] || null;
    } catch (error) {
      console.error('Error fetching stall by code:', error);
      return null;
    }
  },

  async update(id: string, data: Partial<Stall>): Promise<Stall | null> {
    try {
      const result = await directus.request(updateItem('stalls', id, data));
      return result as Stall;
    } catch (error) {
      console.error('Error updating stall:', error);
      return null;
    }
  },

  async getVacant(): Promise<Stall[]> {
    try {
      const result = await directus.request(readItems('stalls', {
        filter: { occupancy_status: { _eq: 'vacant' } },
        sort: ['stall_code']
      }));
      return result as Stall[];
    } catch (error) {
      console.error('Error fetching vacant stalls:', error);
      return [];
    }
  }
};

// Tenants Service
export const tenantsService = {
  async getAll(): Promise<Tenant[]> {
    try {
      const result = await directus.request(readItems('tenants', { sort: ['-created_at'] }));
      return result as Tenant[];
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return [];
    }
  },

  async getActive(): Promise<Tenant[]> {
    try {
      const result = await directus.request(readItems('tenants', {
        filter: { status: { _eq: 'active' } },
        sort: ['business_name']
      }));
      return result as Tenant[];
    } catch (error) {
      console.error('Error fetching active tenants:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Tenant | null> {
    try {
      const result = await directus.request(readItem('tenants', id));
      return result as Tenant;
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }
  },

  async create(data: Partial<Tenant>): Promise<Tenant | null> {
    try {
      const result = await directus.request(createItem('tenants', data));
      return result as Tenant;
    } catch (error) {
      console.error('Error creating tenant:', error);
      return null;
    }
  },

  async update(id: string, data: Partial<Tenant>): Promise<Tenant | null> {
    try {
      const result = await directus.request(updateItem('tenants', id, data));
      return result as Tenant;
    } catch (error) {
      console.error('Error updating tenant:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await directus.request(deleteItem('tenants', id));
      return true;
    } catch (error) {
      console.error('Error deleting tenant:', error);
      return false;
    }
  }
};

// Payments Service
export const paymentsService = {
  async getAll(): Promise<Payment[]> {
    try {
      const result = await directus.request(readItems('payments', { 
        sort: ['-payment_date'],
        fields: ['*', 'tenants.*']
      }));
      return result as Payment[];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },

  async getByTenantId(tenantId: string): Promise<Payment[]> {
    try {
      const result = await directus.request(readItems('payments', {
        filter: { tenant_id: { _eq: tenantId } },
        sort: ['-payment_date']
      }));
      return result as Payment[];
    } catch (error) {
      console.error('Error fetching tenant payments:', error);
      return [];
    }
  },

  async create(data: Partial<Payment>): Promise<Payment | null> {
    try {
      const result = await directus.request(createItem('payments', data));
      return result as Payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      return null;
    }
  }
};

// Inquiries Service
export const inquiriesService = {
  async getAll(): Promise<Inquiry[]> {
    try {
      const result = await directus.request(readItems('inquiries', { sort: ['-created_at'] }));
      return result as Inquiry[];
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      return [];
    }
  },

  async create(data: Partial<Inquiry>): Promise<Inquiry | null> {
    try {
      const result = await directus.request(createItem('inquiries', data));
      return result as Inquiry;
    } catch (error) {
      console.error('Error creating inquiry:', error);
      return null;
    }
  },

  async update(id: string, data: Partial<Inquiry>): Promise<Inquiry | null> {
    try {
      const result = await directus.request(updateItem('inquiries', id, data));
      return result as Inquiry;
    } catch (error) {
      console.error('Error updating inquiry:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await directus.request(deleteItem('inquiries', id));
      return true;
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      return false;
    }
  }
};

// Notifications Service
export const notificationsService = {
  async getAll(limit: number = 20): Promise<Notification[]> {
    try {
      const result = await directus.request(readItems('notifications', {
        sort: ['-created_at'],
        limit
      }));
      return result as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  async markAsRead(id: string): Promise<boolean> {
    try {
      await directus.request(updateItem('notifications', id, { is_read: true }));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  async markAllAsRead(ids: string[]): Promise<boolean> {
    try {
      for (const id of ids) {
        await directus.request(updateItem('notifications', id, { is_read: true }));
      }
      return true;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }
};

// App Settings Service
export const appSettingsService = {
  async getAll(): Promise<AppSetting[]> {
    try {
      const result = await directus.request(readItems('app_settings', { sort: ['key'] }));
      return result as AppSetting[];
    } catch (error) {
      console.error('Error fetching app settings:', error);
      return [];
    }
  },

  async getByKey(key: string): Promise<AppSetting | null> {
    try {
      const result = await directus.request(readItems('app_settings', {
        filter: { key: { _eq: key } },
        limit: 1
      }));
      return (result as AppSetting[])[0] || null;
    } catch (error) {
      console.error('Error fetching app setting:', error);
      return null;
    }
  },

  async upsert(key: string, value: Record<string, any>, description?: string): Promise<boolean> {
    try {
      const existing = await this.getByKey(key);
      if (existing) {
        await directus.request(updateItem('app_settings', existing.id, { value, description }));
      } else {
        await directus.request(createItem('app_settings', { key, value, description }));
      }
      return true;
    } catch (error) {
      console.error('Error upserting app setting:', error);
      return false;
    }
  }
};

// Profiles Service
export const profilesService = {
  async getByUserId(userId: string): Promise<Profile | null> {
    try {
      const result = await directus.request(readItems('profiles', {
        filter: { user_id: { _eq: userId } },
        limit: 1
      }));
      return (result as Profile[])[0] || null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  async upsert(userId: string, data: Partial<Profile>): Promise<boolean> {
    try {
      const existing = await this.getByUserId(userId);
      if (existing) {
        await directus.request(updateItem('profiles', existing.id, data));
      } else {
        await directus.request(createItem('profiles', { ...data, user_id: userId }));
      }
      return true;
    } catch (error) {
      console.error('Error upserting profile:', error);
      return false;
    }
  }
};

// Tenant Users Service
export const tenantUsersService = {
  async getByUserId(userId: string): Promise<{ tenant_id: string } | null> {
    try {
      const result = await directus.request(readItems('tenant_users', {
        filter: { user_id: { _eq: userId } },
        limit: 1
      }));
      return (result as any[])[0] || null;
    } catch (error) {
      console.error('Error fetching tenant user:', error);
      return null;
    }
  }
};

// Export auth helpers using Directus auth
export const authService = {
  async getCurrentUser() {
    try {
      const token = localStorage.getItem('directus_token');
      if (!token) return null;
      
      const { readMe } = await import('@directus/sdk');
      const user = await directus.request(readMe());
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async signOut() {
    try {
      const { logout } = await import('@directus/sdk');
      await directus.request(logout());
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      localStorage.removeItem('directus_token');
      localStorage.removeItem('directus_refresh_token');
    }
  }
};
