DROP POLICY "Anyone reads enabled support channels" ON public.support_settings;

CREATE POLICY "Public reads enabled support channels" ON public.support_settings
FOR SELECT TO anon, authenticated USING (enabled = true);

CREATE POLICY "Admins read all support settings" ON public.support_settings
FOR SELECT TO authenticated USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));