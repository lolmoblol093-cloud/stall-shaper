import { supabase } from '@/integrations/supabase/client';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  stall_code: string;
  stall_id: string | null;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const inquiryService = {
  async getAll(): Promise<Inquiry[]> {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Inquiry[];
  },

  async getById(id: string): Promise<Inquiry | null> {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Inquiry;
  },

  async getPending(): Promise<Inquiry[]> {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Inquiry[];
  },

  async create(inquiryData: Partial<Inquiry>): Promise<Inquiry> {
    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        name: inquiryData.name!,
        email: inquiryData.email!,
        phone: inquiryData.phone || null,
        stall_code: inquiryData.stall_code!,
        stall_id: inquiryData.stall_id || null,
        message: inquiryData.message || null,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Inquiry;
  },

  async update(id: string, inquiryData: Partial<Inquiry>): Promise<Inquiry> {
    const { data, error } = await supabase
      .from('inquiries')
      .update({ ...inquiryData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Inquiry;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inquiries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async updateStatus(id: string, status: string): Promise<Inquiry> {
    return this.update(id, { status });
  },
};

export default inquiryService;
