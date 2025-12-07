-- Fix 1: Create a public view for tenants with limited fields (no PII)
CREATE OR REPLACE VIEW public.tenants_public AS
SELECT 
    id,
    business_name,
    stall_number,
    status
FROM public.tenants
WHERE status = 'active';

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.tenants_public TO anon, authenticated;

-- Fix 2: Drop the overly permissive public policy on tenants table
DROP POLICY IF EXISTS "Public can view all tenants" ON public.tenants;