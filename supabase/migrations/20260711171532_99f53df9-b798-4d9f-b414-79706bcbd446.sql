
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('unpaid','paid','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS shipping_fee numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS parcel_image_url text,
  ADD COLUMN IF NOT EXISTS package_type text,
  ADD COLUMN IF NOT EXISTS courier_name text;

DROP POLICY IF EXISTS "Parcel images viewable by authenticated" ON storage.objects;
CREATE POLICY "Parcel images viewable by authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'parcel-images');

DROP POLICY IF EXISTS "Parcel images viewable by anon" ON storage.objects;
CREATE POLICY "Parcel images viewable by anon"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'parcel-images');

DROP POLICY IF EXISTS "Admins can upload parcel images" ON storage.objects;
CREATE POLICY "Admins can upload parcel images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'parcel-images' AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'staff')
  )
);

DROP POLICY IF EXISTS "Admins can update parcel images" ON storage.objects;
CREATE POLICY "Admins can update parcel images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'parcel-images' AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'staff')
  )
);

DROP POLICY IF EXISTS "Admins can delete parcel images" ON storage.objects;
CREATE POLICY "Admins can delete parcel images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'parcel-images' AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'staff')
  )
);
