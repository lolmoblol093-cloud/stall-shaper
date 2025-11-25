-- Insert second floor stalls (Super Market and c1-c19) if they don't already exist
INSERT INTO public.stalls (stall_code, floor, monthly_rent, occupancy_status, floor_size)
VALUES 
  ('Super Market', 'Second Floor', 15000, 'vacant', '200 sqm'),
  ('c1', 'Second Floor', 5000, 'vacant', '25 sqm'),
  ('c2', 'Second Floor', 4500, 'vacant', '20 sqm'),
  ('c3', 'Second Floor', 3000, 'vacant', '12 sqm'),
  ('c4', 'Second Floor', 3000, 'vacant', '12 sqm'),
  ('c5', 'Second Floor', 3000, 'vacant', '12 sqm'),
  ('c6', 'Second Floor', 3000, 'vacant', '12 sqm'),
  ('c7', 'Second Floor', 3000, 'vacant', '12 sqm'),
  ('c8', 'Second Floor', 3000, 'vacant', '12 sqm'),
  ('c9', 'Second Floor', 3000, 'vacant', '12 sqm'),
  ('c10', 'Second Floor', 3000, 'vacant', '12 sqm'),
  ('c11', 'Second Floor', 3000, 'vacant', '12 sqm'),
  ('c12', 'Second Floor', 3000, 'vacant', '12 sqm'),
  ('c13', 'Second Floor', 3000, 'vacant', '12 sqm'),
  ('c14', 'Second Floor', 3000, 'vacant', '12 sqm'),
  ('c15', 'Second Floor', 8000, 'vacant', '60 sqm'),
  ('c16', 'Second Floor', 6000, 'vacant', '40 sqm'),
  ('c17', 'Second Floor', 5000, 'vacant', '30 sqm'),
  ('c18', 'Second Floor', 4000, 'vacant', '25 sqm'),
  ('c19', 'Second Floor', 4500, 'vacant', '30 sqm')
ON CONFLICT (stall_code) DO NOTHING;