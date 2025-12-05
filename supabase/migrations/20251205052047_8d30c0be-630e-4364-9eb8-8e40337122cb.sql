-- Add 'tenant' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tenant';

-- Create tenant_users table to link auth users to tenants
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant_users
CREATE POLICY "Users can view their own tenant link"
ON public.tenant_users FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage tenant users"
ON public.tenant_users FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Update payments RLS to allow tenants to view their own payments
CREATE POLICY "Tenants can view their own payments"
ON public.payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid()
    AND tu.tenant_id = payments.tenant_id
  )
);

-- Update tenants RLS to allow tenants to view their own record
CREATE POLICY "Tenants can view their own tenant record"
ON public.tenants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid()
    AND tu.tenant_id = tenants.id
  )
);