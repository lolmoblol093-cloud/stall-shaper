-- Create login_attempts table for tracking tenant portal login security
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
CREATE POLICY "Admins can view all login attempts"
ON public.login_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow inserts from anyone (needed for tracking failed attempts before auth)
CREATE POLICY "Anyone can insert login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- Admins can delete old login attempts
CREATE POLICY "Admins can delete login attempts"
ON public.login_attempts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient querying by email and time
CREATE INDEX idx_login_attempts_email_created ON public.login_attempts(email, created_at DESC);

-- Create a function to check if account is locked (5 failed attempts in 15 minutes)
CREATE OR REPLACE FUNCTION public.is_account_locked(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) >= 5
  FROM public.login_attempts
  WHERE email = check_email
    AND success = false
    AND created_at > (now() - interval '15 minutes');
$$;