import { mockPayments, Payment } from '@/data/mockData';

// Local state for mock data
let payments = [...mockPayments];

export const paymentService = {
  async getAll(): Promise<Payment[]> {
    return [...payments].sort((a, b) => 
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );
  },

  async getById(id: string): Promise<Payment | null> {
    return payments.find(p => p.id === id) || null;
  },

  async getByTenant(tenantId: string): Promise<Payment[]> {
    return payments
      .filter(p => p.tenant_id === tenantId)
      .sort((a, b) => 
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      );
  },

  async getRecent(limit: number = 10): Promise<Payment[]> {
    return [...payments]
      .sort((a, b) => 
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      )
      .slice(0, limit);
  },

  async create(data: Partial<Payment>): Promise<Payment> {
    const newPayment: Payment = {
      id: `payment-${Date.now()}`,
      tenant_id: data.tenant_id || '',
      amount: data.amount || 0,
      payment_date: data.payment_date || new Date().toISOString(),
      payment_method: data.payment_method,
      status: data.status || 'pending',
      notes: data.notes,
      created_by: data.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    payments.push(newPayment);
    return newPayment;
  },

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Payment not found');
    
    payments[index] = {
      ...payments[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return payments[index];
  },

  async delete(id: string): Promise<void> {
    payments = payments.filter(p => p.id !== id);
  },

  async updateStatus(id: string, status: Payment['status']): Promise<Payment> {
    return this.update(id, { status });
  },
};

export default paymentService;
