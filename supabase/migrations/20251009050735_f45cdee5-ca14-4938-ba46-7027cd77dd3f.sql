-- Grant admin role to the existing admin user
-- First, check if the user exists and add admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@exmaple.com'
ON CONFLICT (user_id, role) DO NOTHING;