-- Allow public read access to stalls (for guest directory view)
CREATE POLICY "Public can view all stalls"
ON public.stalls
FOR SELECT
TO public
USING (true);

-- Allow public read access to tenants (for guest directory view)
CREATE POLICY "Public can view all tenants"
ON public.tenants
FOR SELECT
TO public
USING (true);