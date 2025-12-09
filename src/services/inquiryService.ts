import { mockInquiries, Inquiry } from '@/data/mockData';

// Local state for mock data
let inquiries = [...mockInquiries];

export const inquiryService = {
  async getAll(): Promise<Inquiry[]> {
    return [...inquiries].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async getById(id: string): Promise<Inquiry | null> {
    return inquiries.find(i => i.id === id) || null;
  },

  async getPending(): Promise<Inquiry[]> {
    return inquiries
      .filter(i => i.status === 'pending')
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  },

  async create(data: Partial<Inquiry>): Promise<Inquiry> {
    const newInquiry: Inquiry = {
      id: `inquiry-${Date.now()}`,
      stall_id: data.stall_id,
      stall_code: data.stall_code || '',
      name: data.name || '',
      email: data.email || '',
      phone: data.phone,
      message: data.message,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inquiries.push(newInquiry);
    return newInquiry;
  },

  async update(id: string, data: Partial<Inquiry>): Promise<Inquiry> {
    const index = inquiries.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Inquiry not found');
    
    inquiries[index] = {
      ...inquiries[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return inquiries[index];
  },

  async delete(id: string): Promise<void> {
    inquiries = inquiries.filter(i => i.id !== id);
  },

  async updateStatus(id: string, status: Inquiry['status']): Promise<Inquiry> {
    return this.update(id, { status });
  },
};

export default inquiryService;
