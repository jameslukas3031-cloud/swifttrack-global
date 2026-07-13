
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS sender_phone text,
  ADD COLUMN IF NOT EXISTS recipient_phone text,
  ADD COLUMN IF NOT EXISTS package_description text,
  ADD COLUMN IF NOT EXISTS amount_paid numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_comments text,
  ADD COLUMN IF NOT EXISTS shipping_method text,
  ADD COLUMN IF NOT EXISTS admin_signature_url text;

ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'created';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'at_warehouse';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'customs_clearance';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'arrived_distribution_center';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'delivery_failed';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'on_hold';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'delayed';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'returned_to_sender';
