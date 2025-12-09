// Mock data for UI-only mode (no Supabase/Directus)

export interface Stall {
  id: string;
  stall_code: string;
  floor: string;
  monthly_rent: number;
  occupancy_status: 'vacant' | 'occupied';
  electricity_reader: string | null;
  floor_size: string | null;
  image_url: string | null;
}

export interface Tenant {
  id: string;
  business_name: string;
  contact_person: string;
  email: string | null;
  phone: string | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  stall_number: string | null;
  status: 'active' | 'inactive';
  monthly_rent: number | null;
  created_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: 'completed' | 'pending' | 'failed';
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Inquiry {
  id: string;
  stall_id: string | null;
  stall_code: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: 'pending' | 'contacted' | 'resolved' | 'rejected';
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

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
}

export interface AppSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  updated_by: string | null;
}

// Generate ground floor stalls (b1-b86)
const generateGroundFloorStalls = (): Stall[] => {
  const stalls: Stall[] = [];
  for (let i = 1; i <= 86; i++) {
    stalls.push({
      id: `gf-${i}`,
      stall_code: `b${i}`,
      floor: 'Ground Floor',
      monthly_rent: 5000 + Math.floor(Math.random() * 10000),
      occupancy_status: Math.random() > 0.6 ? 'occupied' : 'vacant',
      electricity_reader: `ER-GF-${i}`,
      floor_size: `${10 + Math.floor(Math.random() * 20)} sqm`,
      image_url: null,
    });
  }
  return stalls;
};

// Generate second floor stalls
const generateSecondFloorStalls = (): Stall[] => {
  const stallCodes = ['Super Market', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 
    'c10', 'c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18', 'c19'];
  return stallCodes.map((code, index) => ({
    id: `sf-${index + 1}`,
    stall_code: code,
    floor: 'Second Floor',
    monthly_rent: code === 'Super Market' ? 50000 : 6000 + Math.floor(Math.random() * 8000),
    occupancy_status: Math.random() > 0.5 ? 'occupied' : 'vacant' as 'occupied' | 'vacant',
    electricity_reader: `ER-SF-${index + 1}`,
    floor_size: code === 'Super Market' ? '200 sqm' : `${12 + Math.floor(Math.random() * 15)} sqm`,
    image_url: null,
  }));
};

// Generate third floor stalls (d1-d54, skipping d22)
const generateThirdFloorStalls = (): Stall[] => {
  const stallCodes: string[] = [];
  for (let i = 1; i <= 54; i++) {
    if (i !== 22) {
      stallCodes.push(`d${i}`);
    }
  }
  return stallCodes.map((code, index) => ({
    id: `tf-${index + 1}`,
    stall_code: code,
    floor: 'Third Floor',
    monthly_rent: 4000 + Math.floor(Math.random() * 6000),
    occupancy_status: Math.random() > 0.55 ? 'occupied' : 'vacant' as 'occupied' | 'vacant',
    electricity_reader: `ER-TF-${index + 1}`,
    floor_size: `${8 + Math.floor(Math.random() * 12)} sqm`,
    image_url: null,
  }));
};

export let mockStalls: Stall[] = [
  ...generateGroundFloorStalls(),
  ...generateSecondFloorStalls(),
  ...generateThirdFloorStalls(),
];

export let mockTenants: Tenant[] = mockStalls
  .filter(s => s.occupancy_status === 'occupied')
  .map((stall, index) => ({
    id: `tenant-${index + 1}`,
    business_name: `Business ${index + 1}`,
    contact_person: `Contact Person ${index + 1}`,
    email: `tenant${index + 1}@example.com`,
    phone: `+63 912 345 ${String(index).padStart(4, '0')}`,
    lease_start_date: '2024-01-01',
    lease_end_date: '2025-12-31',
    stall_number: stall.stall_code,
    status: 'active' as const,
    monthly_rent: stall.monthly_rent,
    created_at: new Date().toISOString(),
  }));

export let mockPayments: Payment[] = mockTenants.slice(0, 10).flatMap((tenant, tIndex) => 
  Array.from({ length: 3 }, (_, pIndex) => ({
    id: `payment-${tIndex}-${pIndex}`,
    tenant_id: tenant.id,
    amount: tenant.monthly_rent || 5000,
    payment_date: new Date(2024, 9 - pIndex, 15).toISOString().split('T')[0],
    payment_method: ['cash', 'bank_transfer', 'check'][pIndex % 3],
    status: 'completed' as const,
    notes: null,
    created_at: new Date(2024, 9 - pIndex, 15).toISOString(),
    created_by: 'admin-1',
  }))
);

export let mockInquiries: Inquiry[] = [
  {
    id: 'inq-1',
    stall_id: 'gf-1',
    stall_code: 'b1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+63 912 000 0001',
    message: 'I am interested in renting this stall for my food business.',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inq-2',
    stall_id: 'sf-1',
    stall_code: 'c1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+63 912 000 0002',
    message: 'Please contact me regarding this stall.',
    status: 'contacted',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export let mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'New Inquiry',
    message: 'John Doe submitted an inquiry for stall b1',
    type: 'inquiry',
    is_read: false,
    reference_id: 'inq-1',
    reference_type: 'inquiry',
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Payment Received',
    message: 'Payment of ₱5,000 received from Business 1',
    type: 'payment',
    is_read: true,
    reference_id: 'payment-0-0',
    reference_type: 'payment',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export let mockProfile: Profile = {
  id: 'profile-1',
  user_id: 'admin-1',
  full_name: 'Admin User',
  email: 'admin@example.com',
};

export let mockAppSettings: AppSetting[] = [
  {
    id: 'setting-1',
    key: 'property_name',
    value: { name: 'Property Management System' },
    description: 'Property management system name',
    updated_by: 'admin-1',
  },
];

// Mock user for authentication
export const mockUsers = {
  admin: {
    id: 'admin-1',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  },
  tenant: {
    id: 'tenant-user-1',
    email: 'tenant1@example.com',
    password: 'tenant123',
    role: 'tenant',
    tenant_id: 'tenant-1',
  },
};

// Helper functions to simulate data operations
export const getStalls = () => [...mockStalls];
export const getAvailableStalls = () => mockStalls.filter(s => s.occupancy_status === 'vacant');
export const getStallByCode = (code: string) => mockStalls.find(s => s.stall_code === code);
export const getTenants = () => [...mockTenants];
export const getTenantByStallCode = (code: string) => mockTenants.find(t => t.stall_number === code);
export const getTenantById = (id: string) => mockTenants.find(t => t.id === id);
export const getInquiries = () => [...mockInquiries];
export const getPayments = () => [...mockPayments];
export const getNotifications = () => [...mockNotifications];

export const addInquiry = (inquiry: Omit<Inquiry, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
  const newInquiry: Inquiry = {
    ...inquiry,
    id: `inq-${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockInquiries = [newInquiry, ...mockInquiries];
  
  // Add notification
  const newNotification: Notification = {
    id: `notif-${Date.now()}`,
    title: 'New Inquiry',
    message: `${inquiry.name} submitted an inquiry for stall ${inquiry.stall_code}`,
    type: 'inquiry',
    is_read: false,
    reference_id: newInquiry.id,
    reference_type: 'inquiry',
    created_at: new Date().toISOString(),
  };
  mockNotifications = [newNotification, ...mockNotifications];
  
  return newInquiry;
};

export const updateInquiryStatus = (id: string, status: Inquiry['status']) => {
  mockInquiries = mockInquiries.map(inq => 
    inq.id === id ? { ...inq, status, updated_at: new Date().toISOString() } : inq
  );
};

export const deleteInquiry = (id: string) => {
  mockInquiries = mockInquiries.filter(inq => inq.id !== id);
};

export const addTenant = (tenant: Omit<Tenant, 'id' | 'created_at'>) => {
  const newTenant: Tenant = {
    ...tenant,
    id: `tenant-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  mockTenants = [newTenant, ...mockTenants];
  
  // Update stall occupancy if stall assigned
  if (tenant.stall_number) {
    mockStalls = mockStalls.map(s => 
      s.stall_code === tenant.stall_number ? { ...s, occupancy_status: 'occupied' as const } : s
    );
  }
  
  return newTenant;
};

export const updateTenant = (id: string, updates: Partial<Tenant>) => {
  mockTenants = mockTenants.map(t => 
    t.id === id ? { ...t, ...updates } : t
  );
};

export const deleteTenant = (id: string) => {
  const tenant = mockTenants.find(t => t.id === id);
  if (tenant?.stall_number) {
    mockStalls = mockStalls.map(s => 
      s.stall_code === tenant.stall_number ? { ...s, occupancy_status: 'vacant' as const } : s
    );
  }
  mockTenants = mockTenants.filter(t => t.id !== id);
};

export const updateStall = (id: string, updates: Partial<Stall>) => {
  mockStalls = mockStalls.map(s => 
    s.id === id ? { ...s, ...updates } : s
  );
};

export const addPayment = (payment: Omit<Payment, 'id' | 'created_at'>) => {
  const newPayment: Payment = {
    ...payment,
    id: `payment-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  mockPayments = [newPayment, ...mockPayments];
  return newPayment;
};

export const markNotificationAsRead = (id: string) => {
  mockNotifications = mockNotifications.map(n => 
    n.id === id ? { ...n, is_read: true } : n
  );
};

export const markAllNotificationsAsRead = () => {
  mockNotifications = mockNotifications.map(n => ({ ...n, is_read: true }));
};

export const updateProfile = (updates: Partial<Profile>) => {
  mockProfile = { ...mockProfile, ...updates };
};

export const updateAppSetting = (key: string, value: any) => {
  const existing = mockAppSettings.find(s => s.key === key);
  if (existing) {
    mockAppSettings = mockAppSettings.map(s => 
      s.key === key ? { ...s, value } : s
    );
  } else {
    mockAppSettings.push({
      id: `setting-${Date.now()}`,
      key,
      value,
      description: null,
      updated_by: 'admin-1',
    });
  }
};
