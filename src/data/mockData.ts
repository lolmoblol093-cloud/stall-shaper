// Mock data for UI-only mode

export interface Stall {
  id: string;
  stall_code: string;
  floor: string;
  monthly_rent: number;
  occupancy_status: 'vacant' | 'occupied';
  electricity_reader?: string;
  floor_size?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  business_name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  stall_number?: string;
  status: 'active' | 'inactive';
  monthly_rent?: number;
  lease_start_date?: string;
  lease_end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  stall_id?: string;
  stall_code: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  status: 'pending' | 'contacted' | 'resolved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'inquiry';
  is_read: boolean;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

// Generate ground floor stalls (b1-b86)
const generateGroundFloorStalls = (): Stall[] => {
  const stalls: Stall[] = [];
  for (let i = 1; i <= 86; i++) {
    stalls.push({
      id: `stall-g-${i}`,
      stall_code: `b${i}`,
      floor: 'Ground Floor',
      monthly_rent: 5000 + Math.floor(Math.random() * 3000),
      occupancy_status: Math.random() > 0.3 ? 'occupied' : 'vacant',
      floor_size: `${10 + Math.floor(Math.random() * 10)} sqm`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  return stalls;
};

// Generate second floor stalls (Super Market, c1-c19)
const generateSecondFloorStalls = (): Stall[] => {
  const stalls: Stall[] = [
    {
      id: 'stall-s-sm',
      stall_code: 'Super Market',
      floor: 'Second Floor',
      monthly_rent: 25000,
      occupancy_status: 'occupied',
      floor_size: '150 sqm',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  for (let i = 1; i <= 19; i++) {
    stalls.push({
      id: `stall-s-${i}`,
      stall_code: `c${i}`,
      floor: 'Second Floor',
      monthly_rent: 6000 + Math.floor(Math.random() * 4000),
      occupancy_status: Math.random() > 0.4 ? 'occupied' : 'vacant',
      floor_size: `${12 + Math.floor(Math.random() * 8)} sqm`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  return stalls;
};

// Generate third floor stalls (d1-d21, d23-d54)
const generateThirdFloorStalls = (): Stall[] => {
  const stalls: Stall[] = [];
  for (let i = 1; i <= 54; i++) {
    if (i === 22) continue; // Skip d22
    stalls.push({
      id: `stall-t-${i}`,
      stall_code: `d${i}`,
      floor: 'Third Floor',
      monthly_rent: 4500 + Math.floor(Math.random() * 2500),
      occupancy_status: Math.random() > 0.35 ? 'occupied' : 'vacant',
      floor_size: `${8 + Math.floor(Math.random() * 6)} sqm`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  return stalls;
};

export const mockStalls: Stall[] = [
  ...generateGroundFloorStalls(),
  ...generateSecondFloorStalls(),
  ...generateThirdFloorStalls(),
];

// Generate tenants for occupied stalls
const occupiedStalls = mockStalls.filter(s => s.occupancy_status === 'occupied');
const businessNames = [
  'Fresh Fruits Co.', 'Daily Goods Store', 'Fashion Hub', 'Tech Zone', 'Beauty Corner',
  'Food Express', 'Home Essentials', 'Kids World', 'Sports Gear', 'Gift Gallery',
  'Jewelry Box', 'Book Haven', 'Pet Supplies', 'Health Plus', 'Shoe Palace',
  'Coffee Corner', 'Bakery Delight', 'Phone Accessories', 'Watch World', 'Bag Boutique',
];

export const mockTenants: Tenant[] = occupiedStalls.slice(0, 25).map((stall, index) => ({
  id: `tenant-${index + 1}`,
  business_name: businessNames[index % businessNames.length],
  contact_person: `Person ${index + 1}`,
  email: `tenant${index + 1}@example.com`,
  phone: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
  stall_number: stall.stall_code,
  status: 'active',
  monthly_rent: stall.monthly_rent,
  lease_start_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  lease_end_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

// Generate payments
export const mockPayments: Payment[] = mockTenants.slice(0, 15).flatMap((tenant, index) => {
  const payments: Payment[] = [];
  for (let i = 0; i < 3; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    payments.push({
      id: `payment-${tenant.id}-${i}`,
      tenant_id: tenant.id,
      amount: tenant.monthly_rent || 5000,
      payment_date: date.toISOString(),
      payment_method: ['cash', 'bank_transfer', 'gcash'][Math.floor(Math.random() * 3)],
      status: i === 0 ? 'pending' : 'completed',
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    });
  }
  return payments;
});

// Generate inquiries
export const mockInquiries: Inquiry[] = mockStalls
  .filter(s => s.occupancy_status === 'vacant')
  .slice(0, 8)
  .map((stall, index) => ({
    id: `inquiry-${index + 1}`,
    stall_id: stall.id,
    stall_code: stall.stall_code,
    name: `Inquirer ${index + 1}`,
    email: `inquirer${index + 1}@example.com`,
    phone: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
    message: `I am interested in renting stall ${stall.stall_code}. Please contact me for more details.`,
    status: ['pending', 'contacted', 'resolved'][Math.floor(Math.random() * 3)] as Inquiry['status'],
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }));

// Generate notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'New Inquiry',
    message: 'A new inquiry has been submitted for stall b12',
    type: 'inquiry',
    is_read: false,
    reference_id: 'inquiry-1',
    reference_type: 'inquiry',
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Payment Received',
    message: 'Payment of ₱5,000 received from Fresh Fruits Co.',
    type: 'info',
    is_read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Lease Expiring',
    message: 'Lease for stall c5 is expiring in 30 days',
    type: 'warning',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
