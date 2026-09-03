-- Keep role-check helpers available to signed-in policy evaluation without
-- exposing SECURITY DEFINER functions through the public API schema.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.is_super_admin(uuid) SET SCHEMA private;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_super_admin(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION private.is_super_admin(uuid) FROM anon;