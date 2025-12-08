import { directus, Inquiry } from '@/integrations/directus/client';
import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';

export const inquiryService = {
  async getAll(): Promise<Inquiry[]> {
    const inquiries = await directus.request(
      readItems('inquiries', {
        sort: ['-created_at'],
      })
    );
    return inquiries as Inquiry[];
  },

  async getById(id: string): Promise<Inquiry | null> {
    try {
      const inquiry = await directus.request(readItem('inquiries', id));
      return inquiry as Inquiry;
    } catch {
      return null;
    }
  },

  async getPending(): Promise<Inquiry[]> {
    const inquiries = await directus.request(
      readItems('inquiries', {
        filter: { status: { _eq: 'pending' } },
        sort: ['-created_at'],
      })
    );
    return inquiries as Inquiry[];
  },

  async create(data: Partial<Inquiry>): Promise<Inquiry> {
    const inquiry = await directus.request(
      createItem('inquiries', {
        ...data,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    );
    return inquiry as Inquiry;
  },

  async update(id: string, data: Partial<Inquiry>): Promise<Inquiry> {
    const inquiry = await directus.request(
      updateItem('inquiries', id, {
        ...data,
        updated_at: new Date().toISOString(),
      })
    );
    return inquiry as Inquiry;
  },

  async delete(id: string): Promise<void> {
    await directus.request(deleteItem('inquiries', id));
  },

  async updateStatus(id: string, status: Inquiry['status']): Promise<Inquiry> {
    return this.update(id, { status });
  },
};

export default inquiryService;
