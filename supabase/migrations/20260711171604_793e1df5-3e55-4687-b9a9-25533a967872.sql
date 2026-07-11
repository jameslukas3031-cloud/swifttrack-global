
DROP POLICY IF EXISTS "Public can read shipments" ON public.shipments;
CREATE POLICY "Public can read shipments"
ON public.shipments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public can read tracking events" ON public.tracking_events;
CREATE POLICY "Public can read tracking events"
ON public.tracking_events FOR SELECT
USING (true);

GRANT SELECT ON public.shipments TO anon;
GRANT SELECT ON public.tracking_events TO anon;
