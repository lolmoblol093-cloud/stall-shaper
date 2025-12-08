import { directus, Payment } from '@/integrations/directus/client';
import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';

export const paymentService = {
  async getAll(): Promise<Payment[]> {
    const payments = await directus.request(
      readItems('payments', {
        sort: ['-payment_date'],
      })
    );
    return payments as Payment[];
  },

  async getById(id: string): Promise<Payment | null> {
    try {
      const payment = await directus.request(readItem('payments', id));
      return payment as Payment;
    } catch {
      return null;
    }
  },

  async getByTenant(tenantId: string): Promise<Payment[]> {
    const payments = await directus.request(
      readItems('payments', {
        filter: { tenant_id: { _eq: tenantId } },
        sort: ['-payment_date'],
      })
    );
    return payments as Payment[];
  },

  async getRecent(limit: number = 10): Promise<Payment[]> {
    const payments = await directus.request(
      readItems('payments', {
        sort: ['-payment_date'],
        limit,
      })
    );
    return payments as Payment[];
  },

  async create(data: Partial<Payment>): Promise<Payment> {
    const payment = await directus.request(
      createItem('payments', {
        ...data,
        status: data.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    );
    return payment as Payment;
  },

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    const payment = await directus.request(
      updateItem('payments', id, {
        ...data,
        updated_at: new Date().toISOString(),
      })
    );
    return payment as Payment;
  },

  async delete(id: string): Promise<void> {
    await directus.request(deleteItem('payments', id));
  },

  async updateStatus(id: string, status: Payment['status']): Promise<Payment> {
    return this.update(id, { status });
  },
};

export default paymentService;
