
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "Anyone submit contact" ON public.contact_messages;
CREATE POLICY "Anyone submit contact" ON public.contact_messages FOR INSERT
  WITH CHECK (length(name) > 0 AND length(email) > 3 AND length(message) > 0);
