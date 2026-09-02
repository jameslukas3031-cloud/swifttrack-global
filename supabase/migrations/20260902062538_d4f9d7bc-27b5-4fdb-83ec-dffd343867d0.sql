-- Remove the broad anonymous data paths and their table grants.
DROP POLICY IF EXISTS "Public can read shipments" ON public.shipments;
DROP POLICY IF EXISTS "Public can read tracking events" ON public.tracking_events;
REVOKE SELECT ON public.shipments FROM anon;
REVOKE SELECT ON public.tracking_events FROM anon;

-- Public tracking uses this narrow, exact-number lookup instead of table reads.
CREATE OR REPLACE FUNCTION public.get_shipment_by_tracking_number(_tracking_number text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF _tracking_number IS NULL OR length(btrim(_tracking_number)) = 0 OR length(btrim(_tracking_number)) > 100 THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'shipment', jsonb_build_object(
      'id', s.id,
      'tracking_number', s.tracking_number,
      'status', s.status,
      'service_type', s.service_type,
      'sender_name', s.sender_name,
      'sender_address', s.sender_address,
      'sender_city', s.sender_city,
      'sender_country', s.sender_country,
      'sender_phone', s.sender_phone,
      'recipient_name', s.recipient_name,
      'recipient_address', s.recipient_address,
      'recipient_city', s.recipient_city,
      'recipient_country', s.recipient_country,
      'recipient_phone', s.recipient_phone,
      'shipping_fee', s.shipping_fee,
      'payment_status', s.payment_status,
      'amount_paid', s.amount_paid,
      'parcel_image_url', s.parcel_image_url,
      'weight_kg', s.weight_kg,
      'dimensions', s.dimensions,
      'package_type', s.package_type,
      'package_description', s.package_description,
      'shipping_method', s.shipping_method,
      'courier_name', s.courier_name,
      'estimated_delivery', s.estimated_delivery,
      'created_at', s.created_at,
      'updated_at', s.updated_at,
      'admin_comments', s.admin_comments,
      'clearance_required', s.clearance_required,
      'clearance_fee', s.clearance_fee,
      'clearance_paid', s.clearance_paid,
      'clearance_status', s.clearance_status,
      'clearance_instructions', s.clearance_instructions,
      'origin_lat', s.origin_lat,
      'origin_lng', s.origin_lng,
      'destination_lat', s.destination_lat,
      'destination_lng', s.destination_lng,
      'current_lat', s.current_lat,
      'current_lng', s.current_lng
    ),
    'events', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', e.id,
        'status', e.status,
        'location', e.location,
        'description', e.description,
        'event_time', e.event_time
      ) ORDER BY e.event_time ASC)
      FROM public.tracking_events e
      WHERE e.shipment_id = s.id
    ), '[]'::jsonb)
  ) INTO result
  FROM public.shipments s
  WHERE s.tracking_number = btrim(_tracking_number)
  LIMIT 1;

  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_shipment_by_tracking_number(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shipment_by_tracking_number(text) TO anon;

-- Clearance claims are tied to the authenticated owner of the shipment.
DROP POLICY IF EXISTS "Anyone submits clearance payment" ON public.clearance_payments;
REVOKE INSERT ON public.clearance_payments FROM anon;
CREATE POLICY "Shipment owners submit clearance payment" ON public.clearance_payments
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.shipments s
    WHERE s.id = shipment_id AND s.user_id = auth.uid()
  )
  AND amount > 0
  AND length(method_label) > 0
  AND review_status = 'pending'
  AND reviewed_by IS NULL
);

-- Parcel images may be viewed only by the shipment owner or authorized staff/admins.
DROP POLICY IF EXISTS "Parcel images viewable by anon" ON storage.objects;
DROP POLICY IF EXISTS "Parcel images viewable by authenticated" ON storage.objects;
CREATE POLICY "Shipment owners and staff view parcel images" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'parcel-images'
  AND (
    public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
    OR EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.user_id = auth.uid()
        AND s.id::text = (storage.objects.name)::text
        AND position('/' IN storage.objects.name) > 0
    )
  )
);

-- Payment proof uploads require authentication and a first path segment matching an owned shipment.
DROP POLICY IF EXISTS "Anyone uploads payment proof" ON storage.objects;
CREATE POLICY "Shipment owners upload payment proof" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1 FROM public.shipments s
    WHERE s.user_id = auth.uid()
      AND s.id::text = split_part(storage.objects.name, '/', 1)
  )
);

-- Security-sensitive helper functions are not callable by client roles.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_super_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.review_clearance_payment(uuid, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_clearance_payment(uuid, boolean, text) TO service_role;
