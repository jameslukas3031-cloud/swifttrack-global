CREATE TABLE public.support_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  value text NOT NULL DEFAULT '',
  label text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.support_settings TO anon;
GRANT SELECT ON public.support_settings TO authenticated;
GRANT ALL ON public.support_settings TO service_role;

ALTER TABLE public.support_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads enabled support channels" ON public.support_settings
FOR SELECT TO anon, authenticated USING (enabled = true OR is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage support settings" ON public.support_settings
FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

GRANT INSERT, UPDATE, DELETE ON public.support_settings TO authenticated;

CREATE TRIGGER support_settings_updated_at BEFORE UPDATE ON public.support_settings
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.support_settings (channel, enabled, value, label, sort_order) VALUES
  ('email', false, '', 'Email support', 1),
  ('whatsapp', false, '', 'WhatsApp support', 2),
  ('telegram', false, '', 'Telegram support', 3);