// Mock data for UI-only mode (no Supabase/Directus)

export interface Stall {
  id: string;
  stall_code: string;
  floor: string;
  monthly_rent: number;
  occupancy_status: 'vacant' | 'occupied';
  electricity_reader: string | null;
  floor_size: string | null;
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
}

export interface Inquiry {
  id: string;
  stall_id: string;
  stall_code: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: 'pending' | 'contacted' | 'resolved';
  created_at: string;
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
    occupancy_status: Math.random() > 0.5 ? 'occupied' : 'vacant',
    electricity_reader: `ER-SF-${index + 1}`,
    floor_size: code === 'Super Market' ? '200 sqm' : `${12 + Math.floor(Math.random() * 15)} sqm`,
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
    occupancy_status: Math.random() > 0.55 ? 'occupied' : 'vacant',
    electricity_reader: `ER-TF-${index + 1}`,
    floor_size: `${8 + Math.floor(Math.random() * 12)} sqm`,
  }));
};

export const mockStalls: Stall[] = [
  ...generateGroundFloorStalls(),
  ...generateSecondFloorStalls(),
  ...generateThirdFloorStalls(),
];

export const mockTenants: Tenant[] = mockStalls
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
    status: 'active',
    monthly_rent: stall.monthly_rent,
  }));

export const mockInquiries: Inquiry[] = [
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
  },
];

// Helper functions to simulate data operations
export const getStalls = () => [...mockStalls];
export const getAvailableStalls = () => mockStalls.filter(s => s.occupancy_status === 'vacant');
export const getStallByCode = (code: string) => mockStalls.find(s => s.stall_code === code);
export const getTenants = () => [...mockTenants];
export const getTenantByStallCode = (code: string) => mockTenants.find(t => t.stall_number === code);
export const getInquiries = () => [...mockInquiries];

export const addInquiry = (inquiry: Omit<Inquiry, 'id' | 'created_at' | 'status'>) => {
  const newInquiry: Inquiry = {
    ...inquiry,
    id: `inq-${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  mockInquiries.push(newInquiry);
  return newInquiry;
};
