
-- Helper: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') $$;

-- Replace handle_new_user: assign super_admin to designated email, else 'user'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_email text := 'samaster30@gmail.com';
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  IF lower(NEW.email) = target_email THEN
    assigned_role := 'super_admin';
  ELSE
    assigned_role := 'user';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: promote existing account if present
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = 'samaster30@gmail.com' LIMIT 1;
  IF uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Protect the super_admin role from deletion/update
CREATE OR REPLACE FUNCTION public.protect_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.role = 'super_admin' THEN
    -- Only allow delete if the acting user is themselves super_admin AND another super_admin exists
    IF NOT public.is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Cannot remove super_admin role';
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.role = 'super_admin' AND NEW.role <> 'super_admin' THEN
    RAISE EXCEPTION 'Cannot demote super_admin role';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS protect_super_admin_trg ON public.user_roles;
CREATE TRIGGER protect_super_admin_trg
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin();

-- Reset RLS policies on user_roles: users can read own, super_admin manages all, nobody edits own role
DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;

CREATE POLICY "Users read own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Super admin reads all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin inserts roles" ON public.user_roles
FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) AND user_id <> auth.uid());

CREATE POLICY "Super admin updates roles" ON public.user_roles
FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()) AND user_id <> auth.uid())
WITH CHECK (public.is_super_admin(auth.uid()) AND user_id <> auth.uid());

CREATE POLICY "Super admin deletes roles" ON public.user_roles
FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()) AND user_id <> auth.uid());

-- Tighten shipments: only super_admin manages; users read/create own
DROP POLICY IF EXISTS "Admins manage shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users create shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users read own shipments" ON public.shipments;

CREATE POLICY "Users read own shipments" ON public.shipments
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin manages shipments" ON public.shipments
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Tighten profiles: super_admin reads all
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Super admin reads all profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- Tighten tracking_events: only super_admin inserts
DROP POLICY IF EXISTS "Staff insert events" ON public.tracking_events;
CREATE POLICY "Super admin inserts events" ON public.tracking_events
FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));
