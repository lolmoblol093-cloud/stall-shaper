-- Drop the permissive RLS policy that exposes PII to anonymous users
DROP POLICY IF EXISTS "Public can view active tenant basic info" ON public.tenants;