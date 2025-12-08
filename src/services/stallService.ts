import { supabase } from '@/integrations/supabase/client';

export interface Stall {
  id: string;
  stall_code: string;
  floor: string;
  monthly_rent: number;
  occupancy_status: string;
  electricity_reader: string | null;
  floor_size: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const stallService = {
  async getAll(): Promise<Stall[]> {
    const { data, error } = await supabase
      .from('stalls')
      .select('*')
      .order('stall_code');
    
    if (error) throw error;
    return data as Stall[];
  },

  async getById(id: string): Promise<Stall | null> {
    const { data, error } = await supabase
      .from('stalls')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Stall;
  },

  async getByFloor(floor: string): Promise<Stall[]> {
    const { data, error } = await supabase
      .from('stalls')
      .select('*')
      .eq('floor', floor)
      .order('stall_code');
    
    if (error) throw error;
    return data as Stall[];
  },

  async getAvailable(): Promise<Stall[]> {
    const { data, error } = await supabase
      .from('stalls')
      .select('*')
      .eq('occupancy_status', 'vacant')
      .order('stall_code');
    
    if (error) throw error;
    return data as Stall[];
  },

  async create(stallData: Partial<Stall>): Promise<Stall> {
    const { data, error } = await supabase
      .from('stalls')
      .insert({
        stall_code: stallData.stall_code!,
        floor: stallData.floor!,
        monthly_rent: stallData.monthly_rent!,
        occupancy_status: stallData.occupancy_status || 'vacant',
        electricity_reader: stallData.electricity_reader || null,
        floor_size: stallData.floor_size || null,
        image_url: stallData.image_url || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Stall;
  },

  async update(id: string, stallData: Partial<Stall>): Promise<Stall> {
    const { data, error } = await supabase
      .from('stalls')
      .update({ ...stallData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Stall;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('stalls')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async updateOccupancy(id: string, status: 'vacant' | 'occupied'): Promise<Stall> {
    return this.update(id, { occupancy_status: status });
  },
};

export default stallService;
