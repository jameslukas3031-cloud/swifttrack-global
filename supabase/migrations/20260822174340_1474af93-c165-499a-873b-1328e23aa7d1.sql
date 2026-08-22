
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS clearance_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS clearance_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clearance_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clearance_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS clearance_instructions text;

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  label text NOT NULL,
  instructions text,
  account_details text,
  enabled boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_methods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads enabled methods" ON public.payment_methods FOR SELECT USING (enabled = true);
CREATE POLICY "Admins manage payment methods" ON public.payment_methods FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER payment_methods_updated_at BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.clearance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  method_label text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  reference text,
  payer_name text,
  payer_email text,
  proof_url text,
  note text,
  review_status text NOT NULL DEFAULT 'pending',
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS clearance_payments_ref_uniq
  ON public.clearance_payments (shipment_id, lower(reference)) WHERE reference IS NOT NULL;
GRANT INSERT ON public.clearance_payments TO anon;
GRANT SELECT, INSERT, UPDATE ON public.clearance_payments TO authenticated;
GRANT ALL ON public.clearance_payments TO service_role;
ALTER TABLE public.clearance_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits clearance payment" ON public.clearance_payments FOR INSERT
  WITH CHECK (amount > 0 AND length(method_label) > 0 AND review_status = 'pending' AND reviewed_by IS NULL);
CREATE POLICY "Admins read clearance payments" ON public.clearance_payments FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update clearance payments" ON public.clearance_payments FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins write audit logs" ON public.admin_audit_logs FOR INSERT TO authenticated
  WITH CHECK ((public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin')) AND actor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.review_clearance_payment(_payment_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS public.clearance_payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.clearance_payments;
  s public.shipments;
  total numeric;
BEGIN
  IF NOT (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.clearance_payments
     SET review_status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
         review_note = _note,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   WHERE id = _payment_id
   RETURNING * INTO p;

  IF p.id IS NULL THEN RAISE EXCEPTION 'Payment not found'; END IF;

  SELECT COALESCE(sum(amount),0) INTO total
    FROM public.clearance_payments
   WHERE shipment_id = p.shipment_id AND review_status = 'approved';

  SELECT * INTO s FROM public.shipments WHERE id = p.shipment_id;

  UPDATE public.shipments
     SET clearance_paid = total,
         clearance_status = CASE
           WHEN NOT s.clearance_required THEN 'not_required'
           WHEN total >= s.clearance_fee AND s.clearance_fee > 0 THEN 'cleared'
           WHEN total > 0 THEN 'partially_paid'
           WHEN NOT _approve THEN 'payment_rejected'
           ELSE 'clearance_required' END
   WHERE id = p.shipment_id;

  INSERT INTO public.admin_audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'approve_clearance_payment' ELSE 'reject_clearance_payment' END,
          'clearance_payments', p.id, jsonb_build_object('amount', p.amount, 'shipment_id', p.shipment_id, 'note', _note));

  RETURN p;
END; $$;

REVOKE ALL ON FUNCTION public.review_clearance_payment(uuid, boolean, text) FROM public;
GRANT EXECUTE ON FUNCTION public.review_clearance_payment(uuid, boolean, text) TO authenticated;

INSERT INTO public.payment_methods (kind, label, instructions, sort_order) VALUES
  ('bitcoin','Bitcoin (BTC)','Send the exact amount and paste the transaction hash below.',1),
  ('usdt','USDT (TRC20)','Send USDT on the TRC20 network and paste the transaction hash below.',2),
  ('paypal','PayPal','Send as Goods & Services and paste the PayPal transaction ID below.',3),
  ('bank_transfer','Bank Transfer','Use the tracking number as the payment reference.',4),
  ('gift_card','Gift Card','Enter the gift card code and upload a photo of the card.',5)
ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone uploads payment proof" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs');
CREATE POLICY "Admins read payment proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin')));
