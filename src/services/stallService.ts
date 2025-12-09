import { mockStalls, Stall } from '@/data/mockData';

// Local state for mock data
let stalls = [...mockStalls];

export const stallService = {
  async getAll(): Promise<Stall[]> {
    return [...stalls].sort((a, b) => a.stall_code.localeCompare(b.stall_code));
  },

  async getById(id: string): Promise<Stall | null> {
    return stalls.find(s => s.id === id) || null;
  },

  async getByFloor(floor: string): Promise<Stall[]> {
    return stalls
      .filter(s => s.floor === floor)
      .sort((a, b) => a.stall_code.localeCompare(b.stall_code));
  },

  async getAvailable(): Promise<Stall[]> {
    return stalls
      .filter(s => s.occupancy_status === 'vacant')
      .sort((a, b) => a.stall_code.localeCompare(b.stall_code));
  },

  async create(data: Partial<Stall>): Promise<Stall> {
    const newStall: Stall = {
      id: `stall-${Date.now()}`,
      stall_code: data.stall_code || '',
      floor: data.floor || 'Ground Floor',
      monthly_rent: data.monthly_rent || 0,
      occupancy_status: data.occupancy_status || 'vacant',
      electricity_reader: data.electricity_reader,
      floor_size: data.floor_size,
      image_url: data.image_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    stalls.push(newStall);
    return newStall;
  },

  async update(id: string, data: Partial<Stall>): Promise<Stall> {
    const index = stalls.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Stall not found');
    
    stalls[index] = {
      ...stalls[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return stalls[index];
  },

  async delete(id: string): Promise<void> {
    stalls = stalls.filter(s => s.id !== id);
  },

  async updateOccupancy(id: string, status: 'vacant' | 'occupied'): Promise<Stall> {
    return this.update(id, { occupancy_status: status });
  },
};

export default stallService;
