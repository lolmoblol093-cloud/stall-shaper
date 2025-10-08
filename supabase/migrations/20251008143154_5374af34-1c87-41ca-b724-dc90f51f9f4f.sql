-- Create stalls table
CREATE TABLE IF NOT EXISTS public.stalls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stall_code text NOT NULL UNIQUE,
  floor text NOT NULL,
  monthly_rent numeric NOT NULL,
  electricity_reader text,
  floor_size text,
  occupancy_status text NOT NULL DEFAULT 'vacant',
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stalls_occupancy_status_check CHECK (occupancy_status IN ('occupied', 'vacant'))
);

-- Enable Row Level Security
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;

-- Create policies for stalls
CREATE POLICY "Admins can view all stalls"
ON public.stalls
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert stalls"
ON public.stalls
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update stalls"
ON public.stalls
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete stalls"
ON public.stalls
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_stalls_updated_at
BEFORE UPDATE ON public.stalls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial stalls
INSERT INTO public.stalls (stall_code, floor, monthly_rent, electricity_reader, floor_size, occupancy_status) VALUES
('1', 'Ground Floor', 2200, 'ERD001', '3m × 3m', 'vacant'),
('2', 'Ground Floor', 2200, 'ERD002', '3m × 3m', 'vacant'),
('3', 'Ground Floor', 2200, 'ERD003', '3m × 3m', 'vacant'),
('4', 'Ground Floor', 2800, 'ERD004', '4m × 3m', 'vacant'),
('5', 'Ground Floor', 2800, 'ERD005', '4m × 4m', 'vacant'),
('6', 'Ground Floor', 2800, 'ERD006', '4m × 3m', 'vacant'),
('7', 'Ground Floor', 2200, 'ERD007', '3m × 3m', 'vacant'),
('8', 'Ground Floor', 2500, 'ERD008', '3m × 4m', 'vacant'),
('9', 'Second Floor', 1800, 'ERD009', '2.5m × 3m', 'vacant'),
('10', 'Second Floor', 1800, 'ERD010', '2.5m × 3m', 'vacant'),
('11', 'Second Floor', 2000, 'ERD011', '3m × 4m', 'vacant'),
('12', 'Second Floor', 2000, 'ERD012', '3m × 4m', 'vacant'),
('13', 'Second Floor', 1800, 'ERD013', '3m × 4m', 'vacant'),
('14', 'Second Floor', 1800, 'ERD014', '2.5m × 3m', 'vacant'),
('15', 'Second Floor', 1800, 'ERD015', '2.5m × 3m', 'vacant');