-- Fix the security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.tenants_public;

CREATE VIEW public.tenants_public 
WITH (security_invoker = true) AS
SELECT 
    id,
    business_name,
    stall_number,
    status
FROM public.tenants
WHERE status = 'active';

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.tenants_public TO anon, authenticated;

-- Create an RLS policy to allow public read on tenants_public via the base table
-- Since RLS is on the base table, we need a policy for anon users to read active tenants
CREATE POLICY "Public can view active tenant basic info"
ON public.tenants
FOR SELECT
TO anon
USING (status = 'active');