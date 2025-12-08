import { supabase } from '@/integrations/supabase/client';

export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  status: 'pending' | 'completed' | 'failed' | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const paymentService = {
  async getAll(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    return data as Payment[];
  },

  async getById(id: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Payment;
  },

  async getByTenant(tenantId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    return data as Payment[];
  },

  async getRecent(limit: number = 10): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as Payment[];
  },

  async create(paymentData: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        tenant_id: paymentData.tenant_id!,
        amount: paymentData.amount!,
        payment_date: paymentData.payment_date!,
        payment_method: paymentData.payment_method || null,
        status: paymentData.status || 'pending',
        notes: paymentData.notes || null,
        created_by: paymentData.created_by || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Payment;
  },

  async update(id: string, paymentData: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update({ ...paymentData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Payment;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async updateStatus(id: string, status: 'pending' | 'completed' | 'failed'): Promise<Payment> {
    return this.update(id, { status });
  },
};

export default paymentService;
