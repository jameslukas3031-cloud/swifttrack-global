
-- 1) Add super_admin role and change 'customer' usage to 'user' semantics (keep enum backwards compatible by adding 'user')
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';
