import { directus, Stall } from '@/integrations/directus/client';
import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';

export const stallService = {
  async getAll(): Promise<Stall[]> {
    const stalls = await directus.request(
      readItems('stalls', {
        sort: ['stall_code'],
      })
    );
    return stalls as Stall[];
  },

  async getById(id: string): Promise<Stall | null> {
    try {
      const stall = await directus.request(readItem('stalls', id));
      return stall as Stall;
    } catch {
      return null;
    }
  },

  async getByFloor(floor: string): Promise<Stall[]> {
    const stalls = await directus.request(
      readItems('stalls', {
        filter: { floor: { _eq: floor } },
        sort: ['stall_code'],
      })
    );
    return stalls as Stall[];
  },

  async getAvailable(): Promise<Stall[]> {
    const stalls = await directus.request(
      readItems('stalls', {
        filter: { occupancy_status: { _eq: 'vacant' } },
        sort: ['stall_code'],
      })
    );
    return stalls as Stall[];
  },

  async create(data: Partial<Stall>): Promise<Stall> {
    const stall = await directus.request(
      createItem('stalls', {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    );
    return stall as Stall;
  },

  async update(id: string, data: Partial<Stall>): Promise<Stall> {
    const stall = await directus.request(
      updateItem('stalls', id, {
        ...data,
        updated_at: new Date().toISOString(),
      })
    );
    return stall as Stall;
  },

  async delete(id: string): Promise<void> {
    await directus.request(deleteItem('stalls', id));
  },

  async updateOccupancy(id: string, status: 'vacant' | 'occupied'): Promise<Stall> {
    return this.update(id, { occupancy_status: status });
  },
};

export default stallService;
